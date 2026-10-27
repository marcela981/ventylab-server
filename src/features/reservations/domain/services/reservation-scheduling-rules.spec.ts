/*
 * Funcionalidad: Pruebas de las reglas de programación de reservas
 * Descripción: Verifica alineación a la franja, duración máxima, inicio pasado (admitiendo la franja en curso), antelación máxima, límite de reservas futuras y la ventana inválida, y la ventana de la reserva inmediata truncada al minuto
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  InvalidReservationWindowError,
  ReservationInPastError,
  ReservationLimitReachedError,
  ReservationNotAlignedError,
  ReservationTooFarAheadError,
  ReservationTooLongError,
} from "@/features/reservations/domain/reservations.errors";
import {
  assertBelowUpcomingLimit,
  assertScheduledWindowRules,
  immediateReservationWindow,
  type ReservationSchedulingLimits,
} from "@/features/reservations/domain/services/reservation-scheduling-rules";
import { ReservationWindow } from "@/features/reservations/domain/value-objects/reservation-window";

const LIMITS: ReservationSchedulingLimits = { maxDurationMinutes: 120, slotMinutes: 15, maxAdvanceDays: 14 };
const NOW: Date = new Date("2026-10-12T10:05:00.000Z");

function window(start: string, end: string): ReservationWindow {
  return ReservationWindow.create(new Date(start), new Date(end));
}

describe("reservation scheduling rules", () => {
  it("accepts an aligned window in the current slot", () => {
    const action = (): void => assertScheduledWindowRules(window("2026-10-12T10:00:00Z", "2026-10-12T11:00:00Z"), NOW, LIMITS);

    expect(action).not.toThrow();
  });

  it.each<[string, string, string, new (...args: never[]) => Error]>([
    ["misaligned start", "2026-10-12T11:07:00Z", "2026-10-12T12:00:00Z", ReservationNotAlignedError],
    ["misaligned end", "2026-10-12T11:00:00Z", "2026-10-12T11:50:00Z", ReservationNotAlignedError],
    ["longer than the maximum", "2026-10-12T11:00:00Z", "2026-10-12T13:15:00Z", ReservationTooLongError],
    ["starting in a past slot", "2026-10-12T09:45:00Z", "2026-10-12T10:30:00Z", ReservationInPastError],
    ["starting beyond the maximum advance", "2026-10-26T11:00:00Z", "2026-10-26T12:00:00Z", ReservationTooFarAheadError],
  ])("rejects a window %s", (_label: string, start: string, end: string, expected: new (...args: never[]) => Error) => {
    const action = (): void => assertScheduledWindowRules(window(start, end), NOW, LIMITS);

    expect(action).toThrow(expected);
  });

  it("rejects a window that does not end after it starts", () => {
    const action = (): ReservationWindow => window("2026-10-12T11:00:00Z", "2026-10-12T11:00:00Z");

    expect(action).toThrow(InvalidReservationWindowError);
  });

  it("enforces the upcoming reservations limit", () => {
    const below = (): void => assertBelowUpcomingLimit(2, 3);
    const reached = (): void => assertBelowUpcomingLimit(3, 3);

    expect(below).not.toThrow();
    expect(reached).toThrow(ReservationLimitReachedError);
  });

  it("starts an immediate reservation at the current minute and never aligns it to the slot", () => {
    const immediate: ReservationWindow = immediateReservationWindow(new Date("2026-10-12T10:07:42.500Z"), 30);

    expect([immediate.startsAt.toISOString(), immediate.endsAt.toISOString()]).toEqual(["2026-10-12T10:07:00.000Z", "2026-10-12T10:37:00.000Z"]);
  });
});
