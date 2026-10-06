/*
 * Funcionalidad: DTOs de estadísticas de telemetría de IA
 * Descripción: Respuesta de las estadísticas de llamadas de IA: métricas totales y por día (llamadas, llamadas que llegaron a un proveedor, p50/p95 de latencia y de primer token, tasas de fallback y error, tokens y costo estimado en USD)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AiTelemetryMetricsDTO {
  @ApiProperty({ description: "Logged calls, including quota rejections and off-topic blocks", example: 120 })
  public calls: number;

  @ApiProperty({ description: "Calls that reached a provider or its fallback (SUCCESS, FALLBACK, ERROR, ABORTED)", example: 110 })
  public providerCalls: number;

  @ApiProperty({ description: "Calls answered by the deterministic fallback", example: 4 })
  public fallbackCalls: number;

  @ApiProperty({ description: "Calls that ended in error", example: 2 })
  public errorCalls: number;

  @ApiProperty({ description: "fallbackCalls / providerCalls (0 when there are none)", example: 0.036 })
  public fallbackRate: number;

  @ApiProperty({ description: "errorCalls / providerCalls (0 when there are none)", example: 0.018 })
  public errorRate: number;

  @ApiPropertyOptional({ description: "Median latency in ms over calls that reached a provider", example: 950 })
  public latencyP50Ms?: number;

  @ApiPropertyOptional({ description: "95th percentile latency in ms over calls that reached a provider", example: 3100 })
  public latencyP95Ms?: number;

  @ApiPropertyOptional({ description: "Median time to first token in ms (streamed calls only)", example: 320 })
  public ttftP50Ms?: number;

  @ApiPropertyOptional({ description: "95th percentile time to first token in ms (streamed calls only)", example: 900 })
  public ttftP95Ms?: number;

  @ApiProperty({ description: "Input tokens", example: 54000 })
  public inputTokens: number;

  @ApiProperty({ description: "Output tokens", example: 21000 })
  public outputTokens: number;

  @ApiProperty({ description: "Estimated cost in USD", example: 0.0312 })
  public costUsd: number;
}

export class AiTelemetryDayMetricsDTO extends AiTelemetryMetricsDTO {
  @ApiProperty({ description: "UTC day (YYYY-MM-DD)", example: "2026-10-05" })
  public day: string;
}

export class AiTelemetryStatsDTO {
  @ApiProperty({ description: "Range start (inclusive)", example: "2026-09-05T00:00:00.000Z" })
  public from: string;

  @ApiProperty({ description: "Range end (exclusive)", example: "2026-10-05T00:00:00.000Z" })
  public to: string;

  @ApiProperty({ description: "Metrics over the whole range", type: AiTelemetryMetricsDTO })
  public totals: AiTelemetryMetricsDTO;

  @ApiProperty({ description: "Metrics per UTC day with at least one call", type: AiTelemetryDayMetricsDTO, isArray: true })
  public days: AiTelemetryDayMetricsDTO[];
}
