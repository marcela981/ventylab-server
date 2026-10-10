/*
 * Funcionalidad: DTOs de respuesta de los comandos del ventilador
 * Descripción: Comando aceptado (identificador para seguir ventilator:command-status), estado del control exclusivo para quien consulta y elemento del historial de comandos de una reserva
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { COMMAND_ENCODING_VALUES } from "@/features/ventilator-commands/domain/encoders/command-encoder";
import { VENTILATOR_COMMAND_STATUS_VALUES } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-status";

export class SentVentilatorCommandDTO {
  @ApiProperty({ description: "Correlation identifier of the command, used by ventilator:command-status", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public commandId: string;

  @ApiProperty({ description: "Reservation the command was sent under", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e70" })
  public reservationId: string;

  @ApiProperty({ description: "Status right after publishing", enum: VENTILATOR_COMMAND_STATUS_VALUES, example: "SENT" })
  public status: string;

  @ApiProperty({ description: "When the broker acknowledged the publish (ISO 8601)", example: "2026-10-10T12:00:00.000Z" })
  public sentAt: string;

  public constructor({ commandId, reservationId, status, sentAt }: { commandId: string; reservationId: string; status: string; sentAt: string }) {
    this.commandId = commandId;
    this.reservationId = reservationId;
    this.status = status;
    this.sentAt = sentAt;
  }
}

export class VentilatorControlStateDTO {
  @ApiProperty({ description: "Active reservation, null when the ventilator is free", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e70", nullable: true, type: String })
  public reservationId: string | null;

  @ApiProperty({ description: "Current operator, null when nobody controls the ventilator", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e71", nullable: true, type: String })
  public operatorUserId: string | null;

  @ApiProperty({ description: "When the operator took control (ISO 8601)", example: "2026-10-10T12:00:00.000Z", nullable: true, type: String })
  public since: string | null;

  @ApiProperty({ description: "Last presence signal of the operator (ISO 8601)", example: "2026-10-10T12:05:00.000Z", nullable: true, type: String })
  public lastSeenAt: string | null;

  @ApiProperty({ description: "When control is released if the operator does not reconnect (ISO 8601)", example: "2026-10-10T12:05:15.000Z", nullable: true, type: String })
  public presenceExpiresAt: string | null;

  @ApiProperty({ description: "Whether the caller is the operator", example: false })
  public isOperator: boolean;

  @ApiProperty({ description: "Whether the caller can take the free control", example: true })
  public canTake: boolean;

  @ApiProperty({ description: "Whether the caller can take over the control from the current operator", example: false })
  public canTakeover: boolean;

  public constructor(init: {
    reservationId: string | null;
    operatorUserId: string | null;
    since: string | null;
    lastSeenAt: string | null;
    presenceExpiresAt: string | null;
    isOperator: boolean;
    canTake: boolean;
    canTakeover: boolean;
  }) {
    this.reservationId = init.reservationId;
    this.operatorUserId = init.operatorUserId;
    this.since = init.since;
    this.lastSeenAt = init.lastSeenAt;
    this.presenceExpiresAt = init.presenceExpiresAt;
    this.isOperator = init.isOperator;
    this.canTake = init.canTake;
    this.canTakeover = init.canTakeover;
  }
}

export class VentilatorCommandDTO {
  @ApiProperty({ description: "Correlation identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Reservation", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e70" })
  public reservationId: string;

  @ApiProperty({ description: "User who sent the command", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e71" })
  public userId: string;

  @ApiProperty({ description: "Validated parameters", example: { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 }, type: Object })
  public params: Record<string, unknown>;

  @ApiProperty({ description: "Encoding used on the wire", enum: COMMAND_ENCODING_VALUES, example: "json" })
  public encoding: string;

  @ApiProperty({ description: "Lifecycle status", enum: VENTILATOR_COMMAND_STATUS_VALUES, example: "TIMEOUT" })
  public status: string;

  @ApiProperty({ description: "Reason of a rejection", example: "out_of_order", nullable: true, type: String })
  public rejectReason: string | null;

  @ApiProperty({ description: "Publish time (ISO 8601)", example: "2026-10-10T12:00:00.000Z", nullable: true, type: String })
  public sentAt: string | null;

  @ApiProperty({ description: "Resolution time (ISO 8601)", example: "2026-10-10T12:00:03.000Z", nullable: true, type: String })
  public resolvedAt: string | null;

  @ApiProperty({ description: "resolvedAt - sentAt in milliseconds", example: 3000, nullable: true, type: Number })
  public latencyMs: number | null;

  @ApiProperty({ description: "Creation time (ISO 8601)", example: "2026-10-10T12:00:00.000Z" })
  public createdAt: string;

  public constructor(init: {
    id: string;
    reservationId: string;
    userId: string;
    params: Record<string, unknown>;
    encoding: string;
    status: string;
    rejectReason: string | null;
    sentAt: string | null;
    resolvedAt: string | null;
    latencyMs: number | null;
    createdAt: string;
  }) {
    this.id = init.id;
    this.reservationId = init.reservationId;
    this.userId = init.userId;
    this.params = init.params;
    this.encoding = init.encoding;
    this.status = init.status;
    this.rejectReason = init.rejectReason;
    this.sentAt = init.sentAt;
    this.resolvedAt = init.resolvedAt;
    this.latencyMs = init.latencyMs;
    this.createdAt = init.createdAt;
  }
}
