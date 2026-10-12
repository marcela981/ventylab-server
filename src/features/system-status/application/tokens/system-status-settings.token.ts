/*
 * Funcionalidad: Ajustes del estado del sistema
 * Descripción: Token y forma de los ajustes del estado del sistema: segundos de caché, tiempo máximo por chequeo, intervalo de reevaluación en segundo plano, ventana de métricas de IA y versión y commit de la aplicación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const SYSTEM_STATUS_SETTINGS_TOKEN: unique symbol = Symbol("SYSTEM_STATUS_SETTINGS_TOKEN");

export interface SystemStatusSettings {
  readonly cacheSeconds: number;
  readonly checkTimeoutMs: number;
  readonly reevaluateIntervalMs: number;
  readonly aiWindowMinutes: number;
  readonly appVersion: string;
  readonly appCommit?: string;
}
