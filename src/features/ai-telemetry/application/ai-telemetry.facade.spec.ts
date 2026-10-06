/*
 * Funcionalidad: Pruebas de AiTelemetryFacade
 * Descripción: Verifica que el registro de llamadas de IA nunca lance (aunque el repositorio falle), que estime el costo con la tabla de precios solo cuando la entrada no lo trae, y que el consumo, el resumen de una llamada y las estadísticas deleguen en el repositorio y el caso de uso
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type AiPriceTable } from "@/features/ai-telemetry/application/ports/ai-price-table.interface";
import { type GetAiTelemetryStatsUseCase } from "@/features/ai-telemetry/application/use-cases/get-ai-telemetry-stats.usecase";
import {
  type AiCallLogEntry,
  type AiCallSummary,
  type AiTelemetryStats,
  type AiUsage,
} from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

interface RepositoryMock {
  create: jest.Mock;
  getUsage: jest.Mock;
  getAggregate: jest.Mock;
  getDailyAggregates: jest.Mock;
  getRows: jest.Mock;
  getById: jest.Mock;
  getLatestByRef: jest.Mock;
}

const ENTRY: AiCallLogEntry = {
  id: "call-1",
  useCase: "FREE_CHAT",
  userId: "user-1",
  provider: "gemini",
  model: "gemini-2.0-flash",
  promptVersion: "free-chat@1",
  promptHash: "a".repeat(64),
  inputTokens: 1000,
  outputTokens: 500,
  latencyMs: 1200,
  ttftMs: 300,
  status: "SUCCESS",
  attempts: 1,
};

describe("AiTelemetryFacade", () => {
  let repository: RepositoryMock;
  let statsUseCase: { execute: jest.Mock };
  let priceTable: AiPriceTable;
  let facade: AiTelemetryFacade;

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue(undefined),
      getUsage: jest.fn(),
      getAggregate: jest.fn(),
      getDailyAggregates: jest.fn(),
      getRows: jest.fn(),
      getById: jest.fn(),
      getLatestByRef: jest.fn(),
    };
    statsUseCase = { execute: jest.fn() };
    priceTable = { "gemini:gemini-2.0-flash": { inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.4 } };
    facade = new AiTelemetryFacade(
      repository,
      priceTable,
      statsUseCase as unknown as GetAiTelemetryStatsUseCase,
    );
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("record", () => {
    it("resolves without throwing when the repository rejects and logs only the error name", async () => {
      const failure: Error = new TypeError("connection refused to secret-host");

      repository.create.mockRejectedValue(failure);

      await expect(facade.record(ENTRY)).resolves.toBeUndefined();

      expect(Logger.prototype.error).toHaveBeenCalledTimes(1);
      expect(String((Logger.prototype.error as jest.Mock).mock.calls[0][0])).toContain("TypeError");
      expect(String((Logger.prototype.error as jest.Mock).mock.calls[0][0])).not.toContain("secret-host");
    });

    it("resolves without throwing when the repository throws synchronously", async () => {
      repository.create.mockImplementation(() => {
        throw new Error("boom");
      });

      await expect(facade.record(ENTRY)).resolves.toBeUndefined();
    });

    it("keeps the cost provided by the caller", async () => {
      await facade.record({ ...ENTRY, costEstimateUsd: 0.5 });

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ costEstimateUsd: 0.5 }));
    });

    it("estimates the cost from the price table when the entry has none", async () => {
      await facade.record(ENTRY);

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ id: "call-1", costEstimateUsd: 0.0003 }));
    });

    it("leaves the cost empty when the provider and model have no price", async () => {
      await facade.record({ ...ENTRY, model: "unknown-model" });

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ costEstimateUsd: undefined }));
    });
  });

  it("returns the usage counted by the repository", async () => {
    const since: Date = new Date("2026-10-05T00:00:00Z");
    const usage: AiUsage = { requests: 3, inputTokens: 30, outputTokens: 60 };

    repository.getUsage.mockResolvedValue(usage);

    const result: AiUsage = await facade.getUsage("user-1", "FREE_CHAT", since);

    expect(result).toEqual(usage);
    expect(repository.getUsage).toHaveBeenCalledWith("user-1", "FREE_CHAT", since);
  });

  it("returns the call summary or undefined", async () => {
    const summary: AiCallSummary = {
      id: "call-1",
      userId: "user-1",
      useCase: "FREE_CHAT",
      provider: "gemini",
      model: "gemini-2.0-flash",
      promptVersion: "free-chat@1",
      status: "SUCCESS",
      createdAt: new Date(),
    };

    repository.getById.mockResolvedValueOnce(summary).mockResolvedValueOnce(undefined);

    const found: AiCallSummary | undefined = await facade.getCallById("call-1");
    const missing: AiCallSummary | undefined = await facade.getCallById("call-2");

    expect(found).toEqual(summary);
    expect(missing).toBeUndefined();
  });

  it("returns the latest SUCCESS or FALLBACK call linked to a reference", async () => {
    const summary: AiCallSummary = {
      id: "call-7",
      useCase: "GRADE_FEEDBACK",
      provider: "gemini",
      promptVersion: "1.0.0",
      status: "SUCCESS",
      createdAt: new Date(),
    };

    repository.getLatestByRef.mockResolvedValueOnce(summary);

    const found: AiCallSummary | undefined = await facade.getLatestCallByRef("evaluation_attempt", "attempt-1");

    expect(found).toEqual(summary);
    expect(repository.getLatestByRef).toHaveBeenCalledWith("evaluation_attempt", "attempt-1", ["SUCCESS", "FALLBACK"]);
  });

  it("delegates the stats to the stats use case", async () => {
    const stats: AiTelemetryStats = { from: new Date(), to: new Date(), totals: {} as AiTelemetryStats["totals"], days: [] };
    const filters: { from: Date; to: Date } = { from: new Date("2026-10-01T00:00:00Z"), to: new Date("2026-10-05T00:00:00Z") };

    statsUseCase.execute.mockResolvedValue(stats);

    const result: AiTelemetryStats = await facade.getStats(filters);

    expect(result).toBe(stats);
    expect(statsUseCase.execute).toHaveBeenCalledWith(filters);
  });
});
