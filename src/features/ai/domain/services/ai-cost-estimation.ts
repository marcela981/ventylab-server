/*
 * Funcionalidad: Estimación de costo de una llamada de IA
 * Descripción: Estima el costo en USD de una llamada de IA con el precio por cada mil tokens de entrada y de salida de la configuración del gateway, redondeado a seis decimales como la telemetría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface AiCostPricePer1k {
  readonly inputPer1kUsd: number;
  readonly outputPer1kUsd: number;
}

const TOKENS_PER_PRICE_UNIT: number = 1000;

const COST_DECIMALS_FACTOR: number = 1_000_000;

export function estimateAiCostUsd(price: AiCostPricePer1k | undefined, inputTokens: number | undefined, outputTokens: number | undefined): number | undefined {
  if (!price || (inputTokens === undefined && outputTokens === undefined)) {
    return undefined;
  }

  const cost: number = ((inputTokens ?? 0) * price.inputPer1kUsd + (outputTokens ?? 0) * price.outputPer1kUsd) / TOKENS_PER_PRICE_UNIT;

  return Math.round(cost * COST_DECIMALS_FACTOR) / COST_DECIMALS_FACTOR;
}
