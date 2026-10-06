/*
 * Funcionalidad: Pruebas del caso de uso StartEvaluationAttemptUseCase
 * Descripción: Verifica el inicio idempotente de un intento dentro de una asignación ACTIVE del grupo del estudiante, el plazo calculado en el servidor, el límite de intentos contando los heredados, el cierre perezoso de un intento vencido, los rechazos 404/403/409 y la serialización de dos inicios concurrentes con el candado por usuario y evaluación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { StartEvaluationAttemptCommand } from "@/features/evaluation/application/commands/start-evaluation-attempt.command";
import { type StartEvaluationAttemptResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import {
  type AttemptDoubles,
  buildAttemptAssignment,
  buildAttemptDoubles,
  buildAttemptEvaluation,
  buildStoredAttempt,
  minutesFromNow,
  STUDENT_ID,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { StartEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/start-evaluation-attempt.usecase";
import { type StudentEvaluationAttemptProps } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  EvaluationAssignmentNotFoundError,
  EvaluationNotOpenError,
  MaxAttemptsReachedError,
} from "@/features/evaluation/domain/evaluation.errors";

function useCase(doubles: AttemptDoubles): StartEvaluationAttemptUseCase {
  return new StartEvaluationAttemptUseCase(
    doubles.attemptsRepository,
    doubles.evaluationsRepository,
    doubles.assignmentsRepository,
    doubles.access,
    doubles.closer,
    doubles.transactionManager,
    doubles.eventBus,
  );
}

function start(doubles: AttemptDoubles, userId: string = STUDENT_ID): Promise<StartEvaluationAttemptResult> {
  return useCase(doubles).execute(new StartEvaluationAttemptCommand({ assignmentId: "assignment-1", userId }));
}

describe("StartEvaluationAttemptUseCase", () => {
  it("creates the first attempt with a server-side deadline capped by the assignment end", async () => {
    const endsAt: Date = minutesFromNow(20);
    const doubles: AttemptDoubles = buildAttemptDoubles({ evaluation: buildAttemptEvaluation({ durationMinutes: 45 }), assignment: buildAttemptAssignment({ endsAt }) });

    const result: StartEvaluationAttemptResult = await start(doubles);

    expect(result.created).toBe(true);
    expect(result.attempt.attemptNumber).toBe(1);
    expect(result.attempt.status).toBe("IN_PROGRESS");
    expect(result.attempt.assignmentId).toBe("assignment-1");
    expect(result.attempt.deadlineAt).toEqual(endsAt);
    expect(doubles.attemptsRepository.locks).toEqual(["evaluations:attempt:evaluation-1:student-1"]);
    expect(doubles.attemptsRepository.sharedLocks).toEqual(["evaluations:structure:evaluation-1"]);
  });

  it("uses the duration when it ends before the assignment", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ evaluation: buildAttemptEvaluation({ durationMinutes: 15 }) });

    const result: StartEvaluationAttemptResult = await start(doubles);

    expect(result.attempt.deadlineAt?.getTime()).toBeCloseTo(result.attempt.startedAt.getTime() + 15 * 60 * 1000, -2);
  });

  it("returns the attempt in progress instead of creating another one (check 8)", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ id: "attempt-open" })] });

    const result: StartEvaluationAttemptResult = await start(doubles);

    expect(result.created).toBe(false);
    expect(result.attempt.id).toBe("attempt-open");
    expect(doubles.attemptsRepository.attempts()).toHaveLength(1);
  });

  it("rejects a new attempt once maxAttempts is reached, counting legacy attempts (check 8)", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      evaluation: buildAttemptEvaluation({ maxAttempts: 1 }),
      attempts: [buildStoredAttempt({ id: "legacy-1", status: "GRADED", legacySource: "quiz", assignmentId: undefined, deadlineAt: undefined })],
    });

    await expect(start(doubles)).rejects.toBeInstanceOf(MaxAttemptsReachedError);
  });

  it("numbers a new attempt after the highest existing one, legacy included", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      evaluation: buildAttemptEvaluation({ maxAttempts: 3 }),
      attempts: [buildStoredAttempt({ id: "legacy-1", attemptNumber: 2, status: "GRADED", legacySource: "quiz", assignmentId: undefined })],
    });

    const result: StartEvaluationAttemptResult = await start(doubles);

    expect(result.attempt.attemptNumber).toBe(3);
  });

  it("ignores a legacy attempt still in progress and never modifies it", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      evaluation: buildAttemptEvaluation({ maxAttempts: 2 }),
      attempts: [buildStoredAttempt({ id: "legacy-open", legacySource: "activity", assignmentId: undefined, deadlineAt: minutesFromNow(-600) })],
    });

    const result: StartEvaluationAttemptResult = await start(doubles);

    expect(result.created).toBe(true);
    expect(doubles.attemptsRepository.store.get("legacy-open")?.status).toBe("IN_PROGRESS");
  });

  it("lazily closes an expired attempt before starting the next one", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      evaluation: buildAttemptEvaluation({ maxAttempts: 2 }),
      attempts: [buildStoredAttempt({ id: "attempt-expired", deadlineAt: minutesFromNow(-5) })],
    });

    const result: StartEvaluationAttemptResult = await start(doubles);

    expect(result.created).toBe(true);
    expect(result.attempt.attemptNumber).toBe(2);
    expect(doubles.attemptsRepository.store.get("attempt-expired")?.status).toBe("GRADED");
  });

  it("keeps the lazy close even when the start is then rejected", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ id: "attempt-expired", deadlineAt: minutesFromNow(-5) })] });

    await expect(start(doubles)).rejects.toBeInstanceOf(MaxAttemptsReachedError);

    expect(doubles.attemptsRepository.store.get("attempt-expired")?.status).toBe("GRADED");
  });

  it("returns 404 when the assignment is not for the student group or the student has no group", async () => {
    await expect(start(buildAttemptDoubles({ studentGroupId: "group-other" }))).rejects.toBeInstanceOf(EvaluationAssignmentNotFoundError);
    await expect(start(buildAttemptDoubles({ studentGroupId: null }))).rejects.toBeInstanceOf(EvaluationAssignmentNotFoundError);
  });

  it("returns 403 for an UPCOMING or CLOSED assignment", async () => {
    const upcoming: AttemptDoubles = buildAttemptDoubles({ assignment: buildAttemptAssignment({ startsAt: minutesFromNow(30), endsAt: minutesFromNow(90) }) });
    const closed: AttemptDoubles = buildAttemptDoubles({ assignment: buildAttemptAssignment({ startsAt: minutesFromNow(-90), endsAt: minutesFromNow(-30) }) });

    await expect(start(upcoming)).rejects.toBeInstanceOf(EvaluationNotOpenError);
    await expect(start(closed)).rejects.toBeInstanceOf(EvaluationNotOpenError);
  });

  it("returns 403 when the evaluation is no longer READY", async () => {
    await expect(start(buildAttemptDoubles({ evaluation: buildAttemptEvaluation({ status: "ARCHIVED" }) }))).rejects.toBeInstanceOf(EvaluationNotOpenError);
  });

  it("serializes two concurrent starts into a single attempt (check 9)", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ evaluation: buildAttemptEvaluation({ maxAttempts: 3 }) });

    const [first, second] = await Promise.all([start(doubles), start(doubles)]);

    expect(first.attempt.id).toBe(second.attempt.id);
    expect([first.created, second.created].sort()).toEqual([false, true]);
    expect(doubles.attemptsRepository.attempts().map((item: StudentEvaluationAttemptProps) => item.attemptNumber)).toEqual([1]);
  });
});
