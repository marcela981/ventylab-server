/*
 * Funcionalidad: Rastro de intentos de una llamada de IA
 * Descripción: Entrada del rastro que la telemetría guarda por llamada de IA (columna attempt_trail): una por cada intento real contra un proveedor, incluidos los reintentos, con proveedor, modelo, resultado (success, error o aborted), código de error clasificado y latencia del intento, más una entrada fallback con el proveedor deterministic cuando responde el respaldo del consumidor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type AiAttemptOutcome = "success" | "error" | "aborted" | "fallback";

export interface AiAttemptTrailEntry {
  readonly provider: string;
  readonly model?: string;
  readonly outcome: AiAttemptOutcome;
  readonly errorCode?: string;
  readonly latencyMs: number;
}
