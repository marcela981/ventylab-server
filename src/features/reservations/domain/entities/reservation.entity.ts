/*
 * Funcionalidad: Entidad Reservation
 * Descripción: Agregado de la reserva programada del ventilador físico (titular usuario o grupo, creador, ventana, estado y datos de desplazamiento); se programa, cancela, desplaza o completa con bitácora de auditoría y eventos de dominio, y deriva si está activa en un instante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { generateId } from "@/common/domain/utils/generate-id";
import {
  ReservationCancelledEvent,
  ReservationCompletedEvent,
  ReservationCreatedEvent,
  ReservationPreemptedEvent,
} from "@/features/reservations/domain/events/reservation.events";
import { ReservationNotScheduledError } from "@/features/reservations/domain/reservations.errors";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";
import {
  CANCELLED_RESERVATION_STATUS,
  COMPLETED_RESERVATION_STATUS,
  PREEMPTED_RESERVATION_STATUS,
  type ReservationStatusValue,
  SCHEDULED_RESERVATION_STATUS,
} from "@/features/reservations/domain/value-objects/reservation-status";
import { ReservationWindow } from "@/features/reservations/domain/value-objects/reservation-window";

export const RESERVATION_ENTITY_COLLECTION: string = "reservations";
export const RESERVATION_ENTITY_TYPE: string = "reservation";

export type ReservationAuditAction = "reservation_created" | "reservation_cancelled" | "reservation_preempted" | "reservation_completed";

export class Reservation extends AggregateRoot {
  private _id: string;
  private _holder: ReservationHolder;
  private _createdById: string;
  private _startsAt: Date;
  private _endsAt: Date;
  private _status: ReservationStatusValue;
  private _purpose?: string;
  private _preemptedById?: string;
  private _preemptedReason?: string;
  private _replacedByReservationId?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<ReservationAuditAction>[];

  private constructor({
    id,
    holder,
    createdById,
    startsAt,
    endsAt,
    status,
    purpose,
    preemptedById,
    preemptedReason,
    replacedByReservationId,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    holder: ReservationHolder;
    createdById: string;
    startsAt: Date;
    endsAt: Date;
    status: ReservationStatusValue;
    purpose?: string;
    preemptedById?: string;
    preemptedReason?: string;
    replacedByReservationId?: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ReservationAuditAction>[];
  }) {
    super();
    this._id = id;
    this._holder = holder;
    this._createdById = createdById;
    this._startsAt = startsAt;
    this._endsAt = endsAt;
    this._status = status;
    this._purpose = purpose;
    this._preemptedById = preemptedById;
    this._preemptedReason = preemptedReason;
    this._replacedByReservationId = replacedByReservationId;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get holder(): ReservationHolder {
    return this._holder;
  }

  public get createdById(): string {
    return this._createdById;
  }

  public get startsAt(): Date {
    return this._startsAt;
  }

  public get endsAt(): Date {
    return this._endsAt;
  }

  public get status(): ReservationStatusValue {
    return this._status;
  }

  public get purpose(): string | undefined {
    return this._purpose;
  }

  public get preemptedById(): string | undefined {
    return this._preemptedById;
  }

  public get preemptedReason(): string | undefined {
    return this._preemptedReason;
  }

  public get replacedByReservationId(): string | undefined {
    return this._replacedByReservationId;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<ReservationAuditAction>> {
    return this._auditLogs;
  }

  public get window(): ReservationWindow {
    return ReservationWindow.create(this._startsAt, this._endsAt);
  }

  public static schedule({
    holder,
    window,
    createdById,
    purpose,
    now,
  }: {
    holder: ReservationHolder;
    window: ReservationWindow;
    createdById: string;
    purpose?: string;
    now: Date;
  }): Reservation {
    const reservation: Reservation = new Reservation({
      id: generateId(),
      holder,
      createdById,
      startsAt: window.startsAt,
      endsAt: window.endsAt,
      status: SCHEDULED_RESERVATION_STATUS,
      purpose,
      createdAt: now,
      updatedAt: now,
      auditLogs: [
        AuditLog.create<ReservationAuditAction>({
          action: "reservation_created",
          performedByUserId: createdById,
          metadata: { holder: holder.toSnapshot(), startsAt: window.startsAt.toISOString(), endsAt: window.endsAt.toISOString() },
        }),
      ],
    });

    reservation.publishEvent(
      new ReservationCreatedEvent({
        reservationId: reservation.id,
        holder: holder.toSnapshot(),
        window: { startsAt: window.startsAt, endsAt: window.endsAt },
        createdById,
      }),
    );

    return reservation;
  }

  public static reconstitute({
    id,
    holder,
    createdById,
    startsAt,
    endsAt,
    status,
    purpose,
    preemptedById,
    preemptedReason,
    replacedByReservationId,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    holder: ReservationHolder;
    createdById: string;
    startsAt: Date;
    endsAt: Date;
    status: ReservationStatusValue;
    purpose?: string;
    preemptedById?: string;
    preemptedReason?: string;
    replacedByReservationId?: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ReservationAuditAction>[];
  }): Reservation {
    return new Reservation({
      id,
      holder,
      createdById,
      startsAt,
      endsAt,
      status,
      purpose,
      preemptedById,
      preemptedReason,
      replacedByReservationId,
      createdAt,
      updatedAt,
      auditLogs,
    });
  }

  public isScheduled(): boolean {
    return this._status === SCHEDULED_RESERVATION_STATUS;
  }

  public isActiveAt(now: Date): boolean {
    return this.isScheduled() && this._startsAt.getTime() <= now.getTime() && now.getTime() < this._endsAt.getTime();
  }

  public cancel(performedBy: string, now: Date): void {
    this._assertScheduled();

    const wasActive: boolean = this.isActiveAt(now);

    this._status = CANCELLED_RESERVATION_STATUS;
    this._updatedAt = now;

    this._auditLogs.push(
      AuditLog.create<ReservationAuditAction>({
        action: "reservation_cancelled",
        performedByUserId: performedBy,
        metadata: { changes: { status: { before: SCHEDULED_RESERVATION_STATUS, after: CANCELLED_RESERVATION_STATUS } } },
      }),
    );

    this.publishEvent(
      new ReservationCancelledEvent({
        reservationId: this._id,
        holder: this._holder.toSnapshot(),
        window: { startsAt: this._startsAt, endsAt: this._endsAt },
        wasActive,
        performedBy,
      }),
    );
  }

  public preempt({
    preemptedById,
    reason,
    replacedByReservationId,
    now,
  }: {
    preemptedById: string;
    reason?: string;
    replacedByReservationId: string;
    now: Date;
  }): void {
    this._assertScheduled();

    const wasActive: boolean = this.isActiveAt(now);

    this._status = PREEMPTED_RESERVATION_STATUS;
    this._preemptedById = preemptedById;
    this._preemptedReason = reason;
    this._replacedByReservationId = replacedByReservationId;
    this._updatedAt = now;

    this._auditLogs.push(
      AuditLog.create<ReservationAuditAction>({
        action: "reservation_preempted",
        performedByUserId: preemptedById,
        description: reason,
        metadata: {
          replacedByReservationId,
          changes: { status: { before: SCHEDULED_RESERVATION_STATUS, after: PREEMPTED_RESERVATION_STATUS } },
        },
      }),
    );

    this.publishEvent(
      new ReservationPreemptedEvent({
        reservationId: this._id,
        previousHolder: this._holder.toSnapshot(),
        window: { startsAt: this._startsAt, endsAt: this._endsAt },
        reason,
        wasActive,
        preemptedById,
        replacedByReservationId,
      }),
    );
  }

  public complete(performedBy: string, now: Date): void {
    this._assertScheduled();

    const previousEndsAt: Date = this._endsAt;

    this._status = COMPLETED_RESERVATION_STATUS;

    if (now.getTime() < this._endsAt.getTime()) {
      this._endsAt = new Date(Math.max(now.getTime(), this._startsAt.getTime()));
    }

    this._updatedAt = now;

    this._auditLogs.push(
      AuditLog.create<ReservationAuditAction>({
        action: "reservation_completed",
        performedByUserId: performedBy,
        metadata: {
          changes: {
            status: { before: SCHEDULED_RESERVATION_STATUS, after: COMPLETED_RESERVATION_STATUS },
            endsAt: { before: previousEndsAt.toISOString(), after: this._endsAt.toISOString() },
          },
        },
      }),
    );

    this.publishEvent(
      new ReservationCompletedEvent({
        reservationId: this._id,
        holder: this._holder.toSnapshot(),
        window: { startsAt: this._startsAt, endsAt: this._endsAt },
        performedBy,
      }),
    );
  }

  private _assertScheduled(): void {
    if (!this.isScheduled()) {
      throw new ReservationNotScheduledError();
    }
  }
}
