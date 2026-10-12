/*
 * Funcionalidad: Salud de proveedores de IA
 * Descripción: Modelos de lectura del estado de cada proveedor LLM (configurado, estado del cortocircuito, último éxito y último error con su código, sin mensajes) y del resultado de una sonda manual
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type AiBreakerStateValue = "closed" | "open" | "half_open";

export interface AiBreakerSnapshot {
  readonly state: AiBreakerStateValue;
  readonly lastSuccessAt?: Date;
  readonly lastErrorAt?: Date;
  readonly lastErrorCode?: string;
}

export interface AiProviderHealth extends AiBreakerSnapshot {
  readonly provider: string;
  readonly configured: boolean;
}

export interface AiProbeResult {
  readonly provider: string;
  readonly model: string;
  readonly ok: boolean;
  readonly latencyMs: number;
  readonly errorCode?: string;
  readonly aiCallId: string;
}
