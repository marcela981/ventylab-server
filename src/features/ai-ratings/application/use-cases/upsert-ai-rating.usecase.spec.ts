/*
 * Funcionalidad: Pruebas del caso de uso UpsertAiRatingUseCase
 * Descripción: Verifica que una valoración de IA se cree o actualice en la misma fila por (usuario, tipo de objetivo, objetivo) dentro de una transacción, que solo el destinatario de la salida pueda valorarla (403), que un objetivo desconocido dé 404 y que las escalas fuera de rango o un aiCallId incoherente den 422
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { UpsertAiRatingCommand } from "@/features/ai-ratings/application/commands/upsert-ai-rating.command";
import { type RatingTarget } from "@/features/ai-ratings/application/ports/rating-target-resolver.interface";
import { InMemoryAiRatingsRepository } from "@/features/ai-ratings/application/testing/ai-ratings-test-doubles-spec";
import { UpsertAiRatingUseCase } from "@/features/ai-ratings/application/use-cases/upsert-ai-rating.usecase";
import {
  AiRatingCallMismatchError,
  AiRatingNotRecipientError,
  AiRatingTargetNotFoundError,
  InvalidAiRatingScoreError,
} from "@/features/ai-ratings/domain/ai-ratings.errors";
import { type AiRating } from "@/features/ai-ratings/domain/entities/ai-rating.entity";
import { type AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type AiCallSummary } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

const STUDENT_ID: string = "student-1";

const TRANSACTION: object = { kind: "transaction" };

function command(overrides: Partial<ConstructorParameters<typeof UpsertAiRatingCommand>[0]> = {}): UpsertAiRatingCommand {
  return new UpsertAiRatingCommand({ userId: STUDENT_ID, targetType: "MESSAGE", targetId: "message-1", helpful: true, ...overrides });
}

function callSummary(overrides: Partial<AiCallSummary> = {}): AiCallSummary {
  return {
    id: "call-9",
    userId: STUDENT_ID,
    useCase: "GRADE_FEEDBACK",
    provider: "gemini",
    model: "gemini-2.0-flash",
    promptVersion: "1.0.0",
    status: "SUCCESS",
    createdAt: new Date("2026-10-01T00:00:00Z"),
    ...overrides,
  };
}

describe("UpsertAiRatingUseCase", () => {
  let repository: InMemoryAiRatingsRepository;
  let resolver: { resolve: jest.Mock };
  let telemetry: { getCallById: jest.Mock };
  let transactionManager: { run: jest.Mock };
  let useCase: UpsertAiRatingUseCase;

  beforeEach(() => {
    repository = new InMemoryAiRatingsRepository();
    resolver = { resolve: jest.fn() };
    telemetry = { getCallById: jest.fn() };
    transactionManager = { run: jest.fn(async (work: (transaction: unknown) => Promise<unknown>) => work(TRANSACTION)) };
    useCase = new UpsertAiRatingUseCase(
      repository,
      resolver,
      telemetry as unknown as AiTelemetryFacade,
      transactionManager as ITransactionManager,
    );
  });

  it("creates the rating inside a transaction and stores the resolver aiCallId", async () => {
    resolver.resolve.mockResolvedValue({ recipientUserId: STUDENT_ID, aiCallId: "call-1" } satisfies RatingTarget);

    await useCase.execute(command({ quality: 4, comment: "Clear" }));

    const saved: AiRating[] = repository.all();

    expect(saved).toHaveLength(1);
    expect(saved[0].aiCallId).toBe("call-1");
    expect(saved[0].answers.quality).toBe(4);
    expect(saved[0].answers.comment).toBe("Clear");
    expect(transactionManager.run).toHaveBeenCalledTimes(1);
    expect(repository.transactions).toEqual([TRANSACTION, TRANSACTION]);
    expect(resolver.resolve).toHaveBeenCalledWith("MESSAGE", "message-1");
  });

  it("updates the same row when the user rates the same target twice", async () => {
    resolver.resolve.mockResolvedValue({ recipientUserId: STUDENT_ID, aiCallId: "call-1" });

    await useCase.execute(command({ helpful: true, trust: 5 }));
    const firstId: string = repository.all()[0].id;
    await useCase.execute(command({ helpful: false, trust: 2, comment: "Changed my mind" }));

    const saved: AiRating[] = repository.all();

    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe(firstId);
    expect(saved[0].answers.helpful).toBe(false);
    expect(saved[0].answers.trust).toBe(2);
    expect(saved[0].answers.comment).toBe("Changed my mind");
    expect(saved[0].updatedAt.getTime()).toBeGreaterThanOrEqual(saved[0].createdAt.getTime());
  });

  it("forbids rating an AI output that belongs to another user", async () => {
    resolver.resolve.mockResolvedValue({ recipientUserId: "student-2", aiCallId: "call-1" });

    await expect(useCase.execute(command())).rejects.toThrow(AiRatingNotRecipientError);
    expect(repository.all()).toHaveLength(0);
  });

  it("reports an unknown target as not found", async () => {
    resolver.resolve.mockResolvedValue(undefined);

    await expect(useCase.execute(command({ targetType: "SIM_ASSIST", targetId: "x" }))).rejects.toThrow(AiRatingTargetNotFoundError);
    expect(repository.all()).toHaveLength(0);
  });

  it("rejects a Likert value out of range before resolving the target", async () => {
    await expect(useCase.execute(command({ expression: 6 }))).rejects.toThrow(InvalidAiRatingScoreError);
    expect(resolver.resolve).not.toHaveBeenCalled();
  });

  it("rejects a client aiCallId that differs from the target's call", async () => {
    resolver.resolve.mockResolvedValue({ recipientUserId: STUDENT_ID, aiCallId: "call-1" });

    await expect(useCase.execute(command({ aiCallId: "call-2" }))).rejects.toThrow(AiRatingCallMismatchError);
    expect(repository.all()).toHaveLength(0);
  });

  it("accepts a matching client aiCallId", async () => {
    resolver.resolve.mockResolvedValue({ recipientUserId: STUDENT_ID, aiCallId: "call-1" });

    await useCase.execute(command({ aiCallId: "call-1" }));

    expect(repository.all()[0].aiCallId).toBe("call-1");
    expect(telemetry.getCallById).not.toHaveBeenCalled();
  });

  it("links a client aiCallId when the target has none and the call matches the user and use case", async () => {
    resolver.resolve.mockResolvedValue({ recipientUserId: STUDENT_ID });
    telemetry.getCallById.mockResolvedValue(callSummary());

    await useCase.execute(command({ targetType: "GRADE_FEEDBACK", targetId: "feedback-1", aiCallId: "call-9" }));

    expect(repository.all()[0].aiCallId).toBe("call-9");
  });

  it.each([
    ["an unknown call", undefined],
    ["a call of another use case", callSummary({ useCase: "FREE_CHAT" })],
    ["a call of another user", callSummary({ userId: "student-2" })],
  ])("rejects a client aiCallId pointing to %s", async (_label: string, summary: AiCallSummary | undefined) => {
    resolver.resolve.mockResolvedValue({ recipientUserId: STUDENT_ID });
    telemetry.getCallById.mockResolvedValue(summary);

    await expect(useCase.execute(command({ targetType: "GRADE_FEEDBACK", targetId: "feedback-1", aiCallId: "call-9" }))).rejects.toThrow(
      AiRatingCallMismatchError,
    );
  });

  it("stores no aiCallId when neither the target nor the client provides one", async () => {
    resolver.resolve.mockResolvedValue({ recipientUserId: STUDENT_ID });

    await useCase.execute(command({ targetType: "GRADE_FEEDBACK", targetId: "feedback-1" }));

    expect(repository.all()[0].aiCallId).toBeUndefined();
  });
});
