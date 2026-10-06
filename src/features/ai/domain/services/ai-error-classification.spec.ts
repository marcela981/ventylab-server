/*
 * Funcionalidad: Pruebas de la clasificación de errores de IA
 * Descripción: Verifica que los errores de proveedores se clasifiquen por tipo (tiempo agotado, 429, 5xx, red, cliente, abortado) y que solo los transitorios se consideren reintentables
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AiCallAbortedError, AiProviderError, type AiProviderErrorKind } from "@/features/ai/domain/ai.errors";
import { classifyAiError, isTransientAiError } from "@/features/ai/domain/services/ai-error-classification";

function withProperties(properties: Record<string, unknown>): Error {
  return Object.assign(new Error("x"), properties);
}

describe("classifyAiError", () => {
  it.each<[string, unknown, AiProviderErrorKind, boolean]>([
    ["provider timeout", new AiProviderError("TIMEOUT", "t"), "TIMEOUT", true],
    ["HTTP 429", withProperties({ status: 429 }), "RATE_LIMIT", true],
    ["HTTP 500", withProperties({ status: 500 }), "SERVER", true],
    ["HTTP 503 as statusCode", withProperties({ statusCode: 503 }), "SERVER", true],
    ["HTTP 400", withProperties({ status: 400 }), "CLIENT", false],
    ["socket reset", withProperties({ code: "ECONNRESET" }), "NETWORK", true],
    ["fetch cause", Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } }), "NETWORK", true],
    ["abort error", withProperties({ name: "AbortError" }), "ABORTED", false],
    ["caller abort", new AiCallAbortedError(), "ABORTED", false],
    ["unknown", "boom", "CLIENT", false],
  ])("should classify %s", (_name: string, error: unknown, kind: AiProviderErrorKind, transient: boolean) => {
    expect(classifyAiError(error)).toBe(kind);
    expect(isTransientAiError(error)).toBe(transient);
  });
});
