/*
 * Funcionalidad: Política de reintento de proveedores de IA
 * Descripción: Funciones puras de la espera entre reintentos de un proveedor de IA: retroceso exponencial con jitter completo (aleatorio entre 0 y base·2^intento, acotado), lectura de la cabecera Retry-After (segundos o fecha HTTP, nunca negativa y acotada) y elección de la espera: la indicada por el proveedor si la envió (acotada) o el retroceso con jitter
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

// Upper bound of one jittered backoff wait inside a user request.
export const MAX_BACKOFF_MS: number = 4_000;

// Upper bound of a provider's Retry-After honored while the user waits; a longer wait moves to the next provider sooner.
export const MAX_RETRY_AFTER_WAIT_MS: number = 5_000;

// Upper bound of the Retry-After propagated to the client when every provider is rate limited.
export const MAX_PROPAGATED_RETRY_AFTER_MS: number = 60_000;

const MS_PER_SECOND: number = 1000;

// Full jitter (AWS architecture blog): a uniform wait in [0, min(cap, base * 2^attempt)] spreads concurrent retries.
export function fullJitterBackoffMs(baseMs: number, attempt: number, random: () => number = Math.random, capMs: number = MAX_BACKOFF_MS): number {
  const ceiling: number = Math.min(capMs, baseMs * 2 ** Math.max(0, attempt));

  return Math.floor(Math.min(1, Math.max(0, random())) * ceiling);
}

// Retry-After is either delta-seconds or an HTTP date (RFC 9110 §10.2.3); anything else is ignored.
export function parseRetryAfterMs(value: string | null | undefined, now: number = Date.now(), capMs: number = MAX_PROPAGATED_RETRY_AFTER_MS): number | undefined {
  if (value === null || value === undefined || value.trim() === "") {
    return undefined;
  }

  const trimmed: string = value.trim();
  let delayMs: number;

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    delayMs = Number(trimmed) * MS_PER_SECOND;
  } else {
    const date: number = Date.parse(trimmed);

    if (Number.isNaN(date)) {
      return undefined;
    }

    delayMs = date - now;
  }

  return Math.min(capMs, Math.max(0, Math.round(delayMs)));
}

export function retryDelayMs(baseMs: number, attempt: number, retryAfterMs: number | undefined, random: () => number = Math.random): number {
  return retryAfterMs !== undefined ? Math.min(retryAfterMs, MAX_RETRY_AFTER_WAIT_MS) : fullJitterBackoffMs(baseMs, attempt, random);
}
