/*
 * Funcionalidad: Entidad VentilatorReservation
 * Descripción: Agregado de la reserva del ventilador físico (usuario, rol al reservar, dispositivo, grupo, líder que recibe la telemetría, duración y ventana de tiempo); crea la reserva activa y la libera, con bitácora de auditoría y eventos de dominio
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
import { VentilatorReleasedEvent, VentilatorReservedEvent } from "@/features/simulation/domain/events/ventilator-reservation.events";
import {
  ACTIVE_RESERVATION_STATUS,
  COMPLETED_RESERVATION_STATUS,
  type ReservationStatusValue,
} from "@/features/simulation/domain/value-objects/reservation-status";
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

export const VENTILATOR_RESERVATION_COLLECTION: string = "ventilator_reservations";
export const VENTILATOR_RESERVATION_TYPE: string = "ventilator_reservation";

export type VentilatorReservationAuditAction = "ventilator_reserved" | "ventilator_released";

export class VentilatorReservation extends AggregateRoot {
  private _id: string;
  private _userId: string;
  private _userRole: UserRoleValue;
  private _deviceId: string;
  private _groupId?: string;
  private _leaderId?: string;
  private _status: ReservationStatusValue;
  private _durationMinutes: number;
  private _startTime: Date;
  private _endTime: Date;
  private _releasedAt?: Date;
  private _purpose?: string;
  private _cancelReason?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<VentilatorReservationAuditAction>[];

  private constructor({
    id,
    userId,
    userRole,
    deviceId,
    groupId,
    leaderId,
    status,
    durationMinutes,
    startTime,
    endTime,
    releasedAt,
    purpose,
    cancelReason,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    userRole: UserRoleValue;
    deviceId: string;
    groupId?: string;
    leaderId?: string;
    status: ReservationStatusValue;
    durationMinutes: number;
    startTime: Date;
    endTime: Date;
    releasedAt?: Date;
    purpose?: string;
    cancelReason?: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<VentilatorReservationAuditAction>[];
  }) {
    super();
    this._id = id;
    this._userId = userId;
    this._userRole = userRole;
    this._deviceId = deviceId;
    this._groupId = groupId;
    this._leaderId = leaderId;
    this._status = status;
    this._durationMinutes = durationMinutes;
    this._startTime = startTime;
    this._endTime = endTime;
    this._releasedAt = releasedAt;
    this._purpose = purpose;
    this._cancelReason = cancelReason;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get userRole(): UserRoleValue {
    return this._userRole;
  }

  public get deviceId(): string {
    return this._deviceId;
  }

  public get groupId(): string | undefined {
    return this._groupId;
  }

  public get leaderId(): string | undefined {
    return this._leaderId;
  }

  public get status(): ReservationStatusValue {
    return this._status;
  }

  public get durationMinutes(): number {
    return this._durationMinutes;
  }

  public get startTime(): Date {
    return this._startTime;
  }

  public get endTime(): Date {
    return this._endTime;
  }

  public get releasedAt(): Date | undefined {
    return this._releasedAt;
  }

  public get purpose(): string | undefined {
    return this._purpose;
  }

  public get cancelReason(): string | undefined {
    return this._cancelReason;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<VentilatorReservationAuditAction>> {
    return this._auditLogs;
  }

  public get telemetryRecipientId(): string {
    return this._leaderId ?? this._userId;
  }

  public static create({
    userId,
    userRole,
    deviceId,
    groupId,
    leaderId,
    durationMinutes,
    purpose,
    holderName,
  }: {
    userId: string;
    userRole: UserRoleValue;
    deviceId: string;
    groupId?: string;
    leaderId?: string;
    durationMinutes: number;
    purpose?: string;
    holderName?: string;
  }): VentilatorReservation {
    const startTime: Date = new Date();
    const endTime: Date = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const reservation: VentilatorReservation = new VentilatorReservation({
      id: generateId(),
      userId,
      userRole,
      deviceId,
      groupId,
      leaderId,
      status: ACTIVE_RESERVATION_STATUS,
      durationMinutes,
      startTime,
      endTime,
      releasedAt: undefined,
      purpose,
      cancelReason: undefined,
      createdAt: startTime,
      updatedAt: startTime,
      auditLogs: [
        AuditLog.create({
          action: "ventilator_reserved",
          performedByUserId: userId,
          metadata: { deviceId, groupId, leaderId, durationMinutes, endTime: endTime.toISOString() },
        }),
      ],
    });

    reservation.publishEvent(new VentilatorReservedEvent({ entity: reservation, holderName, performedBy: userId }));

    return reservation;
  }

  public static reconstitute({
    id,
    userId,
    userRole,
    deviceId,
    groupId,
    leaderId,
    status,
    durationMinutes,
    startTime,
    endTime,
    releasedAt,
    purpose,
    cancelReason,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    userRole: UserRoleValue;
    deviceId: string;
    groupId?: string;
    leaderId?: string;
    status: ReservationStatusValue;
    durationMinutes: number;
    startTime: Date;
    endTime: Date;
    releasedAt?: Date;
    purpose?: string;
    cancelReason?: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<VentilatorReservationAuditAction>[];
  }): VentilatorReservation {
    return new VentilatorReservation({
      id,
      userId,
      userRole,
      deviceId,
      groupId,
      leaderId,
      status,
      durationMinutes,
      startTime,
      endTime,
      releasedAt,
      purpose,
      cancelReason,
      createdAt,
      updatedAt,
      auditLogs,
    });
  }

  public release(performedBy: string): void {
    const now: Date = new Date();

    this._status = COMPLETED_RESERVATION_STATUS;
    this._releasedAt = now;
    this._updatedAt = now;

    this._auditLogs.push(
      AuditLog.create({
        action: "ventilator_released",
        performedByUserId: performedBy,
        metadata: { changes: { status: { before: ACTIVE_RESERVATION_STATUS, after: COMPLETED_RESERVATION_STATUS } } },
      }),
    );

    this.publishEvent(new VentilatorReleasedEvent({ entity: this, performedBy }));
  }
}
