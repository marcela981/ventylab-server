/*
 * Funcionalidad: Reglas de métricas de telemetría de IA
 * Descripción: Valida el rango de fechas de estadísticas y exportación (inicio antes del fin, máximo 366 días), calcula las tasas de fallback y error sobre las llamadas que llegaron a un proveedor y estima el costo en USD de una llamada con una tabla de precios por millón de tokens
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidAiTelemetryRangeError } from "@/features/ai-telemetry/domain/ai-telemetry.errors";
import {
  type AiModelPrice,
  type AiPriceTable,
  type AiTelemetryAggregate,
  type AiTelemetryMetrics,
} from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

export const MAX_TELEMETRY_RANGE_DAYS: number = 366;

const DAY_MS: number = 24 * 60 * 60 * 1000;

const TOKENS_PER_PRICE_UNIT: number = 1_000_000;

const COST_DECIMALS_FACTOR: number = 1_000_000;

export function assertValidTelemetryRange(from: Date, to: Date): void {
  const span: number = to.getTime() - from.getTime();

  if (Number.isNaN(span) || span <= 0 || span > MAX_TELEMETRY_RANGE_DAYS * DAY_MS) {
    throw new InvalidAiTelemetryRangeError();
  }
}

export function toTelemetryMetrics(aggregate: AiTelemetryAggregate): AiTelemetryMetrics {
  const hasProviderCalls: boolean = aggregate.providerCalls > 0;

  return {
    ...aggregate,
    fallbackRate: hasProviderCalls ? aggregate.fallbackCalls / aggregate.providerCalls : 0,
    errorRate: hasProviderCalls ? aggregate.errorCalls / aggregate.providerCalls : 0,
  };
}

export function estimateAiCallCostUsd(
  priceTable: AiPriceTable,
  provider: string | undefined,
  model: string | undefined,
  inputTokens: number | undefined,
  outputTokens: number | undefined,
): number | undefined {
  if (provider === undefined || model === undefined || (inputTokens === undefined && outputTokens === undefined)) {
    return undefined;
  }

  const price: AiModelPrice | undefined = priceTable[`${provider}:${model}`];

  if (!price) {
    return undefined;
  }

  const cost: number = ((inputTokens ?? 0) * price.inputPerMillionUsd + (outputTokens ?? 0) * price.outputPerMillionUsd) / TOKENS_PER_PRICE_UNIT;

  return Math.round(cost * COST_DECIMALS_FACTOR) / COST_DECIMALS_FACTOR;
}
