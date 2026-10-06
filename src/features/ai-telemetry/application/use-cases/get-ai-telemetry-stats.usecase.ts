/*
 * Funcionalidad: Caso de uso GetAiTelemetryStatsUseCase
 * Descripción: Estadísticas de las llamadas de IA en un rango (máximo 366 días) con filtros opcionales de caso de uso, proveedor y modelo: totales y serie diaria con llamadas, p50/p95 de latencia y de primer token, tasas de fallback y error, tokens y costo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type AiTelemetryAggregate,
  type AiTelemetryDayAggregate,
  type AiTelemetryDayMetrics,
  type AiTelemetryFilters,
  type AiTelemetryStats,
} from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { AI_CALL_LOGS_REPOSITORY_TOKEN, type IAiCallLogsRepository } from "@/features/ai-telemetry/domain/repositories/ai-call-logs.repository";
import { assertValidTelemetryRange, toTelemetryMetrics } from "@/features/ai-telemetry/domain/services/ai-telemetry-metrics";

/**
 * @throws {InvalidAiTelemetryRangeError} If the range does not start before it ends or spans more than 366 days
 */
@Injectable()
export class GetAiTelemetryStatsUseCase {
  public constructor(
    @Inject(AI_CALL_LOGS_REPOSITORY_TOKEN)
    private readonly _aiCallLogsRepository: IAiCallLogsRepository,
  ) {}

  public async execute(filters: AiTelemetryFilters): Promise<AiTelemetryStats> {
    assertValidTelemetryRange(filters.from, filters.to);

    const [totals, days]: [AiTelemetryAggregate, AiTelemetryDayAggregate[]] = await Promise.all([
      this._aiCallLogsRepository.getAggregate(filters),
      this._aiCallLogsRepository.getDailyAggregates(filters),
    ]);

    return {
      from: filters.from,
      to: filters.to,
      totals: toTelemetryMetrics(totals),
      days: days.map((day: AiTelemetryDayAggregate): AiTelemetryDayMetrics => ({ ...toTelemetryMetrics(day), day: day.day })),
    };
  }
}
