/*
 * Funcionalidad: Monitor de telemetría
 * Descripción: Estado en memoria del flujo de telemetría: hora de la última trama válida, alarmas activas, lectura compuesta de tramas hexadecimales, limitador de frecuencia por destinatario y ventana de 1 s de tramas enviadas para la salud del módulo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type VentilatorAlarm } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

export interface RollingReading {
  pressure: number;
  flow: number;
  volume: number;
}

export interface TelemetryFrameStats {
  lastFrameAt: number | null;
  lastFrameAgeMs: number | null;
  framesPerSecond: number;
}

const FRAME_WINDOW_MS: number = 1000;

@Injectable()
export class TelemetryMonitorService {
  private _lastDataTimestamp: number | undefined;
  private readonly _activeAlarms: Map<string, VentilatorAlarm> = new Map<string, VentilatorAlarm>();
  private readonly _rollingReading: RollingReading = { pressure: 0, flow: 0, volume: 0 };
  private readonly _lastSentAt: Map<string, number> = new Map<string, number>();
  private _frameTimestamps: number[] = [];

  public get lastDataTimestamp(): number | undefined {
    return this._lastDataTimestamp;
  }

  public get activeAlarms(): VentilatorAlarm[] {
    return Array.from(this._activeAlarms.values());
  }

  public get rollingReading(): RollingReading {
    return this._rollingReading;
  }

  public recordData(): void {
    this._lastDataTimestamp = Date.now();
  }

  public setAlarm(alarm: VentilatorAlarm): void {
    this._activeAlarms.set(alarm.type, alarm);
  }

  public tryAcquireSendSlot(key: string, intervalMs: number): boolean {
    const now: number = Date.now();
    const last: number | undefined = this._lastSentAt.get(key);

    if (last !== undefined && now - last < intervalMs) {
      return false;
    }

    this._lastSentAt.set(key, now);

    return true;
  }

  public recordFrame(): void {
    const now: number = Date.now();

    this._frameTimestamps.push(now);
    this._purgeOldFrames(now);
  }

  public frameStats(): TelemetryFrameStats {
    const now: number = Date.now();

    this._purgeOldFrames(now);

    const lastFrameAt: number | null = this._frameTimestamps.length > 0
      ? this._frameTimestamps[this._frameTimestamps.length - 1]
      : null;

    return {
      lastFrameAt,
      lastFrameAgeMs: lastFrameAt !== null ? now - lastFrameAt : null,
      framesPerSecond: this._frameTimestamps.length,
    };
  }

  public reset(): void {
    this._activeAlarms.clear();
    this._lastDataTimestamp = undefined;
  }

  private _purgeOldFrames(now: number): void {
    const cutoff: number = now - FRAME_WINDOW_MS;
    let index: number = 0;

    while (index < this._frameTimestamps.length && this._frameTimestamps[index] < cutoff) {
      index++;
    }

    if (index > 0) {
      this._frameTimestamps = this._frameTimestamps.slice(index);
    }
  }
}
