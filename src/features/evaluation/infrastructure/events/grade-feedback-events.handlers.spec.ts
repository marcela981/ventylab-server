/*
 * Funcionalidad: Pruebas de GradeFeedbackEventsHandlers
 * Descripción: Verifica que los manejadores de retroalimentación escuchen de forma asíncrona, que la entrega del intento no espere ni se vea afectada por la generación, que con el modelo de lenguaje fallando la retroalimentación quede READY con origen DETERMINISTIC (check 14) y que un error inesperado nunca se propague al emisor y solo registre el nombre del error
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { type IAITextGenerator } from "@/common/application/ports/ai-text-generator.interface";
import { NestEventBus } from "@/common/infrastructure/events/nest-event-bus";
import { GenerateGradeFeedbackCommand } from "@/features/evaluation/application/commands/grade-feedback-generation.command";
import { SubmitEvaluationAttemptCommand } from "@/features/evaluation/application/commands/submit-evaluation-attempt.command";
import { type SubmitEvaluationAttemptResult } from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import { type AttemptDoubles, buildAttemptDoubles, buildStoredAttempt } from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import { InMemoryGradeFeedbacksRepository } from "@/features/evaluation/application/testing/grade-feedback-test-doubles-spec";
import { GenerateGradeFeedbackUseCase } from "@/features/evaluation/application/use-cases/grade-feedback-generation.usecase";
import { SubmitEvaluationAttemptUseCase } from "@/features/evaluation/application/use-cases/submit-evaluation-attempt.usecase";
import { EvaluationAttemptGradedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { GradeFeedbackRegenerationRequestedEvent } from "@/features/evaluation/domain/events/grade-feedback.events";
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";
import { AIGradeFeedbackGenerator } from "@/features/evaluation/infrastructure/ai/ai-grade-feedback-generator";
import { GradeFeedbackEventsHandlers } from "@/features/evaluation/infrastructure/events/grade-feedback-events.handlers";

const EVENT_LISTENER_METADATA: string = "EVENT_LISTENER_METADATA";

interface Pipeline {
  submit: SubmitEvaluationAttemptUseCase;
  feedbacks: InMemoryGradeFeedbacksRepository;
  aiTextGenerator: jest.Mocked<IAITextGenerator>;
  handlers: GradeFeedbackEventsHandlers;
}

function failingAI(): jest.Mocked<IAITextGenerator> {
  return {
    isAvailable: jest.fn().mockReturnValue(true),
    generate: jest.fn().mockRejectedValue(new Error("Gemini unavailable")),
  };
}

function buildPipeline(feedbacks: InMemoryGradeFeedbacksRepository = new InMemoryGradeFeedbacksRepository()): Pipeline {
  const doubles: AttemptDoubles = buildAttemptDoubles({
    attempts: [buildStoredAttempt({ answers: [{ id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"] }] })],
  });
  const aiTextGenerator: jest.Mocked<IAITextGenerator> = failingAI();
  const emitter: EventEmitter2 = new EventEmitter2();

  const handlers: GradeFeedbackEventsHandlers = new GradeFeedbackEventsHandlers(
    new GenerateGradeFeedbackUseCase(
      doubles.attemptsRepository,
      doubles.evaluationsRepository,
      feedbacks,
      new AIGradeFeedbackGenerator(aiTextGenerator),
      doubles.gradingConfig,
      doubles.transactionManager,
    ),
  );

  emitter.on(
    EvaluationAttemptGradedEvent.name,
    (event: EvaluationAttemptGradedEvent): void => {
      void handlers.handleAttemptGraded(event);
    },
    { async: true },
  );

  const submit: SubmitEvaluationAttemptUseCase = new SubmitEvaluationAttemptUseCase(
    doubles.attemptsRepository,
    doubles.closer,
    doubles.recorder,
    doubles.gradingConfig,
    doubles.transactionManager,
    new NestEventBus(emitter),
  );

  return { submit, feedbacks, aiTextGenerator, handlers };
}

async function waitUntil(condition: () => boolean): Promise<void> {
  for (let tick: number = 0; tick < 50 && !condition(); tick += 1) {
    await new Promise<void>((resolve: () => void) => {
      setImmediate(resolve);
    });
  }
}

function readyOverall(feedbacks: InMemoryGradeFeedbacksRepository): GradeFeedbackRecord | undefined {
  return feedbacks.records.find((record: GradeFeedbackRecord) => record.questionId === undefined && record.status === "READY");
}

describe("GradeFeedbackEventsHandlers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("listens asynchronously so the emitter never waits for the generation", () => {
    const gradedListeners: Array<{ event: string; options?: { async?: boolean } }> = Reflect.getMetadata(
      EVENT_LISTENER_METADATA,
      GradeFeedbackEventsHandlers.prototype.handleAttemptGraded,
    ) as Array<{ event: string; options?: { async?: boolean } }>;
    const regenerationListeners: Array<{ event: string; options?: { async?: boolean } }> = Reflect.getMetadata(
      EVENT_LISTENER_METADATA,
      GradeFeedbackEventsHandlers.prototype.handleRegenerationRequested,
    ) as Array<{ event: string; options?: { async?: boolean } }>;

    expect(gradedListeners).toEqual([{ event: EvaluationAttemptGradedEvent.name, options: { async: true } }]);
    expect(regenerationListeners).toEqual([{ event: GradeFeedbackRegenerationRequestedEvent.name, options: { async: true } }]);
  });

  it("stores READY DETERMINISTIC feedback when the language model fails, without affecting the submit result (check 14)", async () => {
    const { submit, feedbacks, aiTextGenerator } = buildPipeline();

    const result: SubmitEvaluationAttemptResult = await submit.execute(new SubmitEvaluationAttemptCommand({ attemptId: "attempt-1", userId: "student-1" }));

    expect(result).toMatchObject({ attemptId: "attempt-1", status: "GRADED", published: true, score: 1, maxScore: 2, grade: 2.5, passed: false });
    expect(feedbacks.records.some((record: GradeFeedbackRecord) => record.status === "READY")).toBe(false);

    await waitUntil(() => readyOverall(feedbacks) !== undefined);

    expect(aiTextGenerator.generate).toHaveBeenCalled();
    expect(feedbacks.records).toHaveLength(3);
    expect(feedbacks.records.every((record: GradeFeedbackRecord) => record.status === "READY" && record.source === "DETERMINISTIC")).toBe(true);
    expect(readyOverall(feedbacks)?.content).toContain("2.5");
  });

  it("never propagates an unexpected error and logs only the error name", async () => {
    const feedbacks: InMemoryGradeFeedbacksRepository = new InMemoryGradeFeedbacksRepository();
    const errorLog: jest.SpyInstance = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

    jest.spyOn(feedbacks, "getByAttempt").mockRejectedValue(new RangeError("connection lost to student-1@example.com"));

    const { submit } = buildPipeline(feedbacks);

    const result: SubmitEvaluationAttemptResult = await submit.execute(new SubmitEvaluationAttemptCommand({ attemptId: "attempt-1", userId: "student-1" }));

    await waitUntil(() => errorLog.mock.calls.length > 0);

    expect(result.status).toBe("GRADED");
    expect(errorLog).toHaveBeenCalledWith("Grade feedback generation failed for attempt attempt-1 (RangeError)");
  });

  it("completes the reserved feedback of a regeneration request", async () => {
    const execute: jest.Mock = jest.fn().mockResolvedValue("ready");
    const handlers: GradeFeedbackEventsHandlers = new GradeFeedbackEventsHandlers({ execute } as unknown as GenerateGradeFeedbackUseCase);

    await handlers.handleRegenerationRequested(new GradeFeedbackRegenerationRequestedEvent({ attemptId: "attempt-1", feedbackId: "pending-1", performedBy: "teacher-1" }));

    expect(execute).toHaveBeenCalledWith(new GenerateGradeFeedbackCommand({ attemptId: "attempt-1", pendingFeedbackId: "pending-1" }));
  });
});
