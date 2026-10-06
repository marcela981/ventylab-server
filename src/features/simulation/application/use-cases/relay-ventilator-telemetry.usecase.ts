/*
 * Funcionalidad: Caso de uso RelayVentilatorTelemetryUseCase
 * Descripción: Procesa cada mensaje MQTT del ventilador (JSON o, si no es JSON, trama hexadecimal), actualiza el monitor de telemetría y reenvía `ventilator:data` a todos o solo al líder de la reserva activa (caché en memoria, sin consultas), limitado a WS_MAX_HZ, y difunde `ventilator:alarm`
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import {
  BROADCAST_THROTTLE_KEY,
  VENTILATOR_ALARM_EVENT,
  VENTILATOR_DATA_EVENT,
} from "@/features/simulation/application/realtime/ventilator-realtime-events";
import { type CachedReservation, ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { type RollingReading, TelemetryMonitorService } from "@/features/simulation/application/services/telemetry-monitor.service";
import { SIMULATION_SETTINGS_TOKEN, type SimulationSettings } from "@/features/simulation/application/tokens/simulation-settings.token";
import { isValidHexFrame, parseHexFrame } from "@/features/simulation/domain/services/hex-frame-parser";
import { buildAlarmFromHexFrame, parseTelemetryReading, type TelemetryParseResult } from "@/features/simulation/domain/services/telemetry-payload";
import {
  HEX_ALARM_MESSAGE,
  HEX_FLOW_MESSAGE,
  HEX_PRESSURE_MESSAGE,
  HEX_VOLUME_MESSAGE,
  type HexData,
} from "@/features/simulation/domain/value-objects/hex-frame";
import { type VentilatorAlarm, type VentilatorReading } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

@Injectable()
export class RelayVentilatorTelemetryUseCase {
  private readonly _logger: Logger = new Logger(RelayVentilatorTelemetryUseCase.name);

  public constructor(
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
    @Inject(SIMULATION_SETTINGS_TOKEN)
    private readonly _settings: SimulationSettings,
    private readonly _reservationCache: ReservationCacheService,
    private readonly _telemetryMonitor: TelemetryMonitorService,
  ) {}

  public execute(payload: Buffer): void {
    const result: TelemetryParseResult<VentilatorReading> = parseTelemetryReading(payload, this._settings.deviceId, Date.now());

    if (result.kind === "parsed") {
      this._telemetryMonitor.recordData();
      this._routeReading(result.value);

      return;
    }

    if (result.kind === "missing_fields") {
      this._logger.warn("Telemetry missing required fields (pressure/flow/volume) – discarding");

      return;
    }

    if (isValidHexFrame(payload, (message: string): void => this._logger.warn(message))) {
      this._handleHexFrame(payload);

      return;
    }

    this._logger.warn(`JSON parse error – discarding frame: ${result.error}`);
  }

  private _handleHexFrame(payload: Buffer): void {
    const parsed: HexData | null = parseHexFrame(payload, (message: string): void => this._logger.warn(message));

    if (!parsed) {
      return;
    }

    this._telemetryMonitor.recordData();

    if (parsed.type === HEX_ALARM_MESSAGE) {
      const alarm: VentilatorAlarm = buildAlarmFromHexFrame(parsed);

      this._telemetryMonitor.setAlarm(alarm);
      this._realtimePublisher.broadcast(VENTILATOR_ALARM_EVENT, alarm);

      return;
    }

    const rolling: RollingReading = this._telemetryMonitor.rollingReading;

    if (parsed.type === HEX_PRESSURE_MESSAGE) {
      rolling.pressure = parsed.pressure;
    } else if (parsed.type === HEX_FLOW_MESSAGE) {
      rolling.flow = parsed.flow;
    } else if (parsed.type === HEX_VOLUME_MESSAGE) {
      rolling.volume = parsed.volume;
    }

    this._routeReading({
      ...rolling,
      timestamp: parsed.timestamp,
      deviceId: this._settings.deviceId,
    });
  }

  private _routeReading(reading: VentilatorReading): void {
    const cached: CachedReservation | undefined = this._reservationCache.current;

    if (cached && cached.endTime < Date.now()) {
      this._reservationCache.clear();
      this._reservationCache.expireOverdue().catch((error: unknown): void => {
        this._logger.warn(`Expiring overdue reservations failed: ${error instanceof Error ? error.message : String(error)}`);
      });
    }

    const active: CachedReservation | undefined = this._reservationCache.current;

    if (!active) {
      if (!this._telemetryMonitor.tryAcquireSendSlot(BROADCAST_THROTTLE_KEY, this._settings.telemetryThrottleMs)) {
        return;
      }

      this._realtimePublisher.broadcast(VENTILATOR_DATA_EVENT, reading);
      this._telemetryMonitor.recordFrame();

      return;
    }

    const recipientId: string = active.leaderId ?? active.userId;

    if (!this._telemetryMonitor.tryAcquireSendSlot(recipientId, this._settings.telemetryThrottleMs)) {
      return;
    }

    this._realtimePublisher.emitToUser(recipientId, VENTILATOR_DATA_EVENT, reading);
    this._telemetryMonitor.recordFrame();
  }
}
