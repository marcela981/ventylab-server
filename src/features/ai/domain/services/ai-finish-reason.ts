/*
 * Funcionalidad: Motivo de fin de una respuesta de IA
 * Descripción: Normaliza el motivo de fin que reporta cada proveedor (finish_reason de OpenAI, stop_reason de Anthropic, finishReason de Gemini y del proveedor externo) a un valor común para la telemetría: stop (respuesta completa), length (cortada por el máximo de tokens), content_filter (bloqueada por seguridad o rechazo), error (la llamada falló) o unknown (motivo no reconocido)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type AiFinishReason = "stop" | "length" | "content_filter" | "error" | "unknown";

export const STOP_FINISH_REASON: AiFinishReason = "stop";
export const ERROR_FINISH_REASON: AiFinishReason = "error";
export const UNKNOWN_FINISH_REASON: AiFinishReason = "unknown";

export const AI_FINISH_REASON_VALUES: readonly AiFinishReason[] = ["stop", "length", "content_filter", "error", "unknown"] as const;

const STOP_REASONS: readonly string[] = ["stop", "end_turn", "stop_sequence", "eos", "complete", "finished"];

const LENGTH_REASONS: readonly string[] = ["length", "max_tokens", "max_output_tokens", "model_context_window_exceeded"];

const CONTENT_FILTER_REASONS: readonly string[] = ["content_filter", "safety", "recitation", "blocklist", "prohibited_content", "spii", "refusal", "image_safety"];

// undefined when the provider reported nothing; unknown when it reported a reason this table does not know.
export function normalizeFinishReason(raw: unknown): AiFinishReason | undefined {
  if (typeof raw !== "string" || raw.trim() === "") {
    return undefined;
  }

  const reason: string = raw.trim().toLowerCase();

  if (STOP_REASONS.includes(reason)) {
    return "stop";
  }

  if (LENGTH_REASONS.includes(reason)) {
    return "length";
  }

  if (CONTENT_FILTER_REASONS.includes(reason)) {
    return "content_filter";
  }

  return UNKNOWN_FINISH_REASON;
}
