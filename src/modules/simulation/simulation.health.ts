/*
 * Funcionalidad: SimulationHealth
 * Descripción: Snapshot en memoria del estado del módulo de simulación.
 *              Lee status de MqttClient, WSGateway y SimulationService sin persistir nada.
 *              Lleva un contador rolling de 1 s para framesPerSecond.
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria
 *        que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

import type { VentilatorStatus } from '../../../contracts/simulation.contracts';
import type { MqttClient } from './mqtt-client';
import type { WSGateway } from './ws-gateway';
import { SIMULATION_CONFIG } from './simulation.config';

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

export interface HealthSnapshot {
  mqtt: { status: VentilatorStatus; brokerUrl: string; topic: string };
  ws: { connectedUsers: number; userIds: string[] };
  telemetry: { lastFrameAt: number | null; lastFrameAgeMs: number | null; framesPerSecond: number };
  reservation: { isReserved: boolean; currentUser?: string; endsAt?: number };
}

/** Callback used to read reservation state without a direct circular reference. */
export type ReservationGetter = () => { isReserved: boolean; currentUser?: string; endsAt?: number };

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class SimulationHealth {
  /** Timestamps (ms) of frames recorded within the last 1 s rolling window. */
  private frameTimestamps: number[] = [];

  constructor(
    private readonly mqttClient: MqttClient,
    private readonly gateway: WSGateway,
    private readonly getReservation: ReservationGetter,
  ) {}

  /**
   * Must be called by SimulationService every time a ventilator:data frame is routed.
   * Increments the rolling framesPerSecond counter.
   */
  recordFrame(): void {
    const now = Date.now();
    this.frameTimestamps.push(now);
    this.purgeOldFrames(now);
  }

  /**
   * Returns a point-in-time snapshot of simulation health.
   * Pure in-memory read — no I/O, no side effects.
   */
  snapshot(): HealthSnapshot {
    const now = Date.now();
    this.purgeOldFrames(now);

    const lastFrameAt =
      this.frameTimestamps.length > 0
        ? this.frameTimestamps[this.frameTimestamps.length - 1]
        : null;

    const userIds = this.gateway.getConnectedUsers();
    const reservation = this.getReservation();

    return {
      mqtt: {
        status: this.mqttClient.getStatus(),
        brokerUrl: SIMULATION_CONFIG.MQTT_BROKER_URL,
        topic: SIMULATION_CONFIG.MQTT_TELEMETRY_TOPIC,
      },
      ws: {
        connectedUsers: userIds.length,
        userIds,
      },
      telemetry: {
        lastFrameAt,
        lastFrameAgeMs: lastFrameAt !== null ? now - lastFrameAt : null,
        framesPerSecond: this.frameTimestamps.length,
      },
      reservation,
    };
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private purgeOldFrames(now: number): void {
    const cutoff = now - 1000;
    // Frames are pushed in chronological order — drop from the front.
    let i = 0;
    while (i < this.frameTimestamps.length && this.frameTimestamps[i] < cutoff) {
      i++;
    }
    if (i > 0) {
      this.frameTimestamps = this.frameTimestamps.slice(i);
    }
  }
}
