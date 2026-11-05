/*
 * Funcionalidad: Prueba de seguridad de la retención de resultados de las sesiones EXAM
 * Descripción: Con la política de resultados del Bloque C, el estudiante no recibe el puntaje práctico de su sesión de simulación EXAM (fin, resumen, listado) antes de que el docente libere la nota, ni el desglose de la rúbrica, el estado de los objetivos, el desenlace ni la línea de tiempo (fin, resumen, estado) antes de liberar las respuestas; el docente ve todo desde el inicio. Cada respuesta se valida contra el contrato OpenAPI
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAssignment, type User } from "@prisma/client";
import { type Response } from "supertest";

import { assignEvaluationToGroup, createEvaluation, makeClinicalCaseSimulationReady, createStudent, createStudentGroup, createTeacher, type EvaluationWithQuestions } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";

const END_SIM_TIME_MS: number = 4_000;

interface WithheldView {
  readonly score: number | null;
  readonly breakdown: unknown[];
  readonly targets: unknown[];
  readonly timeline: unknown[];
  readonly outcome: unknown;
  readonly finalMetrics: { targets?: unknown[] };
  readonly resultsWithheld: boolean;
}

describe("security: EXAM simulation results are withheld until the teacher release", () => {
  let e2e: E2eApp;
  let api: ContractCaller;
  let student: User;
  let studentToken: string;
  let teacherToken: string;
  let evaluation: EvaluationWithQuestions;
  let assignment: EvaluationAssignment;

  beforeAll(async () => {
    e2e = await createE2eApp();
    api = contractCaller(e2e.baseUrl);
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);

    const teacher: User = await createTeacher(e2e.prisma);

    student = await createStudent(e2e.prisma);

    const { group } = await createStudentGroup(e2e.prisma, { members: [student], createdBy: teacher });

    evaluation = await createEvaluation(e2e.prisma, { type: "EXAM", createdBy: teacher, questionTypes: ["SIMULATION"], showResultsImmediately: true });
    await makeClinicalCaseSimulationReady(e2e.prisma, evaluation.clinicalCase?.id ?? "");
    assignment = await assignEvaluationToGroup(e2e.prisma, evaluation.evaluation, group, { assignedBy: teacher });
    studentToken = await mintAccessToken(student, e2e.app);
    teacherToken = await mintAccessToken(teacher, e2e.app);
  });

  afterAll(async () => {
    await e2e?.close();
  });

  async function endedExamSession(): Promise<{ attemptId: string; sessionId: string; ended: Response }> {
    const started: Response = await api("POST", `/api/my-evaluations/${assignment.id}/attempts`, studentToken);

    expectStatus(started, 201);

    const attemptId: string = started.body.data.id as string;
    const session: Response = await api("POST", "/api/simulation/sessions", studentToken, { mode: "EXAM", attemptId, questionId: evaluation.questions[0].id });

    expectStatus(session, 201);

    const sessionId: string = session.body.data.id as string;

    expectStatus(
      await api("POST", `/api/simulation/sessions/${sessionId}/events`, studentToken, {
        events: [{ id: "exam-security-1", simTimeMs: 1_000, type: "PARAM_CHANGE", payload: { changes: { peepCmH2O: 8 } } }],
      }),
      200,
    );

    const state: Response = await api("GET", `/api/simulation/sessions/${sessionId}/state`, studentToken);

    expectStatus(state, 200);
    expect(state.body.data).toMatchObject({ targets: [], resultsWithheld: true });
    expect(state.body.data.metrics.targets).toEqual([]);

    const ended: Response = await api("POST", `/api/simulation/sessions/${sessionId}/end`, studentToken, { simTimeMs: END_SIM_TIME_MS });

    expectStatus(ended, 200);

    return { attemptId, sessionId, ended };
  }

  function expectFullyWithheld(view: WithheldView): void {
    expect(view).toMatchObject({ score: null, breakdown: [], targets: [], timeline: [], outcome: null, resultsWithheld: true });
    expect(view.finalMetrics.targets).toEqual([]);
  }

  async function submit(attemptId: string, sessionId: string): Promise<void> {
    expectStatus(await api("PUT", `/api/evaluation-attempts/${attemptId}/answers/${evaluation.questions[0].id}`, studentToken, { simulationSessionId: sessionId }), 200);
    expectStatus(await api("POST", `/api/evaluation-attempts/${attemptId}/submit`, studentToken, {}), 200);
  }

  it("withholds the score and the correction from the student while the teacher sees everything", async () => {
    const { sessionId, ended } = await endedExamSession();
    const summary: Response = await api("GET", `/api/simulation/sessions/${sessionId}/summary`, studentToken);
    const history: Response = await api("GET", `/api/simulation/sessions/history?ids=${sessionId}`, studentToken);
    const teacherSummary: Response = await api("GET", `/api/simulation/sessions/${sessionId}/summary`, teacherToken);
    const teacherHistory: Response = await api("GET", `/api/simulation/sessions/history?userId=${student.id}`, teacherToken);

    expectStatus(summary, 200);
    expectStatus(history, 200);
    expectStatus(teacherSummary, 200);
    expectStatus(teacherHistory, 200);
    expectFullyWithheld(ended.body.data as WithheldView);
    expectFullyWithheld(summary.body.data as WithheldView);
    expect(history.body.data[0].score).toBeNull();
    expect(typeof teacherSummary.body.data.score).toBe("number");
    expect(teacherSummary.body.data.breakdown.length).toBeGreaterThan(0);
    expect(teacherSummary.body.data.resultsWithheld).toBe(false);
    expect(typeof teacherHistory.body.data[0].score).toBe("number");
  });

  it("shows only the score after a grade-only release, and the correction after the answers release", async () => {
    const { attemptId, sessionId } = await endedExamSession();

    await submit(attemptId, sessionId);
    expectStatus(await api("POST", `/api/evaluation-grading/attempts/${attemptId}/publish`, teacherToken, { scope: "GRADE" }), 200);

    const gradeOnly: Response = await api("GET", `/api/simulation/sessions/${sessionId}/summary`, studentToken);

    expectStatus(gradeOnly, 200);
    expect(typeof gradeOnly.body.data.score).toBe("number");
    expect(gradeOnly.body.data).toMatchObject({ breakdown: [], targets: [], timeline: [], outcome: null, resultsWithheld: true });

    expectStatus(await api("POST", `/api/evaluation-grading/attempts/${attemptId}/publish`, teacherToken, { scope: "GRADE_AND_ANSWERS" }), 200);

    const released: Response = await api("GET", `/api/simulation/sessions/${sessionId}/summary`, studentToken);

    expectStatus(released, 200);
    expect(released.body.data.resultsWithheld).toBe(false);
    expect(released.body.data.breakdown.length).toBeGreaterThan(0);
  });
});
