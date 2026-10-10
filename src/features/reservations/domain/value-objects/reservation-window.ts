/*
 * Funcionalidad: Ventana de la reserva
 * Descripción: Value object del intervalo semiabierto [inicio, fin) de una reserva: valida que termine después de empezar, calcula su duración y detecta solapamientos e instantes contenidos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidReservationWindowError } from "@/features/reservations/domain/reservations.errors";

const MS_PER_MINUTE: number = 60_000;

export class ReservationWindow {
  private readonly _startsAt: Date;
  private readonly _endsAt: Date;

  private constructor(startsAt: Date, endsAt: Date) {
    this._startsAt = startsAt;
    this._endsAt = endsAt;
  }

  public get startsAt(): Date {
    return new Date(this._startsAt.getTime());
  }

  public get endsAt(): Date {
    return new Date(this._endsAt.getTime());
  }

  public get durationMinutes(): number {
    return (this._endsAt.getTime() - this._startsAt.getTime()) / MS_PER_MINUTE;
  }

  public static create(startsAt: Date, endsAt: Date): ReservationWindow {
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= startsAt.getTime()) {
      throw new InvalidReservationWindowError();
    }

    return new ReservationWindow(new Date(startsAt.getTime()), new Date(endsAt.getTime()));
  }

  public overlaps(other: ReservationWindow): boolean {
    return this._startsAt.getTime() < other._endsAt.getTime() && other._startsAt.getTime() < this._endsAt.getTime();
  }

  public contains(instant: Date): boolean {
    return this._startsAt.getTime() <= instant.getTime() && instant.getTime() < this._endsAt.getTime();
  }

  public equals(other: ReservationWindow): boolean {
    return this._startsAt.getTime() === other._startsAt.getTime() && this._endsAt.getTime() === other._endsAt.getTime();
  }
}
