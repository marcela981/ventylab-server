/*
 * Funcionalidad: Pruebas del caso de uso CheckEvaluationAnswerUseCase
 * Descripción: Verifica la retroalimentación inmediata: revela la corrección de una pregunta de selección en QUIZ y WORKSHOP, bloquea la respuesta (un check o un autoguardado posterior responde 409 y la entrega no la reemplaza) y rechaza EXAM, preguntas abiertas, intentos cerrados o ajenos y el plazo vencido
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { CheckEvaluationAnswerCommand } from "@/features/evaluation/application/commands/check-evaluation-answer.command";
import { SaveEvaluationAnswerCommand } from "@/features/evaluation/application/commands/save-evaluation-answer.command";
import { SubmitEvaluationAttemptCommand } from "@/features/evaluation/application/commands/submit-evaluation-attempt.command";
import { type CheckEvaluationAnswerResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import {
  attemptQuestion,
  type AttemptDoubles,
  buildAttemptDoubles,
  buildAttemptEvaluation,
  buildStoredAttempt,
  minutesFromNow,
  STUDENT_ID,
} from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { CheckEvaluationAnswerUseCase } from "@/features/evaluation/application/use-cases/check-evaluation-answer.usecase";
import { SaveEvaluationAnswerUseCase } from "@/features/evaluation/application/use-cases/save-evaluation-answer.usecase";
import { SubmitEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/submit-evaluation-attempt.usecase";
import { type EvaluationAnswerRecord } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  AttemptDeadlinePassedError,
  EvaluationAnswerCheckUnavailableError,
  EvaluationAnswerLockedError,
  EvaluationAttemptNotFoundError,
  EvaluationAttemptNotInProgressError,
} from "@/features/evaluation/domain/evaluation.errors";

interface CheckInput {
  questionId: string;
  userId: string;
  selectedOptionIds: string[];
}

function check(doubles: AttemptDoubles, { questionId = "q1", userId = STUDENT_ID, selectedOptionIds = ["q1-ok"] }: Partial<CheckInput> = {}): Promise<CheckEvaluationAnswerResult> {
  return new CheckEvaluationAnswerUseCase(doubles.attemptsRepository, doubles.closer, doubles.recorder, doubles.transactionManager, doubles.eventBus).execute(
    new CheckEvaluationAnswerCommand({ attemptId: "attempt-1", questionId, userId, selectedOptionIds }),
  );
}

function storedAnswer(doubles: AttemptDoubles, questionId: string): EvaluationAnswerRecord | undefined {
  return doubles.attemptsRepository.store.get("attempt-1")?.answers.find((answer: EvaluationAnswerRecord) => answer.questionId === questionId);
}

describe("CheckEvaluationAnswerUseCase", () => {
  it.each(["QUIZ", "WORKSHOP"] as const)("reveals the correction of a %s choice question and locks the answer", async (type: "QUIZ" | "WORKSHOP") => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ evaluation: buildAttemptEvaluation({ type }), attempts: [buildStoredAttempt()] });

    const result: CheckEvaluationAnswerResult = await check(doubles, { selectedOptionIds: ["q1-ko"] });

    expect(result).toEqual({ isCorrect: false, correctOptionIds: ["q1-ok"], explanation: "Because the guideline says so" });
    expect(storedAnswer(doubles, "q1")).toMatchObject({ selectedOptionIds: ["q1-ko"], revealedAt: expect.anything() });
    expect(doubles.attemptsRepository.locks).toEqual(["evaluations:attempt:evaluation-1:student-1"]);
  });

  it("reports a correct answer", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    expect((await check(doubles)).isCorrect).toBe(true);
  });

  it("rejects a second check of the same answer with 409", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    await check(doubles, { selectedOptionIds: ["q1-ko"] });

    await expect(check(doubles)).rejects.toBeInstanceOf(EvaluationAnswerLockedError);
    expect(storedAnswer(doubles, "q1")?.selectedOptionIds).toEqual(["q1-ko"]);
  });

  it("rejects an autosave (PUT) after the answer was revealed with 409", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    await check(doubles, { selectedOptionIds: ["q1-ko"] });

    await expect(
      new SaveEvaluationAnswerUseCase(doubles.attemptsRepository, doubles.closer, doubles.recorder, doubles.transactionManager, doubles.eventBus).execute(
        new SaveEvaluationAnswerCommand({ attemptId: "attempt-1", questionId: "q1", userId: STUDENT_ID, selectedOptionIds: ["q1-ok"] }),
      ),
    ).rejects.toBeInstanceOf(EvaluationAnswerLockedError);
  });

  it("keeps the revealed answer when the submit body sends another one and still grades it", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    await check(doubles, { selectedOptionIds: ["q1-ko"] });
    await new SubmitEvaluationAttemptUseCase(
      doubles.attemptsRepository,
      doubles.closer,
      doubles.recorder,
      doubles.gradingConfig,
      doubles.transactionManager,
      doubles.eventBus,
    ).execute(
      new SubmitEvaluationAttemptCommand({
        attemptId: "attempt-1",
        userId: STUDENT_ID,
        answers: [
          { questionId: "q1", selectedOptionIds: ["q1-ok"] },
          { questionId: "q2", selectedOptionIds: ["q2-ok"] },
        ],
      }),
    );

    expect(storedAnswer(doubles, "q1")).toMatchObject({ selectedOptionIds: ["q1-ko"], autoScore: 0, revealedAt: expect.anything() });
    expect(doubles.attemptsRepository.store.get("attempt-1")).toMatchObject({ status: "GRADED", score: 1 });
  });

  it("rejects an EXAM with 422", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ evaluation: buildAttemptEvaluation({ type: "EXAM" }), attempts: [buildStoredAttempt()] });

    await expect(check(doubles)).rejects.toEqual(new EvaluationAnswerCheckUnavailableError("evaluation_type"));
    expect(storedAnswer(doubles, "q1")).toBeUndefined();
  });

  it("rejects an OPEN_TEXT question with 422", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({
      evaluation: buildAttemptEvaluation({ questions: [attemptQuestion("q1", "OPEN_TEXT", 2)] }),
      attempts: [buildStoredAttempt()],
    });

    await expect(check(doubles, { selectedOptionIds: [] })).rejects.toEqual(new EvaluationAnswerCheckUnavailableError("question_type"));
  });

  it("rejects a closed attempt with 409", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ status: "GRADED", submittedAt: minutesFromNow(-1) })] });

    await expect(check(doubles)).rejects.toBeInstanceOf(EvaluationAttemptNotInProgressError);
  });

  it("hides the attempt of another student behind 404", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt()] });

    await expect(check(doubles, { userId: "student-2" })).rejects.toBeInstanceOf(EvaluationAttemptNotFoundError);
  });

  it("closes an attempt past its deadline plus grace and answers 409", async () => {
    const doubles: AttemptDoubles = buildAttemptDoubles({ attempts: [buildStoredAttempt({ deadlineAt: minutesFromNow(-5) })] });

    await expect(check(doubles)).rejects.toBeInstanceOf(AttemptDeadlinePassedError);
    expect(doubles.attemptsRepository.store.get("attempt-1")?.status).not.toBe("IN_PROGRESS");
  });
});
