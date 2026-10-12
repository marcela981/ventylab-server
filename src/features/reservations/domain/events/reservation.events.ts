/*
 * Funcionalidad: Eventos de Reservation
 * Descripción: Eventos de dominio de la reserva (creada, cancelada, desplazada por un docente o administrador, completada) con datos primitivos para que otras features (comandos y telemetría del ventilador) reaccionen sin depender de la entidad; las tres primeras implementan CatalogDomainEvent (reservation.created, reservation.cancelled, reservation.preempted)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import {
  type CatalogDomainEvent,
  catalogMeta,
  type ReservationCancelledPayload,
  type ReservationCreatedPayload,
  type ReservationPreemptedPayload,
} from "@/common/domain/events/domain-event-catalog";
import { type ReservationHolderSnapshot } from "@/features/reservations/domain/value-objects/reservation-holder";

export interface ReservationEventWindow {
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export class ReservationCreatedEvent extends DomainEvent implements CatalogDomainEvent<"reservation.created"> {
  public readonly reservationId: string;
  public readonly holder: ReservationHolderSnapshot;
  public readonly window: ReservationEventWindow;
  public readonly createdById: string;

  public constructor({
    reservationId,
    holder,
    window,
    createdById,
  }: {
    reservationId: string;
    holder: ReservationHolderSnapshot;
    window: ReservationEventWindow;
    createdById: string;
  }) {
    super({ performedBy: createdById });
    this.reservationId = reservationId;
    this.holder = holder;
    this.window = window;
    this.createdById = createdById;
  }

  public get catalogName(): "reservation.created" {
    return "reservation.created";
  }

  public toCatalogPayload(): ReservationCreatedPayload {
    return {
      ...catalogMeta(this),
      reservationId: this.reservationId,
      holder: this.holder,
      startsAt: this.window.startsAt,
      endsAt: this.window.endsAt,
      createdById: this.createdById,
    };
  }
}

export class ReservationCancelledEvent extends DomainEvent implements CatalogDomainEvent<"reservation.cancelled"> {
  public readonly reservationId: string;
  public readonly holder: ReservationHolderSnapshot;
  public readonly window: ReservationEventWindow;
  public readonly wasActive: boolean;

  public constructor({
    reservationId,
    holder,
    window,
    wasActive,
    performedBy,
  }: {
    reservationId: string;
    holder: ReservationHolderSnapshot;
    window: ReservationEventWindow;
    wasActive: boolean;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.reservationId = reservationId;
    this.holder = holder;
    this.window = window;
    this.wasActive = wasActive;
  }

  public get catalogName(): "reservation.cancelled" {
    return "reservation.cancelled";
  }

  public toCatalogPayload(): ReservationCancelledPayload {
    return {
      ...catalogMeta(this),
      reservationId: this.reservationId,
      holder: this.holder,
      startsAt: this.window.startsAt,
      endsAt: this.window.endsAt,
      wasActive: this.wasActive,
    };
  }
}

export class ReservationPreemptedEvent extends DomainEvent implements CatalogDomainEvent<"reservation.preempted"> {
  public readonly reservationId: string;
  public readonly previousHolder: ReservationHolderSnapshot;
  public readonly window: ReservationEventWindow;
  public readonly reason?: string;
  public readonly wasActive: boolean;
  public readonly preemptedById: string;
  public readonly replacedByReservationId: string;

  public constructor({
    reservationId,
    previousHolder,
    window,
    reason,
    wasActive,
    preemptedById,
    replacedByReservationId,
  }: {
    reservationId: string;
    previousHolder: ReservationHolderSnapshot;
    window: ReservationEventWindow;
    reason?: string;
    wasActive: boolean;
    preemptedById: string;
    replacedByReservationId: string;
  }) {
    super({ performedBy: preemptedById });
    this.reservationId = reservationId;
    this.previousHolder = previousHolder;
    this.window = window;
    this.reason = reason;
    this.wasActive = wasActive;
    this.preemptedById = preemptedById;
    this.replacedByReservationId = replacedByReservationId;
  }

  public get catalogName(): "reservation.preempted" {
    return "reservation.preempted";
  }

  public toCatalogPayload(): ReservationPreemptedPayload {
    return {
      ...catalogMeta(this),
      reservationId: this.reservationId,
      previousHolder: this.previousHolder,
      startsAt: this.window.startsAt,
      endsAt: this.window.endsAt,
      wasActive: this.wasActive,
      reason: this.reason,
      preemptedById: this.preemptedById,
      replacedByReservationId: this.replacedByReservationId,
    };
  }
}

export class ReservationCompletedEvent extends DomainEvent {
  public readonly reservationId: string;
  public readonly holder: ReservationHolderSnapshot;
  public readonly window: ReservationEventWindow;

  public constructor({
    reservationId,
    holder,
    window,
    performedBy,
  }: {
    reservationId: string;
    holder: ReservationHolderSnapshot;
    window: ReservationEventWindow;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.reservationId = reservationId;
    this.holder = holder;
    this.window = window;
  }
}
