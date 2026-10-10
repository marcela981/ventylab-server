/*
 * Funcionalidad: Entidad VentilatorCommand
 * Descripción: Comando enviado al ventilador físico con su identificador de correlación, reserva, usuario, parámetros validados, codificación y carga legible, y una máquina de estados explícita (PENDING → SENT | REJECTED; SENT → ACKED | APPLIED | REJECTED | TIMEOUT) que lanza un error ante toda transición no permitida y calcula la latencia resolvedAt − sentAt
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CommandEncodingValue } from "@/features/ventilator-commands/domain/encoders/command-encoder";
import { type VentilatorCommandParams } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-params";
import {
  ACKED_COMMAND_STATUS,
  ALLOWED_COMMAND_TRANSITIONS,
  APPLIED_COMMAND_STATUS,
  isTerminalCommandStatus,
  PENDING_COMMAND_STATUS,
  REJECTED_COMMAND_STATUS,
  SENT_COMMAND_STATUS,
  TIMEOUT_COMMAND_STATUS,
  type VentilatorCommandStatusValue,
} from "@/features/ventilator-commands/domain/value-objects/ventilator-command-status";
import { IllegalVentilatorCommandTransitionError } from "@/features/ventilator-commands/domain/ventilator-commands.errors";

export interface VentilatorCommandProps {
  readonly id: string;
  readonly reservationId: string;
  readonly userId: string;
  readonly params: VentilatorCommandParams;
  readonly encoding: CommandEncodingValue;
  readonly encodedPayload: string;
  readonly status: VentilatorCommandStatusValue;
  readonly rejectReason?: string;
  readonly sentAt?: Date;
  readonly resolvedAt?: Date;
  readonly latencyMs?: number;
  readonly createdAt: Date;
}

export class VentilatorCommand {
  private readonly _id: string;
  private readonly _reservationId: string;
  private readonly _userId: string;
  private readonly _params: VentilatorCommandParams;
  private readonly _encoding: CommandEncodingValue;
  private readonly _encodedPayload: string;
  private readonly _createdAt: Date;
  private _status: VentilatorCommandStatusValue;
  private _rejectReason?: string;
  private _sentAt?: Date;
  private _resolvedAt?: Date;
  private _latencyMs?: number;

  private constructor(props: VentilatorCommandProps) {
    this._id = props.id;
    this._reservationId = props.reservationId;
    this._userId = props.userId;
    this._params = props.params;
    this._encoding = props.encoding;
    this._encodedPayload = props.encodedPayload;
    this._status = props.status;
    this._rejectReason = props.rejectReason;
    this._sentAt = props.sentAt;
    this._resolvedAt = props.resolvedAt;
    this._latencyMs = props.latencyMs;
    this._createdAt = props.createdAt;
  }

  public get id(): string {
    return this._id;
  }

  public get reservationId(): string {
    return this._reservationId;
  }

  public get userId(): string {
    return this._userId;
  }

  public get params(): VentilatorCommandParams {
    return this._params;
  }

  public get encoding(): CommandEncodingValue {
    return this._encoding;
  }

  public get encodedPayload(): string {
    return this._encodedPayload;
  }

  public get status(): VentilatorCommandStatusValue {
    return this._status;
  }

  public get rejectReason(): string | undefined {
    return this._rejectReason;
  }

  public get sentAt(): Date | undefined {
    return this._sentAt;
  }

  public get resolvedAt(): Date | undefined {
    return this._resolvedAt;
  }

  public get latencyMs(): number | undefined {
    return this._latencyMs;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get isTerminal(): boolean {
    return isTerminalCommandStatus(this._status);
  }

  public static create({
    correlationId,
    reservationId,
    userId,
    params,
    encoding,
    encodedPayload,
    now,
  }: {
    correlationId: string;
    reservationId: string;
    userId: string;
    params: VentilatorCommandParams;
    encoding: CommandEncodingValue;
    encodedPayload: string;
    now: Date;
  }): VentilatorCommand {
    return new VentilatorCommand({
      id: correlationId,
      reservationId,
      userId,
      params,
      encoding,
      encodedPayload,
      status: PENDING_COMMAND_STATUS,
      createdAt: now,
    });
  }

  public static reconstitute(props: VentilatorCommandProps): VentilatorCommand {
    return new VentilatorCommand(props);
  }

  public markSent(at: Date): void {
    this._transition(SENT_COMMAND_STATUS);
    this._sentAt = at;
  }

  public markPublishFailed(reason: string, at: Date): void {
    if (this._status !== PENDING_COMMAND_STATUS) {
      throw new IllegalVentilatorCommandTransitionError(this._status, REJECTED_COMMAND_STATUS);
    }

    this._resolve(REJECTED_COMMAND_STATUS, at);
    this._rejectReason = reason;
  }

  public markAcked(at: Date): void {
    this._resolveSent(ACKED_COMMAND_STATUS, at);
  }

  public markApplied(at: Date): void {
    this._resolveSent(APPLIED_COMMAND_STATUS, at);
  }

  public markRejected(reason: string, at: Date): void {
    this._resolveSent(REJECTED_COMMAND_STATUS, at);
    this._rejectReason = reason;
  }

  public markTimedOut(at: Date): void {
    this._resolveSent(TIMEOUT_COMMAND_STATUS, at);
  }

  public snapshot(): VentilatorCommand {
    return VentilatorCommand.reconstitute({
      id: this._id,
      reservationId: this._reservationId,
      userId: this._userId,
      params: this._params,
      encoding: this._encoding,
      encodedPayload: this._encodedPayload,
      status: this._status,
      rejectReason: this._rejectReason,
      sentAt: this._sentAt,
      resolvedAt: this._resolvedAt,
      latencyMs: this._latencyMs,
      createdAt: this._createdAt,
    });
  }

  private _resolveSent(status: VentilatorCommandStatusValue, at: Date): void {
    if (this._status !== SENT_COMMAND_STATUS) {
      throw new IllegalVentilatorCommandTransitionError(this._status, status);
    }

    this._resolve(status, at);
  }

  private _resolve(status: VentilatorCommandStatusValue, at: Date): void {
    this._transition(status);
    this._resolvedAt = at;
    this._latencyMs = this._sentAt === undefined ? undefined : Math.max(0, at.getTime() - this._sentAt.getTime());
  }

  private _transition(status: VentilatorCommandStatusValue): void {
    if (!ALLOWED_COMMAND_TRANSITIONS[this._status].includes(status)) {
      throw new IllegalVentilatorCommandTransitionError(this._status, status);
    }

    this._status = status;
  }
}
