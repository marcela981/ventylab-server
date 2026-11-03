/*
 * Funcionalidad: Prueba de integración de la lista de intentos para calificar
 * Descripción: Con la aplicación Nest real contra el PostgreSQL de Testcontainers verifica GetEvaluationAttemptsUseCase y su repositorio Prisma: el profesor solo ve los intentos de los grupos que creó (el administrador todos), los intentos heredados (legacySource) nunca aparecen, el filtro por grupo y por estados, la paginación y los conteos por estado que ignoran el filtro de estados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAssignment, type EvaluationAttemptStatus, type Group, type User } from "@prisma/client";

import {
  type EvaluationAttemptsPage,
  GetEvaluationAttemptsUseCase,
} from "@/features/evaluation/application/use-cases/get-evaluation-attempts.usecase";
import { type GradingAttemptListItemView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

import { assignEvaluationToGroup, createAdmin, createEvaluation, createStudent, createStudentGroup, createTeacher, type EvaluationWithQuestions } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

interface Scenario {
  readonly admin: EvaluationActor;
  readonly teacherA: EvaluationActor;
  readonly evaluationId: string;
  readonly groupB: Group;
  readonly students: readonly User[];
}

describe("evaluation attempts list against PostgreSQL", () => {
  let harness: IntegrationApp;

  beforeAll(async () => {
    harness = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  async function attempt(evaluationId: string, user: User, assignment: EvaluationAssignment | undefined, status: EvaluationAttemptStatus, extra: { legacySource?: string; attemptNumber?: number } = {}): Promise<void> {
    await harness.prisma.studentEvaluationAttempt.create({
      data: {
        evaluationId,
        userId: user.id,
        assignmentId: assignment?.id,
        attemptNumber: extra.attemptNumber ?? 1,
        status,
        startedAt: new Date(Date.now() - 600_000),
        submittedAt: status === "IN_PROGRESS" ? null : new Date(Date.now() - 300_000),
        grade: status === "GRADED" ? 4 : null,
        gradePublishedAt: status === "GRADED" ? new Date() : null,
        legacySource: extra.legacySource,
      },
    });
  }

  async function scenario(): Promise<Scenario> {
    const admin: User = await createAdmin(harness.prisma);
    const teacherA: User = await createTeacher(harness.prisma);
    const teacherB: User = await createTeacher(harness.prisma);
    const [ana, beto, carla] = [await createStudent(harness.prisma, { name: "Ana" }), await createStudent(harness.prisma, { name: "Beto" }), await createStudent(harness.prisma, { name: "Carla" })];
    const { group: groupA } = await createStudentGroup(harness.prisma, { members: [ana, beto], createdBy: teacherA });
    const { group: groupB } = await createStudentGroup(harness.prisma, { members: [carla], createdBy: teacherB });
    const evaluation: EvaluationWithQuestions = await createEvaluation(harness.prisma, { createdBy: teacherA, maxAttempts: 3 });
    const assignmentA: EvaluationAssignment = await assignEvaluationToGroup(harness.prisma, evaluation.evaluation, groupA, { assignedBy: teacherA });
    const assignmentB: EvaluationAssignment = await assignEvaluationToGroup(harness.prisma, evaluation.evaluation, groupB, { assignedBy: teacherB });

    await attempt(evaluation.evaluation.id, ana, assignmentA, "GRADED");
    await attempt(evaluation.evaluation.id, beto, assignmentA, "PENDING_REVIEW");
    await attempt(evaluation.evaluation.id, carla, assignmentB, "GRADED");
    // Legacy attempt of an evaluation the teacher created: in the queue scope, but never in this list
    await attempt(evaluation.evaluation.id, ana, undefined, "GRADED", { legacySource: "activity_submission", attemptNumber: 2 });

    return {
      admin: { id: admin.id, role: "ADMIN" },
      teacherA: { id: teacherA.id, role: "TEACHER" },
      evaluationId: evaluation.evaluation.id,
      groupB,
      students: [ana, beto, carla],
    };
  }

  function names(page: EvaluationAttemptsPage): Array<string | undefined> {
    return page.attempts.data.map((item: GradingAttemptListItemView) => item.student.name);
  }

  it("limits a teacher to the attempts of their groups and excludes legacy attempts", async () => {
    const { teacherA, evaluationId } = await scenario();

    const page: EvaluationAttemptsPage = await harness.app.get(GetEvaluationAttemptsUseCase).execute({ evaluationId, page: 1, limit: 10 }, teacherA);

    expect(names(page)).toEqual(["Ana", "Beto"]);
    expect(page.attempts.data.every((item: GradingAttemptListItemView) => item.assignmentId !== undefined)).toBe(true);
    expect(page.attempts.data[0]).toMatchObject({ status: "GRADED", grade: 4, isLate: false, gradePublishedAt: expect.any(Date) });
    expect(page.counts).toEqual({ IN_PROGRESS: 0, SUBMITTED: 0, PENDING_REVIEW: 1, GRADED: 1 });
  });

  it("lists every group for an admin and filters by group", async () => {
    const { admin, evaluationId, groupB } = await scenario();
    const useCase: GetEvaluationAttemptsUseCase = harness.app.get(GetEvaluationAttemptsUseCase);

    expect(names(await useCase.execute({ evaluationId, page: 1, limit: 10 }, admin))).toEqual(["Ana", "Beto", "Carla"]);

    const groupPage: EvaluationAttemptsPage = await useCase.execute({ evaluationId, groupId: groupB.id, page: 1, limit: 10 }, admin);

    expect(names(groupPage)).toEqual(["Carla"]);
    expect(groupPage.counts.GRADED).toBe(1);
  });

  it("filters by status and paginates while the counts ignore the status filter", async () => {
    const { admin, evaluationId } = await scenario();
    const useCase: GetEvaluationAttemptsUseCase = harness.app.get(GetEvaluationAttemptsUseCase);

    const graded: EvaluationAttemptsPage = await useCase.execute({ evaluationId, statuses: ["GRADED"], page: 1, limit: 1 }, admin);

    expect(names(graded)).toEqual(["Ana"]);
    expect(graded.attempts.pagination.total).toBe(2);
    expect(graded.counts).toEqual({ IN_PROGRESS: 0, SUBMITTED: 0, PENDING_REVIEW: 1, GRADED: 2 });
  });
});
