/*
 * Funcionalidad: Resultado VentilatorStatusResult
 * Descripción: Estado del ventilador físico: conexión MQTT, dispositivo, reserva activa (titular, grupo, líder, fin), última trama recibida y alarmas activas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorAlarm, type VentilatorStatusValue } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

export class VentilatorStatusResult {
  public readonly status: VentilatorStatusValue;
  public readonly deviceId: string;
  public readonly isReserved: boolean;
  public readonly reservationId?: string;
  public readonly currentUser?: string;
  public readonly currentUserName?: string;
  public readonly groupId?: string;
  public readonly leaderId?: string;
  public readonly reservationEndsAt?: number;
  public readonly lastDataTimestamp?: number;
  public readonly activeAlarms: VentilatorAlarm[];

  public constructor({
    status,
    deviceId,
    isReserved,
    reservationId,
    currentUser,
    currentUserName,
    groupId,
    leaderId,
    reservationEndsAt,
    lastDataTimestamp,
    activeAlarms,
  }: {
    status: VentilatorStatusValue;
    deviceId: string;
    isReserved: boolean;
    reservationId?: string;
    currentUser?: string;
    currentUserName?: string;
    groupId?: string;
    leaderId?: string;
    reservationEndsAt?: number;
    lastDataTimestamp?: number;
    activeAlarms: VentilatorAlarm[];
  }) {
    this.status = status;
    this.deviceId = deviceId;
    this.isReserved = isReserved;
    this.reservationId = reservationId;
    this.currentUser = currentUser;
    this.currentUserName = currentUserName;
    this.groupId = groupId;
    this.leaderId = leaderId;
    this.reservationEndsAt = reservationEndsAt;
    this.lastDataTimestamp = lastDataTimestamp;
    this.activeAlarms = activeAlarms;
  }
}
