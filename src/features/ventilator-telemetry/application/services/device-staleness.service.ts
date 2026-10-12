/*
 * Funcionalidad: Vigilancia de actividad del ventilador
 * Descripción: Vigilante que cada 250 ms marca el dispositivo como inactivo cuando no llega ningún mensaje durante más de VENTILATOR_STALE_AFTER_MS (o el bróker se desconecta) y emite una sola vez ventilator:disconnected y VentilatorDeviceOfflineEvent; el primer mensaje posterior emite ventilator:connected y VentilatorDeviceOnlineEvent por IEventBus
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { type ITelemetryClock, TELEMETRY_CLOCK_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-clock.interface";
import {
  VENTILATOR_CONNECTED_EVENT,
  VENTILATOR_DISCONNECTED_EVENT,
  type VentilatorConnectionPayload,
  type VentilatorDisconnectedReason,
} from "@/features/ventilator-telemetry/application/realtime/ventilator-telemetry-events";
import { VENTILATOR_TELEMETRY_SETTINGS_TOKEN, type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { VentilatorDeviceOfflineEvent, VentilatorDeviceOnlineEvent } from "@/features/ventilator-telemetry/domain/events/ventilator-device.events";

export type DeviceStalenessValue = "online" | "stale" | "never";

export const WATCHDOG_INTERVAL_MS: number = 250;

@Injectable()
export class DeviceStalenessService {
  private readonly _logger: Logger = new Logger(DeviceStalenessService.name);
  private _state: DeviceStalenessValue = "never";
  private _lastMessageAt: number | undefined;
  private _timer: ReturnType<typeof setInterval> | undefined;

  public constructor(
    @Inject(VENTILATOR_TELEMETRY_SETTINGS_TOKEN)
    private readonly _settings: VentilatorTelemetrySettings,
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
    @Inject(TELEMETRY_CLOCK_TOKEN)
    private readonly _clock: ITelemetryClock,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public get state(): DeviceStalenessValue {
    return this._state;
  }

  public get lastMessageAt(): number | undefined {
    return this._lastMessageAt;
  }

  public start(): void {
    if (this._timer !== undefined) {
      return;
    }

    this._timer = setInterval((): void => this.tick(this._clock.now()), WATCHDOG_INTERVAL_MS);
    this._timer.unref();
  }

  public stop(): void {
    if (this._timer !== undefined) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }

  public markMessage(now: number): void {
    this._lastMessageAt = now;

    if (this._state === "online") {
      return;
    }

    this._state = "online";
    this._emit(VENTILATOR_CONNECTED_EVENT, { at: now });
    this._eventBus.publish([new VentilatorDeviceOnlineEvent({ at: new Date(now) })]);
  }

  public markBrokerDisconnected(): void {
    this._goStale("broker_disconnected");
  }

  public tick(now: number): void {
    if (this._state !== "online" || this._lastMessageAt === undefined) {
      return;
    }

    if (now - this._lastMessageAt > this._settings.staleAfterMs) {
      this._goStale("device_stale");
    }
  }

  private _goStale(reason: VentilatorDisconnectedReason): void {
    if (this._state !== "online") {
      return;
    }

    this._state = "stale";
    this._emit(VENTILATOR_DISCONNECTED_EVENT, { at: this._clock.now(), reason });
    this._eventBus.publish([
      new VentilatorDeviceOfflineEvent({ reason, lastMessageAt: this._lastMessageAt === undefined ? undefined : new Date(this._lastMessageAt) }),
    ]);
  }

  private _emit(event: string, payload: VentilatorConnectionPayload): void {
    try {
      this._realtimePublisher.broadcast(event, payload);
    } catch (error: unknown) {
      this._logger.warn(`Emitting ${event} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
