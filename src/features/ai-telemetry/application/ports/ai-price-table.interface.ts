/*
 * Funcionalidad: Puerto de la tabla de precios de IA
 * Descripción: Token de inyección de la tabla de precios por proveedor y modelo (USD por millón de tokens de entrada y salida) con la que la telemetría estima el costo de las llamadas que llegan sin costo calculado; por defecto la tabla está vacía y el costo queda sin estimar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiPriceTable } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

export { type AiModelPrice, type AiPriceTable } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

export const AI_PRICE_TABLE_TOKEN: unique symbol = Symbol("AI_PRICE_TABLE_TOKEN");

export const DEFAULT_AI_PRICE_TABLE: AiPriceTable = {};
