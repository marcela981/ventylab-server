/*
 * Funcionalidad: Flujo e2e de examen práctico con simulación
 * Descripción: Un estudiante abre una sesión de simulación en modo EXAM ligada a una pregunta SIMULATION de su intento, envía eventos de cambio de parámetros, la termina, vincula la sesión a su respuesta y entrega; se verifica que la nota de la pregunta sale de la re-simulación hecha en el servidor (el cliente no envía puntaje) y que el intento queda calificado y publicado, validando cada respuesta contra el contrato OpenAPI
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

describe("flow: practical exam graded by server-side re-simulation", () => {
  let e2e: E2eApp;
  let api: ContractCaller;
  let student: User;
  let studentToken: string;
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
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should score the SIMULATION question from the replayed EXAM session and grade the attempt", async () => {
    const question: EvaluationWithQuestions["questions"][number] = evaluation.questions[0];
    const started: Response = await api("POST", `/api/my-evaluations/${assignment.id}/attempts`, studentToken);

    expectStatus(started, 201);

    const attemptId: string = started.body.data.id as string;
    const session: Response = await api("POST", "/api/simulation/sessions", studentToken, { mode: "EXAM", attemptId, questionId: question.id });

    expectStatus(session, 201);

    const sessionId: string = session.body.data.id as string;
    const events: Response = await api("POST", `/api/simulation/sessions/${sessionId}/events`, studentToken, {
      events: [
        { id: "exam-event-1", simTimeMs: 1_000, type: "PARAM_CHANGE", payload: { changes: { peepCmH2O: 8 } } },
        { id: "exam-event-2", simTimeMs: 2_000, type: "PARAM_CHANGE", payload: { changes: { fio2: 0.5 } } },
      ],
    });

    expectStatus(events, 200);
    expect(events.body.data).toMatchObject({ accepted: 2, duplicates: 0 });

    const ended: Response = await api("POST", `/api/simulation/sessions/${sessionId}/end`, studentToken, { simTimeMs: END_SIM_TIME_MS });

    expectStatus(ended, 200);

    const sessionScore: number = ended.body.data.score as number;

    expect(sessionScore).toBeGreaterThanOrEqual(0);
    expect(sessionScore).toBeLessThanOrEqual(1);

    expectStatus(await api("PUT", `/api/evaluation-attempts/${attemptId}/answers/${question.id}`, studentToken, { simulationSessionId: sessionId }), 200);

    const submitted: Response = await api("POST", `/api/evaluation-attempts/${attemptId}/submit`, studentToken, {});

    expectStatus(submitted, 200);
    expect(submitted.body.data).toMatchObject({ attemptId, status: "GRADED", published: true, grade: expect.any(Number) });

    const answer: { autoScore: number | null; simulationSessionId: string | null } = await e2e.prisma.evaluationAnswer.findFirstOrThrow({
      where: { attemptId, questionId: question.id },
      select: { autoScore: true, simulationSessionId: true },
    });

    expect(answer).toEqual({ simulationSessionId: sessionId, autoScore: Math.round(question.points * sessionScore * 100) / 100 });

    const grades: Response = await api("GET", "/api/my-evaluations/grades", studentToken);

    expectStatus(grades, 200);
    expect(JSON.stringify(grades.body.data)).toContain(evaluation.evaluation.id);
  });

  it("should reject binding a FREE session to the exam answer", async () => {
    const question: EvaluationWithQuestions["questions"][number] = evaluation.questions[0];
    const started: Response = await api("POST", `/api/my-evaluations/${assignment.id}/attempts`, studentToken);
    const free: Response = await api("POST", "/api/simulation/sessions", studentToken, { mode: "FREE", caseId: question.clinicalCaseId });

    expectStatus(free, 201);

    const bound: Response = await api("PUT", `/api/evaluation-attempts/${started.body.data.id as string}/answers/${question.id}`, studentToken, { simulationSessionId: free.body.data.id as string });

    expect(bound.status).toBe(422);
  });
});
