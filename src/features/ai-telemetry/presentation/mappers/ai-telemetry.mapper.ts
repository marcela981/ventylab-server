/*
 * Funcionalidad: Mapeador de presentación de la telemetría de IA
 * Descripción: Convierte la consulta HTTP en filtros de telemetría (rango por defecto: los 30 días previos a ahora) y las estadísticas del dominio en DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type AiTelemetryDayMetrics,
  type AiTelemetryFilters,
  type AiTelemetryMetrics,
  type AiTelemetryStats,
  type AiTelemetryUseCaseValue,
} from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { type GetAiTelemetryQueryDTO } from "@/features/ai-telemetry/presentation/dtos/ai-telemetry-request.dto";
import {
  type AiTelemetryDayMetricsDTO,
  type AiTelemetryMetricsDTO,
  type AiTelemetryStatsDTO,
} from "@/features/ai-telemetry/presentation/dtos/ai-telemetry-stats.dto";

const DEFAULT_RANGE_DAYS: number = 30;

const DAY_MS: number = 24 * 60 * 60 * 1000;

export class AiTelemetryMapper {
  public static toFilters(query: GetAiTelemetryQueryDTO, now: Date): AiTelemetryFilters {
    const to: Date = query.to ? new Date(query.to) : now;
    const from: Date = query.from ? new Date(query.from) : new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY_MS);

    return {
      from,
      to,
      useCase: query.useCase as AiTelemetryUseCaseValue | undefined,
      provider: query.provider,
      model: query.model,
    };
  }

  public static toStatsDTO(stats: AiTelemetryStats): AiTelemetryStatsDTO {
    return {
      from: stats.from.toISOString(),
      to: stats.to.toISOString(),
      totals: AiTelemetryMapper._toMetricsDTO(stats.totals),
      days: stats.days.map((day: AiTelemetryDayMetrics): AiTelemetryDayMetricsDTO => ({ ...AiTelemetryMapper._toMetricsDTO(day), day: day.day })),
    };
  }

  private static _toMetricsDTO(metrics: AiTelemetryMetrics): AiTelemetryMetricsDTO {
    return {
      calls: metrics.calls,
      providerCalls: metrics.providerCalls,
      fallbackCalls: metrics.fallbackCalls,
      errorCalls: metrics.errorCalls,
      fallbackRate: metrics.fallbackRate,
      errorRate: metrics.errorRate,
      latencyP50Ms: metrics.latencyP50Ms,
      latencyP95Ms: metrics.latencyP95Ms,
      ttftP50Ms: metrics.ttftP50Ms,
      ttftP95Ms: metrics.ttftP95Ms,
      inputTokens: metrics.inputTokens,
      outputTokens: metrics.outputTokens,
      costUsd: metrics.costUsd,
    };
  }
}
