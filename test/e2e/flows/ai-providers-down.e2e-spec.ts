/*
 * Funcionalidad: Flujo e2e con todos los proveedores de IA caídos
 * Descripción: Arranca la aplicación con proveedores falsos que responden 5xx o agotan el tiempo (tiempos de espera cortos por caso de uso) y verifica que la retroalimentación de evaluaciones y el asesor de simulación responden con el respaldo determinista y que la telemetría de IA registra FALLBACK; el análisis de notas no tiene respaldo determinista (BUG-11, abierto) y queda documentado con una prueba it.failing y una que fija el comportamiento actual
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClinicalCase, type EvaluationAssignment, type User } from "@prisma/client";
import { type Response } from "supertest";

import { scenarioLlmProvider } from "@/features/ai/application/testing/ai-provider-scenarios-test-doubles-spec";

import { assignEvaluationToGroup, type ContentTree, createAdmin, createClinicalCase, createContentTree, createEvaluation, createStudent, createStudentGroup, createTeacher, type EvaluationWithQuestions, makeClinicalCaseSimulationReady } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eAppWithEnvironment, type OverriddenE2eApp } from "../../support/env-overrides";
import { waitUntil } from "../../support/polling";

const SHORT_TIMEOUT_MS: number = 1_000;
const NOTE_CONTENT: object = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "La PEEP mantiene alveolos abiertos al final de la espiración." }] }] };

// Short per-use-case timeouts keep the timeout scenario fast; a high breaker threshold makes every call try every provider.
const ENVIRONMENT: Readonly<Record<string, string>> = {
  AI_USE_CASE_SETTINGS: JSON.stringify({
    GRADE_FEEDBACK: { timeoutMs: SHORT_TIMEOUT_MS },
    NOTES_ANALYSIS: { timeoutMs: SHORT_TIMEOUT_MS },
    SIM_ASSIST: { timeoutMs: SHORT_TIMEOUT_MS },
  }),
  AI_BREAKER_FAILURE_THRESHOLD: "1000",
};

interface FeedbackItem {
  readonly status: string;
  readonly source?: string | null;
}

interface FeedbackBody {
  readonly overall: FeedbackItem | null;
  readonly questions: FeedbackItem[];
}

function sseEvents(text: string): { event: string; data: unknown }[] {
  return text.split(/\n\n/).flatMap((block: string): { event: string; data: unknown }[] => {
    const event: string | undefined = /^event: (.+)$/m.exec(block)?.[1];
    const data: string | undefined = /^data: (.+)$/m.exec(block)?.[1];

    return event && data ? [{ event, data: JSON.parse(data) as unknown }] : [];
  });
}

describe("flow: every AI provider is down", () => {
  let harness: OverriddenE2eApp;
  let api: ContractCaller;
  let teacher: User;
  let student: User;
  let studentToken: string;

  beforeAll(async () => {
    harness = await createE2eAppWithEnvironment(ENVIRONMENT, {
      aiProviders: [scenarioLlmProvider("gemini", "server-error"), scenarioLlmProvider("openai", "timeout"), scenarioLlmProvider("anthropic", "server-error", { status: 502 })],
    });
    api = contractCaller(harness.e2e.baseUrl);
  });

  beforeEach(async () => {
    await resetDatabase(harness.e2e.prisma);
    teacher = await createTeacher(harness.e2e.prisma);
    student = await createStudent(harness.e2e.prisma);
    studentToken = await mintAccessToken(student, harness.e2e.app);
  });

  afterAll(async () => {
    await harness?.restore();
  });

  async function fallbackRows(useCase: "GRADE_FEEDBACK" | "SIM_ASSIST" | "NOTES_ANALYSIS"): Promise<number> {
    return await harness.e2e.prisma.aiCallLog.count({ where: { useCase, status: "FALLBACK" } });
  }

  it("should publish deterministic grade feedback and record FALLBACK telemetry", async () => {
    const { group } = await createStudentGroup(harness.e2e.prisma, { members: [student], createdBy: teacher });
    const evaluation: EvaluationWithQuestions = await createEvaluation(harness.e2e.prisma, { createdBy: teacher, questionTypes: ["SINGLE_CHOICE", "TRUE_FALSE"] });
    const assignment: EvaluationAssignment = await assignEvaluationToGroup(harness.e2e.prisma, evaluation.evaluation, group, { assignedBy: teacher });
    const started: Response = await api("POST", `/api/my-evaluations/${assignment.id}/attempts`, studentToken);
    const attemptId: string = started.body.data.id as string;

    expectStatus(await api("POST", `/api/evaluation-attempts/${attemptId}/submit`, studentToken, {
      answers: evaluation.questions.map((question: EvaluationWithQuestions["questions"][number]) => ({ questionId: question.id, selectedOptionIds: [question.options[0].id] })),
    }), 200);

    const feedback: Response = await waitUntil(
      (): Promise<Response> => api("GET", `/api/evaluation-attempts/${attemptId}/feedback`, studentToken),
      (response: Response): boolean => {
        const body: FeedbackBody | undefined = response.status === 200 ? (response.body.data as FeedbackBody) : undefined;

        return body !== undefined && body.overall?.status === "READY" && body.questions.every((item: FeedbackItem): boolean => item.status === "READY");
      },
      { description: "deterministic grade feedback READY", timeoutMs: 45_000 },
    );
    const body: FeedbackBody = feedback.body.data as FeedbackBody;

    expect([body.overall, ...body.questions].map((item: FeedbackItem | null): string | null | undefined => item?.source)).toEqual(Array.from({ length: body.questions.length + 1 }, (): string => "DETERMINISTIC"));
    await waitUntil((): Promise<number> => fallbackRows("GRADE_FEEDBACK"), (count: number): boolean => count > 0, { description: "GRADE_FEEDBACK FALLBACK telemetry" });

    const failedProviderRows: number = await harness.e2e.prisma.aiCallLog.count({ where: { useCase: "GRADE_FEEDBACK", status: { notIn: ["FALLBACK"] } } });

    expect(failedProviderRows).toBe(0);

    const adminToken: string = await mintAccessToken(await createAdmin(harness.e2e.prisma), harness.e2e.app);
    const stats: Response = await api("GET", "/api/admin/ai-telemetry/stats?useCase=GRADE_FEEDBACK", adminToken);

    expectStatus(stats, 200);
    expect(stats.body.data.totals).toMatchObject({ fallbackCalls: expect.any(Number), errorCalls: 0, fallbackRate: 1 });
    expect(stats.body.data.totals.fallbackCalls).toBeGreaterThanOrEqual(1);
  });

  it("should answer simulation advice with the deterministic fallback over SSE", async () => {
    const clinicalCase: ClinicalCase = await makeClinicalCaseSimulationReady(harness.e2e.prisma, (await createClinicalCase(harness.e2e.prisma, { createdBy: teacher })).id);
    const session: Response = await api("POST", "/api/simulation/sessions", studentToken, { mode: "FREE", caseId: clinicalCase.id });

    expectStatus(session, 201);

    const response: globalThis.Response = await fetch(`${harness.e2e.baseUrl}/api/simulation/sessions/${session.body.data.id as string}/assist`, {
      method: "POST",
      headers: { authorization: `Bearer ${studentToken}`, "content-type": "application/json" },
      body: JSON.stringify({ question: "¿Debo subir la PEEP?" }),
    });
    const events: { event: string; data: unknown }[] = sseEvents(await response.text());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(events.filter((item: { event: string }): boolean => item.event === "delta").length).toBeGreaterThan(0);
    expect(events.find((item: { event: string }): boolean => item.event === "done")?.data).toMatchObject({ source: "DETERMINISTIC" });
    await waitUntil((): Promise<number> => fallbackRows("SIM_ASSIST"), (count: number): boolean => count > 0, { description: "SIM_ASSIST FALLBACK telemetry" });
  });

  async function studentWithNotes(): Promise<ContentTree> {
    const tree: ContentTree = await createContentTree(harness.e2e.prisma, { author: teacher });

    await harness.e2e.prisma.note.create({ data: { userId: student.id, lessonId: tree.lesson.id, content: NOTE_CONTENT } });

    return tree;
  }

  it("should keep answering notes analysis with 503 and ERROR telemetry while BUG-11 is open", async () => {
    const tree: ContentTree = await studentWithNotes();

    const analysis: Response = await api("POST", "/api/notes/analyze", studentToken, { lessonId: tree.lesson.id });

    expect(analysis.status).toBe(503);
    await waitUntil(
      (): Promise<number> => harness.e2e.prisma.aiCallLog.count({ where: { useCase: "NOTES_ANALYSIS", status: "ERROR" } }),
      (count: number): boolean => count > 0,
      { description: "NOTES_ANALYSIS ERROR telemetry" },
    );
  });

  // BUG-11 (open): NOTES_ANALYSIS passes no deterministic fallback to AiGateway, so the documented 503 is returned instead of a fallback analysis.
  it.failing("should answer notes analysis with a deterministic fallback (BUG-11)", async () => {
    const tree: ContentTree = await studentWithNotes();

    const analysis: Response = await api("POST", "/api/notes/analyze", studentToken, { lessonId: tree.lesson.id });

    expect(analysis.status).toBe(200);
    await waitUntil((): Promise<number> => fallbackRows("NOTES_ANALYSIS"), (count: number): boolean => count > 0, { description: "NOTES_ANALYSIS FALLBACK telemetry", timeoutMs: 3_000 });
  });
});
