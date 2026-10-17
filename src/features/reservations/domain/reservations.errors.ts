/*
 * Funcionalidad: Errores de reservas
 * Descripción: Errores de dominio de la feature de reservas del ventilador (ventana, franja, antelación, límites, permisos de reserva y de filtro del calendario por grupo, conflicto con detalles de las reservas en conflicto y transición de estado inválida) con su clave i18n
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export interface ReservationConflictDetail {
  readonly reservationId?: string;
  readonly holderType?: string;
  readonly holderRole?: string;
  readonly holderName?: string;
  readonly holderIdentifier?: string;
  readonly groupName?: string;
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface ReservationConflictDetails {
  readonly preemptable: boolean;
  readonly conflicts: ReservationConflictDetail[];
}

export class ReservationNotFoundError extends DomainError {
  public constructor() {
    super("Reservation not found", "reservations.reservation_not_found");
  }
}

export class InvalidReservationWindowError extends DomainError {
  public constructor() {
    super("The reservation must end after it starts", "reservations.invalid_window");
  }
}

export class ReservationNotAlignedError extends DomainError {
  public constructor(public readonly slotMinutes: number) {
    super("The reservation must start and end on a slot boundary", "reservations.not_aligned");
  }

  public get i18nArgs(): Record<string, number> {
    return { slotMinutes: this.slotMinutes };
  }
}

export class ReservationTooLongError extends DomainError {
  public constructor(public readonly maxMinutes: number) {
    super("The reservation exceeds the maximum duration", "reservations.too_long");
  }

  public get i18nArgs(): Record<string, number> {
    return { maxMinutes: this.maxMinutes };
  }
}

export class ReservationInPastError extends DomainError {
  public constructor() {
    super("The reservation cannot start in the past", "reservations.in_past");
  }
}

export class ReservationTooFarAheadError extends DomainError {
  public constructor(public readonly maxDays: number) {
    super("The reservation starts too far in the future", "reservations.too_far_ahead");
  }

  public get i18nArgs(): Record<string, number> {
    return { maxDays: this.maxDays };
  }
}

export class ReservationLimitReachedError extends DomainError {
  public constructor(public readonly limit: number) {
    super("The maximum number of upcoming reservations was reached", "reservations.limit_reached");
  }

  public get i18nArgs(): Record<string, number> {
    return { limit: this.limit };
  }
}

export class InvalidReservationHolderError extends DomainError {
  public constructor() {
    super("A user reservation needs a user and a group reservation needs a group", "reservations.invalid_holder");
  }
}

export class ReservationHolderNotFoundError extends DomainError {
  public constructor() {
    super("The user or group of the reservation does not exist", "reservations.holder_not_found");
  }
}

export class ReservationForbiddenError extends DomainError {
  public constructor() {
    super("You cannot reserve the ventilator for this user or group", "reservations.reserve_forbidden");
  }
}

export class ReservationGroupFilterForbiddenError extends DomainError {
  public constructor() {
    super("You cannot list the reservations of this group", "reservations.group_filter_forbidden");
  }
}

export class ReservationCancelForbiddenError extends DomainError {
  public constructor() {
    super("You cannot cancel this reservation", "reservations.cancel_forbidden");
  }
}

export class ReservationNotScheduledError extends DomainError {
  public constructor() {
    super("The reservation is no longer scheduled", "reservations.not_scheduled");
  }
}

export class InvalidReservationRangeError extends DomainError {
  public constructor(public readonly maxDays: number) {
    super("The requested range is invalid", "reservations.invalid_range");
  }

  public get i18nArgs(): Record<string, number> {
    return { maxDays: this.maxDays };
  }
}

export class ReservationConflictError extends DomainError {
  public constructor(public readonly details: ReservationConflictDetails) {
    super("The slot overlaps another reservation", details.preemptable ? "reservations.conflict_preemptable" : "reservations.conflict");
  }
}
