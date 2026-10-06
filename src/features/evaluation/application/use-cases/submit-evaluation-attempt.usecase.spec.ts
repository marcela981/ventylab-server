/*
 * Funcionalidad: Pruebas del caso de uso SubmitEvaluationAttemptUseCase
 * Descripción: Verifica la entrega idempotente con calificación automática, la publicación inmediata según showResultsImmediately, la revisión pendiente de preguntas abiertas, el puntaje práctico, las respuestas finales del cuerpo dentro del plazo con 30 s de gracia, el cierre con lo autoguardado tras el plazo, los candados por usuario y de estructura compartido, y dos entregas concurrentes calificadas una sola vez
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { SubmitEvaluationAttemptCommand } from "@/features/evaluation/application/commands/submit-evaluation-attempt.command";
import { type SubmitEvaluationAttemptResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import {
  attemptQuestion,
  type AttemptDoubles,
  buildAttemptDoubles,
  buildAttemptEvaluation,
  buildStoredAttempt,
  minutesFromNow,
  publishedEvents,
  STUDENT_ID,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { SubmitEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/submit-evaluation-attempt.usecase";
import { type EvaluationAnswerRecord, type StudentEvaluationAttemptProps } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  EvaluationAttemptNotFoundError,
  EvaluationAttemptReadOnlyError,
} from "@/features/evaluation/domain/evaluation.errors";
import { EvaluationAttemptGradedEvent, EvaluationGradePublishedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";

const RIGHT_ANSWERS: EvaluationAnswerRecord[] = [
  { id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"] },
  { id: "answer-2", questionId: "q2", selectedOptionIds: ["q2-ok"] },
];

function submit(doubles: AttemptDoubles, command: Partial<{ userId: string; answers: SubmitEvaluationAttemptCommand["answers"] }> = {}): Promise<SubmitEvaluationAttemptResult> {
  return new SubmitEvaluationAttemptUseCase(doubles.attemptsRepository, doubles.closer, doubles.recorder, doubles.gradingConfig, doubles.transactionManager, doubles.eventBus).execute(
    new SubmitEvaluationAttemptCommand({ attemptId: "attempt-1", userId: command.userId ?? STUDENT_ID, answers: command.answers }),
  );
}

function stored(doubles: AttemptDoubles): StudentEvaluationAttemptProps | undefined {
  return doubles.attemptsRepository.store.get("attempt-1");
}

describe("SubmitEvaluationAttemptUseCase", () => {
  it("grades, publishes immediately and emits both events when showResultsImmediately is set", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ answers: RIGHT_ANSWERS })] });

    const result: SubmitEvaluationAttemptResult = await submit(doubles);

    expect(result).toMatchObject({ attemptId: "attempt-1", status: "GRADED", published: true, score: 2, maxScore: 2, grade: 5, passed: true });
    expect(stored(doubles)).toMatchObject({ status: "GRADED", score: 2, maxScore: 2, grade: 5, isLate: false });
    expect(stored(doubles)?.gradePublishedAt).toBeDefined();
    expect(publishedEvents(doubles, EvaluationAttemptGradedEvent)).toHaveLength(1);
    expect(publishedEvents(doubles, EvaluationGradePublishedEvent)).toHaveLength(1);
    expect(doubles.attemptsRepository.locks).toEqual(["evaluations:attempt:evaluation-1:student-1"]);
    expect(doubles.attemptsRepository.sharedLocks).toEqual(["evaluations:structure:evaluation-1"]);
  });

  it("hides the score when results are not shown immediately", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      evaluation: buildAttemptEvaluation({ showResultsImmediately: false }),
      attempts: [buildStoredAttempt({ answers: RIGHT_ANSWERS })],
    });

    const result: SubmitEvaluationAttemptResult = await submit(doubles);

    expect(result.published).toBe(false);
    expect(result.score).toBeUndefined();
    expect(result.grade).toBeUndefined();
    expect(result.passed).toBeUndefined();
    expect(stored(doubles)?.grade).toBe(5);
    expect(publishedEvents(doubles, EvaluationAttemptGradedEvent)).toHaveLength(1);
    expect(publishedEvents(doubles, EvaluationGradePublishedEvent)).toHaveLength(0);
  });

  it("sends an attempt with an OPEN_TEXT question to PENDING_REVIEW (check 12)", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      evaluation: buildAttemptEvaluation({ questions: [attemptQuestion("q1"), attemptQuestion("q2", "OPEN_TEXT", 2)] }),
      attempts: [buildStoredAttempt({ answers: [RIGHT_ANSWERS[0], { id: "answer-2", questionId: "q2", selectedOptionIds: [], textAnswer: "Raise PEEP" }] })],
    });

    const result: SubmitEvaluationAttemptResult = await submit(doubles);

    expect(result).toMatchObject({ status: "PENDING_REVIEW", published: false });
    expect(stored(doubles)?.grade).toBeUndefined();
    expect(publishedEvents(doubles, EvaluationAttemptGradedEvent)).toHaveLength(0);
  });

  it("scores a SIMULATION question with the practical score provider", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      evaluation: buildAttemptEvaluation({ questions: [attemptQuestion("q1", "SIMULATION", 4)] }),
      attempts: [buildStoredAttempt({ answers: [{ id: "answer-1", questionId: "q1", selectedOptionIds: [], simulationSessionId: "session-1" }] })],
      practicalScore: { available: true, score: 0.5, breakdown: [] },
    });

    const result: SubmitEvaluationAttemptResult = await submit(doubles);

    expect(doubles.getSessionScore).toHaveBeenCalledWith("session-1", { criteria: "expert" });
    expect(result).toMatchObject({ status: "GRADED", score: 2, maxScore: 4, grade: 2.5, passed: false });
  });

  it("is idempotent: a second submit returns the same result without writes or events", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ answers: RIGHT_ANSWERS })] });

    const first: SubmitEvaluationAttemptResult = await submit(doubles);
    const snapshot: StudentEvaluationAttemptProps | undefined = stored(doubles);
    const second: SubmitEvaluationAttemptResult = await submit(doubles, { answers: [{ questionId: "q1", selectedOptionIds: ["q1-ko"] }] });

    expect(second).toEqual(first);
    expect(stored(doubles)).toEqual(snapshot);
    expect(doubles.publish).toHaveBeenCalledTimes(1);
  });

  it("applies the final answers of the body before the deadline", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    const result: SubmitEvaluationAttemptResult = await submit(doubles, {
      answers: [
        { questionId: "q1", selectedOptionIds: ["q1-ok"] },
        { questionId: "q2", selectedOptionIds: ["q2-ko"] },
      ],
    });

    expect(result).toMatchObject({ score: 1, grade: 2.5 });
    expect(stored(doubles)?.answers).toHaveLength(2);
  });

  it("still applies body answers inside the 30 s grace (check 10)", async () => {
    const deadlineAt: Date = new Date(Date.now() - 10_000);
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ deadlineAt })] });

    const result: SubmitEvaluationAttemptResult = await submit(doubles, { answers: [{ questionId: "q1", selectedOptionIds: ["q1-ok"] }] });

    expect(result.score).toBe(1);
    expect(stored(doubles)?.isLate).toBe(false);
    expect(stored(doubles)?.submittedAt?.getTime()).toBeGreaterThan(deadlineAt.getTime());
  });

  it("ignores body answers after the grace and closes with the autosaved ones at the deadline (check 10)", async () => {
    const deadlineAt: Date = minutesFromNow(-2);
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ deadlineAt, answers: [RIGHT_ANSWERS[0]] })] });

    const result: SubmitEvaluationAttemptResult = await submit(doubles, { answers: [{ questionId: "q2", selectedOptionIds: ["q2-ok"] }] });

    expect(result).toMatchObject({ status: "GRADED", score: 1, grade: 2.5 });
    expect(result.submittedAt).toEqual(deadlineAt);
    expect(stored(doubles)?.isLate).toBe(false);
  });

  it("returns 404 for an attempt of another user", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    await expect(submit(doubles, { userId: "student-2" })).rejects.toBeInstanceOf(EvaluationAttemptNotFoundError);
  });

  it("never modifies a legacy attempt in progress", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ legacySource: "activity", assignmentId: undefined })] });

    await expect(submit(doubles)).rejects.toBeInstanceOf(EvaluationAttemptReadOnlyError);
    expect(stored(doubles)?.status).toBe("IN_PROGRESS");
  });

  it("returns a closed legacy attempt as is", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      attempts: [buildStoredAttempt({ legacySource: "quiz", status: "GRADED", score: 80, maxScore: 100, grade: 4, gradePublishedAt: minutesFromNow(-60), submittedAt: minutesFromNow(-60) })],
    });

    const result: SubmitEvaluationAttemptResult = await submit(doubles);

    expect(result).toMatchObject({ status: "GRADED", published: true, grade: 4, passed: true });
    expect(doubles.publish).not.toHaveBeenCalled();
  });

  it("grades two concurrent submits exactly once (check 9)", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ answers: RIGHT_ANSWERS })] });

    const [first, second] = await Promise.all([submit(doubles), submit(doubles)]);

    expect(first).toEqual(second);
    expect(publishedEvents(doubles, EvaluationAttemptGradedEvent)).toHaveLength(1);
    expect(publishedEvents(doubles, EvaluationGradePublishedEvent)).toHaveLength(1);
  });
});
