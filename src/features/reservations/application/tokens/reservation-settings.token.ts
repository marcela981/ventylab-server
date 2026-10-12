/*
 * Funcionalidad: Ajustes de reservas
 * Descripción: Token e interfaz de los ajustes de reservas (cada lectura devuelve el valor vigente de los ajustes de la plataforma): duración máxima, granularidad de franja, días de antelación, máximo de reservas futuras por estudiante y por grupo, e identificador del dispositivo que es la clave del bloqueo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ReservationSchedulingLimits } from "@/features/reservations/domain/services/reservation-scheduling-rules";

export const RESERVATION_SETTINGS_TOKEN: unique symbol = Symbol("RESERVATION_SETTINGS_TOKEN");

export interface ReservationSettings extends ReservationSchedulingLimits {
  readonly maxUpcomingPerStudent: number;
  readonly maxUpcomingPerGroup: number;
  readonly deviceId: string;
}
