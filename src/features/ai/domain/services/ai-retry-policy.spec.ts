/*
 * Funcionalidad: Pruebas de la política de reintento de proveedores de IA
 * Descripción: Verifica el retroceso exponencial con jitter completo y su tope, la lectura de Retry-After en segundos y como fecha HTTP (nunca negativa, acotada, ignorada si no es válida) y la elección entre la espera del proveedor (acotada) y el retroceso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  fullJitterBackoffMs,
  MAX_BACKOFF_MS,
  MAX_PROPAGATED_RETRY_AFTER_MS,
  MAX_RETRY_AFTER_WAIT_MS,
  parseRetryAfterMs,
  retryDelayMs,
} from "@/features/ai/domain/services/ai-retry-policy";

describe("AI retry policy", () => {
  it("draws a full-jitter wait below base * 2^attempt, capped", () => {
    expect(fullJitterBackoffMs(500, 0, () => 0.999)).toBe(499);
    expect(fullJitterBackoffMs(500, 2, () => 0.5)).toBe(1000);
    expect(fullJitterBackoffMs(500, 0, () => 0)).toBe(0);
    expect(fullJitterBackoffMs(500, 10, () => 1)).toBe(MAX_BACKOFF_MS);
  });

  it("parses Retry-After as seconds or an HTTP date, never negative and capped", () => {
    const now: number = Date.parse("2026-11-04T12:00:00Z");

    expect(parseRetryAfterMs("2", now)).toBe(2000);
    expect(parseRetryAfterMs("1.5", now)).toBe(1500);
    expect(parseRetryAfterMs("Wed, 04 Nov 2026 12:00:03 GMT", now)).toBe(3000);
    expect(parseRetryAfterMs("Wed, 04 Nov 2026 11:59:00 GMT", now)).toBe(0);
    expect(parseRetryAfterMs("3600", now)).toBe(MAX_PROPAGATED_RETRY_AFTER_MS);
    expect(parseRetryAfterMs("soon", now)).toBeUndefined();
    expect(parseRetryAfterMs(null, now)).toBeUndefined();
    expect(parseRetryAfterMs("  ", now)).toBeUndefined();
  });

  it("waits the provider's Retry-After (capped) or else the jittered backoff", () => {
    expect(retryDelayMs(500, 0, 1200, () => 0)).toBe(1200);
    expect(retryDelayMs(500, 0, 30_000, () => 0)).toBe(MAX_RETRY_AFTER_WAIT_MS);
    expect(retryDelayMs(500, 1, undefined, () => 0.5)).toBe(500);
  });
});
