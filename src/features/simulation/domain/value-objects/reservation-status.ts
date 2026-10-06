/*
 * Funcionalidad: Estado de la reserva del ventilador
 * Descripción: Valores del enum ReservationStatus de la tabla ventilator_reservations (activa, completada, cancelada, expirada) y su conversión desde la persistencia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidValueObjectError } from "@/common/domain/errors/invalid-value-object.error";

export type ReservationStatusValue = "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";

export const ACTIVE_RESERVATION_STATUS: ReservationStatusValue = "ACTIVE";
export const COMPLETED_RESERVATION_STATUS: ReservationStatusValue = "COMPLETED";
export const CANCELLED_RESERVATION_STATUS: ReservationStatusValue = "CANCELLED";
export const EXPIRED_RESERVATION_STATUS: ReservationStatusValue = "EXPIRED";

export const RESERVATION_STATUS_VALUES: readonly ReservationStatusValue[] = [
  ACTIVE_RESERVATION_STATUS,
  COMPLETED_RESERVATION_STATUS,
  CANCELLED_RESERVATION_STATUS,
  EXPIRED_RESERVATION_STATUS,
] as const;

export function toReservationStatus(value: string): ReservationStatusValue {
  if (!RESERVATION_STATUS_VALUES.includes(value as ReservationStatusValue)) {
    throw new InvalidValueObjectError("ReservationStatus", value);
  }

  return value as ReservationStatusValue;
}
