/*
 * Funcionalidad: Pruebas del caso de uso ResetEvaluationAttemptUseCase
 * Descripción: Verifica el reinicio no destructivo: concede intentos acumulativos, audita el motivo dentro de la transacción, publica el evento tras confirmar, rechaza un profesor fuera del alcance (403), un intento en curso (409) y una asignación no activa (409 con la asignación), cierra antes un intento vencido, y que el inicio permita N+1 intentos y rechace N+2
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ResetEvaluationAttemptCommand } from "@/features/evaluation/application/commands/reset-evaluation-attempt.command";
import { StartEvaluationAttemptCommand } from "@/features/evaluation/application/commands/start-evaluation-attempt.command";
import {
  buildAttemptAssignment,
  buildAttemptEvaluation,
  buildStoredAttempt,
  minutesFromNow,
  publishedEvents,
  STUDENT_ID,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { ADMIN, buildGradingDoubles, type GradingDoubles, TEACHER } from "@/features/evaluation/application/testing/evaluation-grading-test-doubles-spec";
import { type ResetEvaluationAttemptResult, ResetEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/reset-evaluation-attempt.usecase";
import { StartEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/start-evaluation-attempt.usecase";
import { type EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  EvaluationAssignmentNotActiveError,
  EvaluationAssignmentNotFoundError,
  EvaluationAttemptInProgressError,
  EvaluationGradingForbiddenError,
  MaxAttemptsReachedError,
} from "@/features/evaluation/domain/evaluation.errors";
import { EvaluationAttemptResetEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

const GRADED_ATTEMPT: StudentEvaluationAttempt = buildStoredAttempt({ status: "GRADED", submittedAt: minutesFromNow(-5), grade: 4, gradePublishedAt: minutesFromNow(-4) });

function setup({ attempts = [GRADED_ATTEMPT], assignment = buildAttemptAssignment() }: { attempts?: StudentEvaluationAttempt[]; assignment?: EvaluationAssignment } = {}): GradingDoubles {
  const doubles: GradingDoubles = buildGradingDoubles({ evaluation: buildAttemptEvaluation({ maxAttempts: 1 }), assignment, attempts });

  (doubles.assignmentsRepository.getByEvaluationAndGroups as jest.Mock).mockResolvedValue([assignment]);

  return doubles;
}

function reset(doubles: GradingDoubles, actor: EvaluationActor = TEACHER): Promise<ResetEvaluationAttemptResult> {
  return new ResetEvaluationAttemptUseCase(
    doubles.attemptsRepository,
    doubles.evaluationsRepository,
    doubles.assignmentsRepository,
    doubles.access,
    doubles.gradingAccess,
    doubles.closer,
    doubles.transactionManager,
    doubles.eventBus,
    doubles.auditRecorder,
  ).execute(new ResetEvaluationAttemptCommand({ userId: STUDENT_ID, evaluationId: "evaluation-1", reason: "Connection lost", actor }));
}

function start(doubles: GradingDoubles): Promise<unknown> {
  return new StartEvaluationAttemptUseCase(
    doubles.attemptsRepository,
    doubles.evaluationsRepository,
    doubles.assignmentsRepository,
    doubles.access,
    doubles.closer,
    doubles.transactionManager,
    doubles.eventBus,
  ).execute(new StartEvaluationAttemptCommand({ assignmentId: "assignment-1", userId: STUDENT_ID }));
}

async function submitCurrent(doubles: GradingDoubles): Promise<void> {
  for (const props of doubles.attemptsRepository.attempts().filter((attempt: { status: string }) => attempt.status === "IN_PROGRESS")) {
    doubles.attemptsRepository.store.set(props.id, { ...props, status: "GRADED", submittedAt: new Date() });
  }

  await Promise.resolve();
}

describe("ResetEvaluationAttemptUseCase", () => {
  it("grants one extra attempt, audits the reason in the transaction and publishes the event after commit", async () => {
    const doubles: GradingDoubles = setup();

    const result: ResetEvaluationAttemptResult = await reset(doubles);

    expect(result).toEqual({ extraAttempts: 1, attemptsAllowed: 2 });
    expect(await doubles.attemptsRepository.getExtraAttempts("evaluation-1", STUDENT_ID)).toBe(1);
    expect(doubles.record).toHaveBeenCalledWith(
      "teacher-1",
      "evaluation_attempt_reset",
      "evaluation_attempt_grants",
      "grant-1",
      { evaluationId: "evaluation-1", userId: STUDENT_ID, extraAttempts: 0 },
      { evaluationId: "evaluation-1", userId: STUDENT_ID, extraAttempts: 1, reason: "Connection lost" },
      expect.objectContaining({ staged: expect.any(Map) }),
    );
    expect(publishedEvents(doubles, EvaluationAttemptResetEvent)).toEqual([
      expect.objectContaining({ evaluationId: "evaluation-1", userId: STUDENT_ID, title: "Ventilation basics", extraAttempts: 1 }),
    ]);
    expect(doubles.attemptsRepository.store.get("attempt-1")).toMatchObject({ status: "GRADED", grade: 4 });
  });

  it("accumulates the grants of successive resets", async () => {
    const doubles: GradingDoubles = setup();

    await reset(doubles);

    expect(await reset(doubles, ADMIN)).toEqual({ extraAttempts: 2, attemptsAllowed: 3 });
  });

  it("lets the student start N+1 attempts and rejects N+2", async () => {
    const doubles: GradingDoubles = setup();

    await expect(start(doubles)).rejects.toBeInstanceOf(MaxAttemptsReachedError);

    await reset(doubles);
    await start(doubles);
    await submitCurrent(doubles);

    await expect(start(doubles)).rejects.toEqual(new MaxAttemptsReachedError(2));
    expect(doubles.attemptsRepository.attempts()).toHaveLength(2);
  });

  it("rejects a teacher outside the student group with 403", async () => {
    const doubles: GradingDoubles = setup();

    doubles.gradingRepository.isGroupInScope.mockResolvedValue(false);

    await expect(reset(doubles)).rejects.toBeInstanceOf(EvaluationGradingForbiddenError);
    expect(doubles.record).not.toHaveBeenCalled();
  });

  it("rejects an attempt in progress with 409", async () => {
    const doubles: GradingDoubles = setup({ attempts: [GRADED_ATTEMPT, buildStoredAttempt({ id: "attempt-2", attemptNumber: 2 })] });

    await expect(reset(doubles)).rejects.toBeInstanceOf(EvaluationAttemptInProgressError);
    expect(await doubles.attemptsRepository.getExtraAttempts("evaluation-1", STUDENT_ID)).toBe(0);
    expect(doubles.publish).not.toHaveBeenCalled();
  });

  it("closes an expired attempt in progress and then resets", async () => {
    const doubles: GradingDoubles = setup({ attempts: [buildStoredAttempt({ deadlineAt: minutesFromNow(-5) })] });

    await expect(reset(doubles)).resolves.toEqual({ extraAttempts: 1, attemptsAllowed: 2 });
    expect(doubles.attemptsRepository.store.get("attempt-1")?.status).not.toBe("IN_PROGRESS");
  });

  it("rejects an assignment that is not active with 409 and the assignment to extend", async () => {
    const endsAt: Date = minutesFromNow(-60);
    const doubles: GradingDoubles = setup({ assignment: buildAttemptAssignment({ startsAt: minutesFromNow(-120), endsAt }) });

    const failure: Promise<ResetEvaluationAttemptResult> = reset(doubles);

    await expect(failure).rejects.toBeInstanceOf(EvaluationAssignmentNotActiveError);
    await expect(failure).rejects.toMatchObject({ code: "evaluation.assignment_not_active", details: { assignmentId: "assignment-1", endsAt: endsAt.toISOString() } });
  });

  it("returns 404 when the evaluation is not assigned to the student group", async () => {
    const doubles: GradingDoubles = setup();

    (doubles.assignmentsRepository.getByEvaluationAndGroups as jest.Mock).mockResolvedValue([]);

    await expect(reset(doubles)).rejects.toBeInstanceOf(EvaluationAssignmentNotFoundError);
  });
});
