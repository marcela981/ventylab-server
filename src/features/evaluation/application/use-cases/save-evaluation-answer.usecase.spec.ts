/*
 * Funcionalidad: Pruebas del caso de uso SaveEvaluationAnswerUseCase
 * Descripción: Verifica el autoguardado por (intento, pregunta) del propietario mientras el intento está IN_PROGRESS, la validación de la pregunta, las opciones y la forma de la respuesta, la propiedad de la sesión del simulador y el rechazo 409 con cierre perezoso persistido tras el plazo más la gracia
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { SaveEvaluationAnswerCommand } from "@/features/evaluation/application/commands/save-evaluation-answer.command";
import {
  attemptQuestion,
  type AttemptDoubles,
  buildAttemptDoubles,
  buildAttemptEvaluation,
  buildStoredAttempt,
  minutesFromNow,
  STUDENT_ID,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { SaveEvaluationAnswerUseCase } from "@/features/evaluation/application/use-cases/save-evaluation-answer.usecase";
import { type StudentEvaluationAttemptProps } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  AttemptDeadlinePassedError,
  EvaluationAttemptNotFoundError,
  EvaluationAttemptNotInProgressError,
  EvaluationQuestionNotFoundError,
  InvalidEvaluationAnswerError,
} from "@/features/evaluation/domain/evaluation.errors";

function save(
  doubles: AttemptDoubles,
  { questionId = "q1", userId = STUDENT_ID, ...answer }: { questionId?: string; userId?: string; selectedOptionIds?: string[]; textAnswer?: string; simulationSessionId?: string },
): Promise<void> {
  return new SaveEvaluationAnswerUseCase(doubles.attemptsRepository, doubles.closer, doubles.recorder, doubles.transactionManager, doubles.eventBus).execute(
    new SaveEvaluationAnswerCommand({ attemptId: "attempt-1", questionId, userId, ...answer }),
  );
}

function stored(doubles: AttemptDoubles): StudentEvaluationAttemptProps | undefined {
  return doubles.attemptsRepository.store.get("attempt-1");
}

describe("SaveEvaluationAnswerUseCase", () => {
  it("upserts one answer per question", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    await save(doubles, { selectedOptionIds: ["q1-ko"] });
    await save(doubles, { selectedOptionIds: ["q1-ok"] });

    expect(stored(doubles)?.answers).toEqual([expect.objectContaining({ questionId: "q1", selectedOptionIds: ["q1-ok"] })]);
    expect(stored(doubles)?.status).toBe("IN_PROGRESS");
  });

  it("allows autosave inside the 30 s grace (check 10)", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ deadlineAt: new Date(Date.now() - 10_000) })] });

    await save(doubles, { selectedOptionIds: ["q1-ok"] });

    expect(stored(doubles)?.answers).toHaveLength(1);
  });

  it("rejects a question of another evaluation", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    await expect(save(doubles, { questionId: "q9", selectedOptionIds: ["q9-ok"] })).rejects.toBeInstanceOf(EvaluationQuestionNotFoundError);
  });

  it("rejects an option of another question and a shape that does not match the type", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    await expect(save(doubles, { selectedOptionIds: ["q2-ok"] })).rejects.toBeInstanceOf(InvalidEvaluationAnswerError);
    await expect(save(doubles, { selectedOptionIds: ["q1-ok", "q1-ko"] })).rejects.toBeInstanceOf(InvalidEvaluationAnswerError);
  });

  it("rejects a simulation session of another user", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      evaluation: buildAttemptEvaluation({ questions: [attemptQuestion("q1", "SIMULATION")] }),
      attempts: [buildStoredAttempt()],
      sessionOwnerId: "student-2",
    });

    await expect(save(doubles, { simulationSessionId: "session-1" })).rejects.toMatchObject({ reason: "session_not_owned" });
    expect(doubles.getSessionBinding).toHaveBeenCalledWith("session-1", STUDENT_ID);
  });

  it.each([
    ["another attempt", { attemptId: "attempt-9" }],
    ["another question", { questionId: "q9" }],
    ["free practice", { mode: "FREE", attemptId: undefined, questionId: undefined }],
  ])("rejects a simulation session bound to %s", async (_label: string, sessionBinding: Record<string, unknown>) => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      evaluation: buildAttemptEvaluation({ questions: [attemptQuestion("q1", "SIMULATION")] }),
      attempts: [buildStoredAttempt()],
      sessionBinding,
    });

    await expect(save(doubles, { simulationSessionId: "session-1" })).rejects.toMatchObject({ reason: "session_not_owned" });
    expect(stored(doubles)?.answers).toEqual([]);
  });

  it("stores only the session reference of a bound simulation answer, never a client score", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      evaluation: buildAttemptEvaluation({ questions: [attemptQuestion("q1", "SIMULATION")] }),
      attempts: [buildStoredAttempt()],
    });
    const tampered: { simulationSessionId: string } = { simulationSessionId: "session-1", score: 1, autoScore: 1 } as { simulationSessionId: string };

    await save(doubles, tampered);

    expect(stored(doubles)?.answers).toEqual([expect.objectContaining({ questionId: "q1", simulationSessionId: "session-1" })]);
    expect(stored(doubles)?.answers[0].autoScore).toBeUndefined();
  });

  it("rejects after the deadline plus grace and keeps the lazy close (check 10)", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ deadlineAt: minutesFromNow(-1) })] });

    await expect(save(doubles, { selectedOptionIds: ["q1-ok"] })).rejects.toBeInstanceOf(AttemptDeadlinePassedError);
    expect(stored(doubles)).toMatchObject({ status: "GRADED", grade: 0, isLate: false });
  });

  it("rejects writes to a closed attempt and to another user's attempt", async () => {
    const closed: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ status: "PENDING_REVIEW", submittedAt: minutesFromNow(-1) })] });
    const open: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    await expect(save(closed, { selectedOptionIds: ["q1-ok"] })).rejects.toBeInstanceOf(EvaluationAttemptNotInProgressError);
    await expect(save(open, { userId: "student-2", selectedOptionIds: ["q1-ok"] })).rejects.toBeInstanceOf(EvaluationAttemptNotFoundError);
  });
});
