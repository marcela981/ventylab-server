/*
 * Funcionalidad: Caso de uso GetVentilatorStatusUseCase
 * Descripción: Expira las reservas vencidas y devuelve el estado del ventilador físico: conexión MQTT, reserva activa del dispositivo con su titular, última trama y alarmas activas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IVentilatorDeviceGateway, VENTILATOR_DEVICE_GATEWAY_TOKEN } from "@/features/simulation/application/ports/ventilator-device-gateway.interface";
import { VentilatorStatusResult } from "@/features/simulation/application/results/ventilator-status.result";
import { ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { TelemetryMonitorService } from "@/features/simulation/application/services/telemetry-monitor.service";
import { SIMULATION_SETTINGS_TOKEN, type SimulationSettings } from "@/features/simulation/application/tokens/simulation-settings.token";
import { type ActiveReservationView } from "@/features/simulation/domain/read-models/active-reservation.read-model";
import {
  type IVentilatorReservationsRepository,
  VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/ventilator-reservations.repository";
import { type VentilatorStatusValue } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

@Injectable()
export class GetVentilatorStatusUseCase {
  public constructor(
    @Inject(VENTILATOR_DEVICE_GATEWAY_TOKEN)
    private readonly _deviceGateway: IVentilatorDeviceGateway,
    @Inject(VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN)
    private readonly _reservationsRepository: IVentilatorReservationsRepository,
    @Inject(SIMULATION_SETTINGS_TOKEN)
    private readonly _settings: SimulationSettings,
    private readonly _reservationCache: ReservationCacheService,
    private readonly _telemetryMonitor: TelemetryMonitorService,
  ) {}

  public async execute(deviceId?: string): Promise<VentilatorStatusResult> {
    const status: VentilatorStatusValue = this._deviceGateway.getStatus();
    const targetDeviceId: string = deviceId ?? this._settings.deviceId;

    await this._reservationCache.expireOverdue();

    const active: ActiveReservationView | undefined = await this._reservationsRepository.getActiveByDevice(targetDeviceId);

    return new VentilatorStatusResult({
      status,
      deviceId: targetDeviceId,
      isReserved: active !== undefined,
      reservationId: active?.reservation.id,
      currentUser: active?.reservation.userId,
      currentUserName: active?.holderName,
      groupId: active?.reservation.groupId,
      leaderId: active?.reservation.leaderId,
      reservationEndsAt: active?.reservation.endTime.getTime(),
      lastDataTimestamp: this._telemetryMonitor.lastDataTimestamp,
      activeAlarms: this._telemetryMonitor.activeAlarms,
    });
  }
}
