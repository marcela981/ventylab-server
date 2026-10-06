/*
 * Funcionalidad: Pruebas de GetAiTelemetryStatsUseCase y ExportAiCallLogsUseCase
 * Descripción: Verifica que las estadísticas validen el rango y combinen totales y serie diaria con tasas, y que la exportación pida una fila extra para detectar truncamiento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallLogsExport, ExportAiCallLogsUseCase } from "@/features/ai-telemetry/application/use-cases/export-ai-call-logs.usecase";
import { GetAiTelemetryStatsUseCase } from "@/features/ai-telemetry/application/use-cases/get-ai-telemetry-stats.usecase";
import { InvalidAiTelemetryRangeError } from "@/features/ai-telemetry/domain/ai-telemetry.errors";
import {
  type AiCallLogRow,
  type AiTelemetryAggregate,
  type AiTelemetryFilters,
  type AiTelemetryStats,
} from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { type IAiCallLogsRepository } from "@/features/ai-telemetry/domain/repositories/ai-call-logs.repository";

const AGGREGATE: AiTelemetryAggregate = {
  calls: 5,
  providerCalls: 4,
  fallbackCalls: 1,
  errorCalls: 2,
  inputTokens: 10,
  outputTokens: 20,
  costUsd: 0.01,
};

const FILTERS: AiTelemetryFilters = { from: new Date("2026-10-01T00:00:00Z"), to: new Date("2026-10-05T00:00:00Z") };

describe("GetAiTelemetryStatsUseCase", () => {
  it("combines totals and daily series with fallback and error rates", async () => {
    const repository: Partial<Record<keyof IAiCallLogsRepository, jest.Mock>> = {
      getAggregate: jest.fn().mockResolvedValue(AGGREGATE),
      getDailyAggregates: jest.fn().mockResolvedValue([{ ...AGGREGATE, day: "2026-10-01" }]),
    };
    const useCase: GetAiTelemetryStatsUseCase = new GetAiTelemetryStatsUseCase(repository as unknown as IAiCallLogsRepository);

    const stats: AiTelemetryStats = await useCase.execute(FILTERS);

    expect(stats.totals.fallbackRate).toBe(0.25);
    expect(stats.totals.errorRate).toBe(0.5);
    expect(stats.days[0]).toEqual(expect.objectContaining({ day: "2026-10-01", fallbackRate: 0.25 }));
    expect(stats.from).toBe(FILTERS.from);
    expect(repository.getAggregate).toHaveBeenCalledWith(FILTERS);
  });

  it("rejects an invalid range before querying", async () => {
    const repository: Partial<Record<keyof IAiCallLogsRepository, jest.Mock>> = { getAggregate: jest.fn(), getDailyAggregates: jest.fn() };
    const useCase: GetAiTelemetryStatsUseCase = new GetAiTelemetryStatsUseCase(repository as unknown as IAiCallLogsRepository);

    await expect(useCase.execute({ from: FILTERS.to, to: FILTERS.from })).rejects.toThrow(InvalidAiTelemetryRangeError);
    expect(repository.getAggregate).not.toHaveBeenCalled();
  });
});

describe("ExportAiCallLogsUseCase", () => {
  const row: AiCallLogRow = {
    id: "c",
    createdAt: new Date(),
    useCase: "FREE_CHAT",
    provider: "gemini",
    promptVersion: "v1",
    status: "SUCCESS",
    attempts: 1,
    latencyMs: 1,
  };

  it("returns the rows and flags truncation when more rows than the limit exist", async () => {
    const repository: Partial<Record<keyof IAiCallLogsRepository, jest.Mock>> = { getRows: jest.fn().mockResolvedValue([row, row, row]) };
    const useCase: ExportAiCallLogsUseCase = new ExportAiCallLogsUseCase(repository as unknown as IAiCallLogsRepository);

    const result: AiCallLogsExport = await useCase.execute(FILTERS, 2);

    expect(repository.getRows).toHaveBeenCalledWith(FILTERS, 3);
    expect(result.rows).toHaveLength(2);
    expect(result.truncated).toBe(true);
  });

  it("does not flag truncation when every row fits", async () => {
    const repository: Partial<Record<keyof IAiCallLogsRepository, jest.Mock>> = { getRows: jest.fn().mockResolvedValue([row]) };
    const useCase: ExportAiCallLogsUseCase = new ExportAiCallLogsUseCase(repository as unknown as IAiCallLogsRepository);

    const result: AiCallLogsExport = await useCase.execute(FILTERS, 2);

    expect(result.truncated).toBe(false);
  });
});
