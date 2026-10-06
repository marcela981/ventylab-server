/*
 * Funcionalidad: Clasificación de errores de proveedores de IA
 * Descripción: Clasifica un error de proveedor de IA en un tipo (tiempo agotado, HTTP 429, 5xx, red, cliente, respuesta inválida, abortado) y decide si es transitorio y merece un reintento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AiCallAbortedError, AiProviderError, type AiProviderErrorKind } from "@/features/ai/domain/ai.errors";

const TRANSIENT_KINDS: readonly AiProviderErrorKind[] = ["TIMEOUT", "RATE_LIMIT", "SERVER", "NETWORK"];

const NETWORK_ERROR_CODES: readonly string[] = ["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "EPIPE", "UND_ERR_SOCKET", "UND_ERR_CONNECT_TIMEOUT"];

export function classifyHttpStatus(statusCode: number): AiProviderErrorKind {
  if (statusCode === 408) {
    return "TIMEOUT";
  }

  if (statusCode === 429) {
    return "RATE_LIMIT";
  }

  if (statusCode >= 500) {
    return "SERVER";
  }

  return "CLIENT";
}

function readProperty(error: unknown, key: string): unknown {
  return typeof error === "object" && error !== null && key in error ? (error as Record<string, unknown>)[key] : undefined;
}

export function classifyAiError(error: unknown): AiProviderErrorKind {
  if (error instanceof AiProviderError) {
    return error.kind;
  }

  if (error instanceof AiCallAbortedError) {
    return "ABORTED";
  }

  const name: unknown = readProperty(error, "name");

  if (name === "AbortError") {
    return "ABORTED";
  }

  if (name === "TimeoutError") {
    return "TIMEOUT";
  }

  const status: unknown = readProperty(error, "status") ?? readProperty(error, "statusCode");

  if (typeof status === "number" && status > 0) {
    return classifyHttpStatus(status);
  }

  const code: unknown = readProperty(error, "code") ?? readProperty(readProperty(error, "cause"), "code");

  if (typeof code === "string" && NETWORK_ERROR_CODES.includes(code)) {
    return "NETWORK";
  }

  if (error instanceof TypeError && /fetch failed|network/i.test(error.message)) {
    return "NETWORK";
  }

  return "CLIENT";
}

export function isTransientAiError(error: unknown): boolean {
  return TRANSIENT_KINDS.includes(classifyAiError(error));
}
