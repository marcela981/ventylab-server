/*
 * Funcionalidad: Prompt de la sonda de salud de IA
 * Descripción: Prompt mínimo y versionado que la sonda manual de un proveedor envía con muy pocos tokens de salida y un tiempo máximo corto; define el caso de uso y la referencia con que se registra en la telemetría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type BuiltPrompt } from "@/features/ai/domain/prompts/prompt-template";
import { TOPIC_CHECK_USE_CASE, type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export const HEALTH_PROBE_PROMPT_VERSION: string = "1.0.0";

// ai_call_logs.use_case is a database enum, so probes are logged under the cheapest classification use case and told apart by HEALTH_PROBE_REF_TYPE.
export const HEALTH_PROBE_USE_CASE: AiUseCaseValue = TOPIC_CHECK_USE_CASE;

export const HEALTH_PROBE_REF_TYPE: string = "health_probe";

export const HEALTH_PROBE_MAX_OUTPUT_TOKENS: number = 8;

export const HEALTH_PROBE_TIMEOUT_MS: number = 10_000;

export const HEALTH_PROBE_PROMPT: BuiltPrompt = {
  system: "You are a connectivity check. Reply with the single word OK.",
  messages: [{ role: "user", content: "ping" }],
  responseFormat: "text",
};
