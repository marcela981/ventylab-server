/*
 * Funcionalidad: Prueba de integración de intentos de evaluación
 * Descripción: Con la aplicación Nest real contra el PostgreSQL de Testcontainers verifica el repositorio Prisma de intentos a través de StartEvaluationAttemptUseCase: N inicios simultáneos del mismo estudiante en la misma asignación (serializados por pg_advisory_xact_lock por evaluación y usuario) crean exactamente un intento IN_PROGRESS y todos devuelven ese intento; y que borrar una asignación con intentos se rechace (409) sin borrar filas mientras que una sin intentos se elimina
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAssignment, type User } from "@prisma/client";

import { DeleteEvaluationAssignmentCommand } from "@/features/evaluation/application/commands/delete-evaluation-assignment.command";
import { StartEvaluationAttemptCommand } from "@/features/evaluation/application/commands/start-evaluation-attempt.command";
import { type StartEvaluationAttemptResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import { DeleteEvaluationAssignmentUseCase } from "@/features/evaluation/application/use-cases/delete-evaluation-assignment.usecase";
import { StartEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/start-evaluation-attempt.usecase";
import { EvaluationAssignmentHasAttemptsError } from "@/features/evaluation/domain/evaluation.errors";

import { assignEvaluationToGroup, createAdmin, createEvaluation, createStudent, createStudentGroup, createTeacher, type EvaluationWithQuestions } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

const CONCURRENCY: number = 10;

interface AssignedStudent {
  readonly student: User;
  readonly assignment: EvaluationAssignment;
  readonly evaluation: EvaluationWithQuestions;
}

describe("evaluation attempts against PostgreSQL", () => {
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

  async function assignedStudent(maxAttempts: number = 3): Promise<AssignedStudent> {
    const teacher: User = await createTeacher(harness.prisma);
    const student: User = await createStudent(harness.prisma);
    const { group } = await createStudentGroup(harness.prisma, { members: [student], createdBy: teacher });
    const evaluation: EvaluationWithQuestions = await createEvaluation(harness.prisma, { createdBy: teacher, maxAttempts });
    const assignment: EvaluationAssignment = await assignEvaluationToGroup(harness.prisma, evaluation.evaluation, group, { assignedBy: teacher });

    return { student, assignment, evaluation };
  }

  it(`should create exactly one IN_PROGRESS attempt when ${CONCURRENCY} starts race`, async () => {
    const { student, assignment } = await assignedStudent();
    const useCase: StartEvaluationAttemptUseCase = harness.app.get(StartEvaluationAttemptUseCase);

    const results: PromiseSettledResult<StartEvaluationAttemptResult>[] = await Promise.allSettled(
      Array.from({ length: CONCURRENCY }, (): Promise<StartEvaluationAttemptResult> =>
        useCase.execute(new StartEvaluationAttemptCommand({ assignmentId: assignment.id, userId: student.id })),
      ),
    );

    const values: StartEvaluationAttemptResult[] = results.flatMap((result: PromiseSettledResult<StartEvaluationAttemptResult>): StartEvaluationAttemptResult[] =>
      result.status === "fulfilled" ? [result.value] : [],
    );
    const attemptIds: Set<string> = new Set<string>(values.map((value: StartEvaluationAttemptResult): string => value.attempt.id));

    expect(values).toHaveLength(CONCURRENCY);
    expect(values.filter((value: StartEvaluationAttemptResult): boolean => value.created)).toHaveLength(1);
    expect(attemptIds.size).toBe(1);
    expect(await harness.prisma.studentEvaluationAttempt.count({ where: { userId: student.id, status: "IN_PROGRESS" } })).toBe(1);
  });

  it("should reject deleting an assignment that already has attempts without deleting anything", async () => {
    const admin: User = await createAdmin(harness.prisma);
    const { student, assignment, evaluation } = await assignedStudent();

    await harness.app.get(StartEvaluationAttemptUseCase).execute(new StartEvaluationAttemptCommand({ assignmentId: assignment.id, userId: student.id }));

    const deletion: Promise<unknown> = harness.app.get(DeleteEvaluationAssignmentUseCase).execute(
      new DeleteEvaluationAssignmentCommand({ evaluationId: evaluation.evaluation.id, assignmentId: assignment.id, actor: { id: admin.id, role: "ADMIN" } }),
    );

    await expect(deletion).rejects.toBeInstanceOf(EvaluationAssignmentHasAttemptsError);
    expect(await harness.prisma.evaluationAssignment.count({ where: { id: assignment.id } })).toBe(1);
    expect(await harness.prisma.studentEvaluationAttempt.count({ where: { assignmentId: assignment.id } })).toBe(1);
  });

  it("should delete an assignment without attempts", async () => {
    const admin: User = await createAdmin(harness.prisma);
    const { assignment, evaluation } = await assignedStudent();

    await harness.app.get(DeleteEvaluationAssignmentUseCase).execute(
      new DeleteEvaluationAssignmentCommand({ evaluationId: evaluation.evaluation.id, assignmentId: assignment.id, actor: { id: admin.id, role: "ADMIN" } }),
    );

    expect(await harness.prisma.evaluationAssignment.count({ where: { id: assignment.id } })).toBe(0);
    expect(await harness.prisma.evaluation.count({ where: { id: evaluation.evaluation.id } })).toBe(1);
  });
});
