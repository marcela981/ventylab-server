/*
 * Funcionalidad: Token SIMULATION_SETTINGS_TOKEN
 * Descripción: Ajustes de simulación resueltos desde la configuración (dispositivo por defecto e intervalo mínimo entre tramas `ventilator:data` derivado de WS_MAX_HZ)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const SIMULATION_SETTINGS_TOKEN: unique symbol = Symbol("SIMULATION_SETTINGS_TOKEN");

export interface SimulationSettings {
  deviceId: string;
  telemetryThrottleMs: number;
}
