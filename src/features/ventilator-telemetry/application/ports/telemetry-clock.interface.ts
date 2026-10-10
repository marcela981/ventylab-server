/*
 * Funcionalidad: Puerto ITelemetryClock
 * Descripción: Reloj de la telemetría: hora de pared en milisegundos epoch para marcas de tiempo y reloj monótono de alta resolución para medir latencias
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const TELEMETRY_CLOCK_TOKEN: unique symbol = Symbol("TELEMETRY_CLOCK_TOKEN");

export interface ITelemetryClock {
  now(): number;
  monotonic(): number;
}
