/*
 * Funcionalidad: AiTelemetryFacade
 * Descripción: API pública de la telemetría de IA para otras features: registrar una llamada sin bloquear ni lanzar (solo hash del prompt, costo estimado con la tabla de precios si no viene calculado), consumo de un usuario por caso de uso, estadísticas agregadas, resumen de una llamada y la última llamada SUCCESS o FALLBACK enlazada a una referencia
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { AI_PRICE_TABLE_TOKEN } from "@/features/ai-telemetry/application/ports/ai-price-table.interface";
import { GetAiTelemetryStatsUseCase } from "@/features/ai-telemetry/application/use-cases/get-ai-telemetry-stats.usecase";
import {
  type AiCallLogEntry,
  type AiCallStatusValue,
  type AiCallSummary,
  type AiPriceTable,
  type AiTelemetryFilters,
  type AiTelemetryStats,
  type AiTelemetryUseCaseValue,
  type AiUsage,
} from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { AI_CALL_LOGS_REPOSITORY_TOKEN, type IAiCallLogsRepository } from "@/features/ai-telemetry/domain/repositories/ai-call-logs.repository";
import { estimateAiCallCostUsd } from "@/features/ai-telemetry/domain/services/ai-telemetry-metrics";

const ANSWERED_CALL_STATUSES: readonly AiCallStatusValue[] = ["SUCCESS", "FALLBACK"] as const;

@Injectable()
export class AiTelemetryFacade {
  private readonly _logger: Logger = new Logger(AiTelemetryFacade.name);

  public constructor(
    @Inject(AI_CALL_LOGS_REPOSITORY_TOKEN)
    private readonly _aiCallLogsRepository: IAiCallLogsRepository,
    @Inject(AI_PRICE_TABLE_TOKEN)
    private readonly _priceTable: AiPriceTable,
    private readonly _getAiTelemetryStatsUseCase: GetAiTelemetryStatsUseCase,
  ) {}

  public async record(entry: AiCallLogEntry): Promise<void> {
    try {
      const costEstimateUsd: number | undefined =
        entry.costEstimateUsd ?? estimateAiCallCostUsd(this._priceTable, entry.provider, entry.model, entry.inputTokens, entry.outputTokens);

      await this._aiCallLogsRepository.create({ ...entry, costEstimateUsd });
    } catch (error: unknown) {
      // Telemetry must never break an AI response; the message may carry connection details, so only the error name is logged.
      this._logger.error(`AI call log write failed: ${error instanceof Error ? error.name : "UnknownError"}`);
    }
  }

  public async getUsage(userId: string, useCase: AiTelemetryUseCaseValue, since: Date): Promise<AiUsage> {
    return this._aiCallLogsRepository.getUsage(userId, useCase, since);
  }

  public async getStats(filters: AiTelemetryFilters): Promise<AiTelemetryStats> {
    return this._getAiTelemetryStatsUseCase.execute(filters);
  }

  public async getCallById(id: string): Promise<AiCallSummary | undefined> {
    return this._aiCallLogsRepository.getById(id);
  }

  public async getLatestCallByRef(refType: string, refId: string): Promise<AiCallSummary | undefined> {
    return this._aiCallLogsRepository.getLatestByRef(refType, refId, ANSWERED_CALL_STATUSES);
  }
}
