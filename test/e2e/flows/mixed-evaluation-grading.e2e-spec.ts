/*
 * Funcionalidad: Flujo e2e de evaluación mixta de principio a fin
 * Descripción: Un docente crea una evaluación con preguntas de opción única, verdadero/falso y respuesta abierta, la deja lista y la asigna a su grupo; el estudiante recibe la notificación por Socket.io, la presenta (calificación automática y PENDING_REVIEW), el docente califica la pregunta abierta y publica; el estudiante recibe la notificación de nota, la retroalimentación queda READY con el proveedor de IA falso y la nota aparece en /api/me/summary y en la analítica, validando cada respuesta contra el contrato OpenAPI
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationQuestion, type EvaluationQuestionOption, type Group, type User } from "@prisma/client";
import { type Response } from "supertest";

import { createStudent, createStudentGroup, createTeacher } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { waitUntil } from "../../support/polling";
import { connectRecordingSocket, type RecordingSocket } from "../../support/realtime";

interface NotificationPayload {
  readonly type: string;
  readonly data?: Record<string, unknown>;
}

interface FeedbackItem {
  readonly status: string;
  readonly source?: string | null;
}

interface FeedbackBody {
  readonly overall: FeedbackItem | null;
  readonly questions: FeedbackItem[];
}

type QuestionWithOptions = EvaluationQuestion & { options: EvaluationQuestionOption[] };

const HOUR_MS: number = 3_600_000;

function richText(text: string): object {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

function correctOptionIds(question: QuestionWithOptions): string[] {
  return question.options.filter((option: EvaluationQuestionOption): boolean => option.isCorrect).map((option: EvaluationQuestionOption): string => option.id);
}

describe("flow: mixed evaluation from authoring to published feedback", () => {
  let e2e: E2eApp;
  let api: ContractCaller;
  let teacher: User;
  let student: User;
  let group: Group;
  let teacherToken: string;
  let studentToken: string;
  let socket: RecordingSocket | undefined;

  beforeAll(async () => {
    e2e = await createE2eApp();
    api = contractCaller(e2e.baseUrl);
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
    teacher = await createTeacher(e2e.prisma);
    student = await createStudent(e2e.prisma);
    ({ group } = await createStudentGroup(e2e.prisma, { members: [student], createdBy: teacher }));
    teacherToken = await mintAccessToken(teacher, e2e.app);
    studentToken = await mintAccessToken(student, e2e.app);
  });

  afterEach(() => {
    socket?.close();
  });

  afterAll(async () => {
    await e2e?.close();
  });

  async function authorEvaluation(): Promise<{ evaluationId: string; questions: QuestionWithOptions[] }> {
    const created: Response = await api("POST", "/api/evaluations", teacherToken, { type: "EXAM", title: "Ventilación protectora", maxAttempts: 1, showResultsImmediately: false });

    expectStatus(created, 201);

    const evaluationId: string = created.body.data.id as string;
    const questionBodies: object[] = [
      { type: "SINGLE_CHOICE", prompt: richText("PEEP inicial recomendada"), points: 1, options: [{ content: "5 cmH2O", isCorrect: true }, { content: "25 cmH2O", isCorrect: false }] },
      { type: "TRUE_FALSE", prompt: richText("El volumen corriente se ajusta por peso ideal"), points: 1, options: [{ content: "Verdadero", isCorrect: true }, { content: "Falso", isCorrect: false }] },
      { type: "OPEN_TEXT", prompt: richText("Explique la estrategia de ventilación protectora"), points: 2 },
    ];

    for (const body of questionBodies) {
      expectStatus(await api("POST", `/api/evaluations/${evaluationId}/questions`, teacherToken, body), 201);
    }

    expectStatus(await api("PATCH", `/api/evaluations/${evaluationId}/status`, teacherToken, { status: "READY" }), 200);

    const questions: QuestionWithOptions[] = await e2e.prisma.evaluationQuestion.findMany({ where: { evaluationId }, include: { options: true }, orderBy: { order: "asc" } });

    return { evaluationId, questions };
  }

  it("should grade, publish, notify, generate feedback and expose the grade in summary and analytics", async () => {
    const { evaluationId, questions } = await authorEvaluation();
    const [singleChoice, trueFalse, openText]: QuestionWithOptions[] = questions;
    const notificationSocket: RecordingSocket = await connectRecordingSocket(e2e.baseUrl, studentToken);

    socket = notificationSocket;

    const assigned: Response = await api("POST", `/api/evaluations/${evaluationId}/assignments`, teacherToken, {
      groupIds: [group.id],
      startsAt: new Date(Date.now() - 60_000).toISOString(),
      endsAt: new Date(Date.now() + HOUR_MS).toISOString(),
    });

    expectStatus(assigned, 201);
    await notificationSocket.next<NotificationPayload>("notification:new", (payload: NotificationPayload): boolean => payload.type === "EVALUATION_ACTIVATED");

    const assignment: { id: string } = await e2e.prisma.evaluationAssignment.findFirstOrThrow({ where: { evaluationId, groupId: group.id }, select: { id: true } });
    const mine: Response = await api("GET", "/api/my-evaluations", studentToken);

    expectStatus(mine, 200);
    expect(JSON.stringify(mine.body.data)).toContain(assignment.id);

    const started: Response = await api("POST", `/api/my-evaluations/${assignment.id}/attempts`, studentToken);

    expectStatus(started, 201);

    const attemptId: string = started.body.data.id as string;
    const submitted: Response = await api("POST", `/api/evaluation-attempts/${attemptId}/submit`, studentToken, {
      answers: [
        { questionId: singleChoice.id, selectedOptionIds: correctOptionIds(singleChoice) },
        { questionId: trueFalse.id, selectedOptionIds: correctOptionIds(trueFalse) },
        { questionId: openText.id, textAnswer: "Volumen corriente de 6 ml/kg de peso ideal y presión meseta menor de 30 cmH2O." },
      ],
    });

    expectStatus(submitted, 200);
    expect(submitted.body.data).toMatchObject({ attemptId, status: "PENDING_REVIEW", published: false });
    expect(await e2e.prisma.evaluationAnswer.findMany({ where: { attemptId, questionId: { in: [singleChoice.id, trueFalse.id] } }, select: { autoScore: true } })).toEqual([{ autoScore: 1 }, { autoScore: 1 }]);

    const queue: Response = await api("GET", `/api/evaluation-grading/queue?evaluationId=${evaluationId}`, teacherToken);

    expectStatus(queue, 200);
    expect(JSON.stringify(queue.body.data)).toContain(attemptId);

    expectStatus(await api("PUT", `/api/evaluation-grading/attempts/${attemptId}/answers/${openText.id}`, teacherToken, { manualScore: 1.5, comment: "Falta mencionar la PEEP" }), 200);
    expect((await e2e.prisma.studentEvaluationAttempt.findUniqueOrThrow({ where: { id: attemptId } })).status).toBe("GRADED");

    const gradeNotification: Promise<NotificationPayload> = notificationSocket.next<NotificationPayload>("notification:new", (payload: NotificationPayload): boolean => payload.type === "GRADE_PUBLISHED");
    const published: Response = await api("POST", `/api/evaluation-grading/attempts/${attemptId}/publish`, teacherToken);

    expectStatus(published, 200);
    expect(published.body.data).toMatchObject({ attemptId, alreadyPublished: false });
    await expect(gradeNotification).resolves.toMatchObject({ type: "GRADE_PUBLISHED" });

    const feedback: Response = await waitUntil(
      (): Promise<Response> => api("GET", `/api/evaluation-attempts/${attemptId}/feedback`, studentToken),
      (response: Response): boolean => {
        const body: FeedbackBody | undefined = response.status === 200 ? (response.body.data as FeedbackBody) : undefined;

        return body !== undefined && body.overall?.status === "READY" && body.questions.every((item: FeedbackItem): boolean => item.status === "READY");
      },
      { description: "grade feedback READY" },
    );

    expect((feedback.body.data as FeedbackBody).overall?.source).toMatch(/^(LLM|DETERMINISTIC)$/);

    const summary: Response = await api("GET", "/api/me/summary", studentToken);

    expectStatus(summary, 200);
    expect(summary.body.data.grades).toEqual(expect.arrayContaining([expect.objectContaining({ evaluationId, grade: expect.any(Number), passed: expect.any(Boolean) })]));

    const stats: Response = await api("GET", `/api/analytics/evaluations/${evaluationId}/stats`, teacherToken);

    expectStatus(stats, 200);
    expect(stats.body.data).toMatchObject({ totalAttempts: 1, gradedCount: 1, publishedCount: 1 });
  });
});
