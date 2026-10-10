/*
 * Funcionalidad: Resultados de la feature de comandos del ventilador
 * Descripción: Comando aceptado (identificador de correlación, reserva, estado y hora de envío) y estado del control exclusivo para quien consulta (reserva activa, operador, desde cuándo, última presencia, si es el operador y si puede tomar o arrebatar el control)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorCommandStatusValue } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-status";

export class SentVentilatorCommandResult {
  public readonly commandId: string;
  public readonly reservationId: string;
  public readonly status: VentilatorCommandStatusValue;
  public readonly sentAt: Date;

  public constructor({ commandId, reservationId, status, sentAt }: { commandId: string; reservationId: string; status: VentilatorCommandStatusValue; sentAt: Date }) {
    this.commandId = commandId;
    this.reservationId = reservationId;
    this.status = status;
    this.sentAt = sentAt;
  }
}

export class VentilatorControlStateResult {
  public readonly reservationId?: string;
  public readonly operatorUserId?: string;
  public readonly since?: Date;
  public readonly lastSeenAt?: Date;
  public readonly presenceExpiresAt?: Date;
  public readonly isOperator: boolean;
  public readonly canTake: boolean;
  public readonly canTakeover: boolean;

  public constructor({
    reservationId,
    operatorUserId,
    since,
    lastSeenAt,
    presenceExpiresAt,
    isOperator,
    canTake,
    canTakeover,
  }: {
    reservationId?: string;
    operatorUserId?: string;
    since?: Date;
    lastSeenAt?: Date;
    presenceExpiresAt?: Date;
    isOperator: boolean;
    canTake: boolean;
    canTakeover: boolean;
  }) {
    this.reservationId = reservationId;
    this.operatorUserId = operatorUserId;
    this.since = since;
    this.lastSeenAt = lastSeenAt;
    this.presenceExpiresAt = presenceExpiresAt;
    this.isOperator = isOperator;
    this.canTake = canTake;
    this.canTakeover = canTakeover;
  }
}
