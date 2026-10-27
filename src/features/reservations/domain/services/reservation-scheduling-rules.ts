/*
 * Funcionalidad: Reglas de programación de reservas
 * Descripción: Reglas puras de calendario de una reserva: alineación a la granularidad de la franja, duración máxima, inicio no pasado (se admite la franja en curso), antelación máxima y límite de reservas futuras; ventana de la reserva inmediata (desde ahora truncado al minuto, con duraciones de 15, 30, 45 o 60 minutos)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  ReservationInPastError,
  ReservationLimitReachedError,
  ReservationNotAlignedError,
  ReservationTooFarAheadError,
  ReservationTooLongError,
} from "@/features/reservations/domain/reservations.errors";
import { ReservationWindow } from "@/features/reservations/domain/value-objects/reservation-window";

const MS_PER_MINUTE: number = 60_000;
const MS_PER_DAY: number = 86_400_000;

export const IMMEDIATE_RESERVATION_DURATION_VALUES: readonly number[] = [15, 30, 45, 60];

/** Window of an immediate reservation: from now truncated to the minute, never aligned to the slot */
export function immediateReservationWindow(now: Date, durationMinutes: number): ReservationWindow {
  const startsAt: Date = new Date(Math.floor(now.getTime() / MS_PER_MINUTE) * MS_PER_MINUTE);

  return ReservationWindow.create(startsAt, new Date(startsAt.getTime() + durationMinutes * MS_PER_MINUTE));
}

export interface ReservationSchedulingLimits {
  readonly maxDurationMinutes: number;
  readonly slotMinutes: number;
  readonly maxAdvanceDays: number;
}

export function floorToSlot(instant: Date, slotMinutes: number): Date {
  const slotMs: number = slotMinutes * MS_PER_MINUTE;

  return new Date(Math.floor(instant.getTime() / slotMs) * slotMs);
}

export function isAlignedToSlot(instant: Date, slotMinutes: number): boolean {
  return instant.getTime() % (slotMinutes * MS_PER_MINUTE) === 0;
}

export function assertWithinMaxDuration(window: ReservationWindow, maxDurationMinutes: number): void {
  if (window.durationMinutes > maxDurationMinutes) {
    throw new ReservationTooLongError(maxDurationMinutes);
  }
}

export function assertScheduledWindowRules(window: ReservationWindow, now: Date, limits: ReservationSchedulingLimits): void {
  if (!isAlignedToSlot(window.startsAt, limits.slotMinutes) || !isAlignedToSlot(window.endsAt, limits.slotMinutes)) {
    throw new ReservationNotAlignedError(limits.slotMinutes);
  }

  assertWithinMaxDuration(window, limits.maxDurationMinutes);

  if (window.startsAt.getTime() < floorToSlot(now, limits.slotMinutes).getTime()) {
    throw new ReservationInPastError();
  }

  if (window.startsAt.getTime() > now.getTime() + limits.maxAdvanceDays * MS_PER_DAY) {
    throw new ReservationTooFarAheadError(limits.maxAdvanceDays);
  }
}

export function assertBelowUpcomingLimit(upcomingCount: number, limit: number): void {
  if (upcomingCount >= limit) {
    throw new ReservationLimitReachedError(limit);
  }
}
