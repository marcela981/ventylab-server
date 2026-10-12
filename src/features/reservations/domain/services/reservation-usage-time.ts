/*
 * Funcionalidad: Tiempo de uso de una reserva
 * Descripción: Función pura que calcula los minutos de uso efectivo del ventilador en una reserva: desde el inicio hasta el primero de fin programado, el instante actual o, si fue cancelada o desalojada, su última actualización (momento del corte)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  CANCELLED_RESERVATION_STATUS,
  PREEMPTED_RESERVATION_STATUS,
  type ReservationStatusValue,
} from "@/features/reservations/domain/value-objects/reservation-status";

const MS_PER_MINUTE: number = 60_000;

export interface ReservationUsageWindow {
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly status: ReservationStatusValue;
  readonly updatedAt: Date;
}

export function reservationUsageMinutes(reservation: ReservationUsageWindow, now: Date): number {
  const interrupted: boolean = reservation.status === CANCELLED_RESERVATION_STATUS || reservation.status === PREEMPTED_RESERVATION_STATUS;
  const endCandidates: number[] = [reservation.endsAt.getTime(), now.getTime(), ...(interrupted ? [reservation.updatedAt.getTime()] : [])];
  const end: number = Math.min(...endCandidates);

  return Math.max(0, end - reservation.startsAt.getTime()) / MS_PER_MINUTE;
}
