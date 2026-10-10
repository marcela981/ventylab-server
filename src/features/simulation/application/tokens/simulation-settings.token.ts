/*
 * Funcionalidad: Token SIMULATION_SETTINGS_TOKEN
 * Descripción: Ajustes de simulación resueltos desde la configuración (identificador del dispositivo VENTILATOR_DEVICE_ID)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const SIMULATION_SETTINGS_TOKEN: unique symbol = Symbol("SIMULATION_SETTINGS_TOKEN");

export interface SimulationSettings {
  deviceId: string;
}
