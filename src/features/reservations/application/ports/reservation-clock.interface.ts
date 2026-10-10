/*
 * Funcionalidad: Puerto del reloj de reservas
 * Descripción: Fuente del instante actual que usan los casos de uso de reservas, sustituible en las pruebas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const RESERVATION_CLOCK_TOKEN: unique symbol = Symbol("RESERVATION_CLOCK_TOKEN");

export interface IReservationClock {
  now(): Date;
}
