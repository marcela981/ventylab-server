/*
 * Funcionalidad: Token de ajustes de las sesiones de simulación
 * Descripción: Ajustes leídos de la configuración para las sesiones con eventos: tolerancia del tiempo simulado frente al tiempo real, minutos de inactividad para marcar una sesión como abandonada y tamaño máximo de un lote de eventos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const SIMULATION_SESSION_SETTINGS_TOKEN: unique symbol = Symbol("SIMULATION_SESSION_SETTINGS_TOKEN");

export interface SimulationSessionSettings {
  readonly eventTimeToleranceMs: number;
  readonly abandonAfterMs: number;
  readonly maxEventBatchSize: number;
}
