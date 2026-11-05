/*
 * Funcionalidad: Prueba de seguridad de la liberación de resultados de evaluación
 * Descripción: Para QUIZ, WORKSHOP y EXAM, un estudiante presenta un intento con todas las respuestas correctas y, antes de que el docente libere, ninguna respuesta de la API del estudiante (detalle del intento, entrega, lista, notas, resumen, feedback y el banco heredado de quizzes) contiene la clave correcta, explicaciones, rúbricas, puntajes, nota ni aprobado; la ruta de revisión inmediata ya no existe. Luego el docente libera solo la nota (el estudiante ve la nota y nada de la corrección ni del feedback) y después la nota con las respuestas (ve todo); también la liberación por evaluación. Cada respuesta se valida contra el contrato OpenAPI. Ajustes C1
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
import { callApi } from "../../support/http";

type QuestionWithOptions = EvaluationQuestion & { options: EvaluationQuestionOption[] };
type EvaluationTypeValue = "QUIZ" | "WORKSHOP" | "EXAM";

const HOUR_MS: number = 3_600_000;
const EXPLANATION: string = "La PEEP mantiene abiertos los alvéolos al final de la espiración";
// Any of these keys in a student response before the release is a leak of the correction or the grade.
const CORRECTION_KEYS: readonly string[] = ["isCorrect", "correctOptionIds", "correctOptionId", "explanation", "rubric", "earnedScore", "feedback", "reveal", "partialClosedScore", "correctAnswers", "gradedQuestions"];
const GRADE_KEYS: readonly string[] = ["score", "maxScore", "grade", "passed"];

function richText(text: string): object {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

function collectKeys(value: unknown, keys: Set<string> = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item: unknown) => collectKeys(item, keys));
  } else if (value !== null && typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested !== undefined) {
        keys.add(key);
      }

      collectKeys(nested, keys);
    }
  }

  return keys;
}

function expectNoKeys(body: unknown, forbidden: readonly string[], where: string): void {
  const present: string[] = [...collectKeys(body)].filter((key: string) => forbidden.includes(key));

  expect({ where, present }).toEqual({ where, present: [] });
}

describe("security: evaluation results stay hidden until the teacher releases them", () => {
  let e2e: E2eApp;
  let api: ContractCaller;
  let teacher: User;
  let student: User;
  let group: Group;
  let teacherToken: string;
  let studentToken: string;

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

  afterAll(async () => {
    await e2e?.close();
  });

  async function assignedEvaluation(type: EvaluationTypeValue): Promise<{ evaluationId: string; assignmentId: string; questions: QuestionWithOptions[] }> {
    // showResultsImmediately: true used to publish at once; it must have no effect now.
    const created: Response = await api("POST", "/api/evaluations", teacherToken, { type, title: `Liberación ${type}`, maxAttempts: 1, showResultsImmediately: true });

    expectStatus(created, 201);

    const evaluationId: string = created.body.data.id as string;
    const bodies: object[] = [
      {
        type: "SINGLE_CHOICE",
        prompt: richText("¿Qué efecto tiene la PEEP?"),
        points: 1,
        explanation: EXPLANATION,
        hint: "Piense en el final de la espiración",
        options: [
          { content: "Mantiene abiertos los alvéolos", isCorrect: true },
          { content: "Aumenta el espacio muerto anatómico", isCorrect: false },
        ],
      },
      { type: "TRUE_FALSE", prompt: richText("La presión meseta se mide sin flujo"), points: 1, explanation: EXPLANATION, options: [{ content: "Verdadero", isCorrect: true }, { content: "Falso", isCorrect: false }] },
    ];

    for (const body of bodies) {
      expectStatus(await api("POST", `/api/evaluations/${evaluationId}/questions`, teacherToken, body), 201);
    }

    expectStatus(await api("PATCH", `/api/evaluations/${evaluationId}/status`, teacherToken, { status: "READY" }), 200);
    expectStatus(
      await api("POST", `/api/evaluations/${evaluationId}/assignments`, teacherToken, {
        groupIds: [group.id],
        startsAt: new Date(Date.now() - 60_000).toISOString(),
        endsAt: new Date(Date.now() + HOUR_MS).toISOString(),
      }),
      201,
    );

    const assignment: { id: string } = await e2e.prisma.evaluationAssignment.findFirstOrThrow({ where: { evaluationId, groupId: group.id }, select: { id: true } });
    const questions: QuestionWithOptions[] = await e2e.prisma.evaluationQuestion.findMany({ where: { evaluationId }, include: { options: true }, orderBy: { order: "asc" } });

    return { evaluationId, assignmentId: assignment.id, questions };
  }

  async function submitCorrectAttempt(assignmentId: string, questions: QuestionWithOptions[]): Promise<{ attemptId: string; submitted: Response }> {
    const started: Response = await api("POST", `/api/my-evaluations/${assignmentId}/attempts`, studentToken);

    expectStatus(started, 201);

    const attemptId: string = started.body.data.id as string;
    const inProgress: Response = await api("GET", `/api/evaluation-attempts/${attemptId}`, studentToken);

    expectStatus(inProgress, 200);
    expectNoKeys(inProgress.body.data, CORRECTION_KEYS, "attempt in progress");
    expectNoKeys(inProgress.body.data, GRADE_KEYS, "attempt in progress");

    const answers: object[] = questions.map((question: QuestionWithOptions) => ({
      questionId: question.id,
      selectedOptionIds: question.options.filter((option: EvaluationQuestionOption) => option.isCorrect).map((option: EvaluationQuestionOption) => option.id),
    }));
    const submitted: Response = await api("POST", `/api/evaluation-attempts/${attemptId}/submit`, studentToken, { answers });

    expectStatus(submitted, 200);

    return { attemptId, submitted };
  }

  async function expectNothingVisible(attemptId: string, submitted: Response): Promise<void> {
    expect(submitted.body.data).toMatchObject({ attemptId, status: "GRADED", published: false });
    expectNoKeys(submitted.body.data, GRADE_KEYS, "submit response");

    const detail: Response = await api("GET", `/api/evaluation-attempts/${attemptId}`, studentToken);

    expectStatus(detail, 200);
    expect(detail.body.data).toMatchObject({ published: false, answersReleased: false });
    expectNoKeys(detail.body.data, [...CORRECTION_KEYS, ...GRADE_KEYS], "attempt detail");
    expect(JSON.stringify(detail.body.data)).not.toContain(EXPLANATION);

    const mine: Response = await api("GET", "/api/my-evaluations", studentToken);

    expectStatus(mine, 200);
    expectNoKeys(mine.body.data, [...CORRECTION_KEYS, ...GRADE_KEYS], "my evaluations");

    const grades: Response = await api("GET", "/api/my-evaluations/grades", studentToken);

    expectStatus(grades, 200);
    expect(grades.body.data).toEqual([]);

    const summary: Response = await api("GET", "/api/me/summary", studentToken);

    expectStatus(summary, 200);
    expect(summary.body.data.grades).toEqual([]);

    expectStatus(await api("GET", `/api/evaluation-attempts/${attemptId}/feedback`, studentToken), 404);
  }

  it.each(["QUIZ", "WORKSHOP", "EXAM"] as const)("should hide the key, the grade and the feedback of a %s attempt until the release", async (type: EvaluationTypeValue) => {
    const { assignmentId, questions } = await assignedEvaluation(type);
    const { attemptId, submitted } = await submitCorrectAttempt(assignmentId, questions);

    await expectNothingVisible(attemptId, submitted);
    expect([404, 405]).toContain(
      // The immediate check route is gone (no contract to validate against).
      (await callApi(e2e.baseUrl, "POST", `/api/my-evaluations/attempts/${attemptId}/answers/${questions[0].id}/check`, studentToken, { selectedOptionIds: [questions[0].options[0].id] })).status,
    );
  });

  it("should release only the grade, then the grade with the answers", async () => {
    const { assignmentId, questions } = await assignedEvaluation("QUIZ");
    const { attemptId } = await submitCorrectAttempt(assignmentId, questions);

    const gradeOnly: Response = await api("POST", `/api/evaluation-grading/attempts/${attemptId}/publish`, teacherToken, { scope: "GRADE" });

    expectStatus(gradeOnly, 200);
    expect(gradeOnly.body.data).toMatchObject({ attemptId, alreadyPublished: false, answersReleasedAt: null });

    const afterGrade: Response = await api("GET", `/api/evaluation-attempts/${attemptId}`, studentToken);

    expectStatus(afterGrade, 200);
    expect(afterGrade.body.data).toMatchObject({ published: true, answersReleased: false, grade: 5, passed: true });
    expectNoKeys(afterGrade.body.data, CORRECTION_KEYS, "attempt detail after grade-only release");
    expectStatus(await api("GET", `/api/evaluation-attempts/${attemptId}/feedback`, studentToken), 404);

    const grades: Response = await api("GET", "/api/my-evaluations/grades", studentToken);

    expectStatus(grades, 200);
    expect(grades.body.data).toEqual([expect.objectContaining({ attemptId, grade: 5 })]);

    const full: Response = await api("POST", `/api/evaluation-grading/attempts/${attemptId}/publish`, teacherToken, { scope: "GRADE_AND_ANSWERS" });

    expectStatus(full, 200);
    expect(full.body.data).toMatchObject({ attemptId, alreadyPublished: false, answersReleasedAt: expect.any(String) });

    const afterAll: Response = await api("GET", `/api/evaluation-attempts/${attemptId}`, studentToken);

    expectStatus(afterAll, 200);
    expect(afterAll.body.data).toMatchObject({ published: true, answersReleased: true });
    expect(JSON.stringify(afterAll.body.data)).toContain(EXPLANATION);
    expect(afterAll.body.data.questions[0].options.some((option: { isCorrect?: boolean }) => option.isCorrect === true)).toBe(true);

    const again: Response = await api("POST", `/api/evaluation-grading/attempts/${attemptId}/publish`, teacherToken, { scope: "GRADE" });

    expectStatus(again, 200);
    expect(again.body.data).toMatchObject({ alreadyPublished: true });
  });

  it("should release a whole evaluation with the chosen scope", async () => {
    const { evaluationId, assignmentId, questions } = await assignedEvaluation("EXAM");
    const { attemptId } = await submitCorrectAttempt(assignmentId, questions);

    const gradeOnly: Response = await api("POST", "/api/evaluation-grading/publish", teacherToken, { evaluationId, scope: "GRADE" });

    expectStatus(gradeOnly, 200);
    expect(gradeOnly.body.data).toEqual({ publishedCount: 1 });
    expect((await api("GET", `/api/evaluation-attempts/${attemptId}`, studentToken)).body.data).toMatchObject({ published: true, answersReleased: false });

    const full: Response = await api("POST", "/api/evaluation-grading/publish", teacherToken, { evaluationId, scope: "GRADE_AND_ANSWERS" });

    expectStatus(full, 200);
    expect(full.body.data).toEqual({ publishedCount: 1 });
    expect((await api("GET", `/api/evaluation-attempts/${attemptId}`, studentToken)).body.data).toMatchObject({ published: true, answersReleased: true });
  });

  it("should keep the legacy quiz bank from exposing new evaluations or the key", async () => {
    const { evaluationId } = await assignedEvaluation("QUIZ");
    const unassigned: Response = await api("POST", "/api/evaluations", teacherToken, { type: "QUIZ", title: "Banco abierto", maxAttempts: 1 });

    expectStatus(unassigned, 201);

    const bank: Response = await api("GET", "/api/quizzes", studentToken);

    expectStatus(bank, 200);
    expect(JSON.stringify(bank.body.data)).not.toContain(evaluationId);
    expect(JSON.stringify(bank.body.data)).not.toContain(unassigned.body.data.id as string);
    expectStatus(await api("GET", `/api/quizzes/${evaluationId}`, studentToken), 404);
  });
});
