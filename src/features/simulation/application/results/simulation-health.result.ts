/*
 * Funcionalidad: Resultado SimulationHealthResult
 * Descripción: Instantánea en memoria de la salud del módulo de simulación: conexión MQTT y tópico, usuarios conectados por WebSocket, tramas por segundo y reserva activa
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorStatusValue } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

export interface TelemetryFrameStats {
  lastFrameAt: number | null;
  lastFrameAgeMs: number | null;
  framesPerSecond: number;
}

export interface MqttHealth {
  status: VentilatorStatusValue;
  brokerUrl: string;
  topic: string;
}

export interface RealtimeHealth {
  connectedUsers: number;
  userIds: string[];
}

export interface ReservationHealth {
  isReserved: boolean;
  currentUser?: string;
  endsAt?: number;
}

export class SimulationHealthResult {
  public readonly mqtt: MqttHealth;
  public readonly ws: RealtimeHealth;
  public readonly telemetry: TelemetryFrameStats;
  public readonly reservation: ReservationHealth;

  public constructor({
    mqtt,
    ws,
    telemetry,
    reservation,
  }: {
    mqtt: MqttHealth;
    ws: RealtimeHealth;
    telemetry: TelemetryFrameStats;
    reservation: ReservationHealth;
  }) {
    this.mqtt = mqtt;
    this.ws = ws;
    this.telemetry = telemetry;
    this.reservation = reservation;
  }
}
