/*
 * Funcionalidad: Caso de uso GetVentilatorStatusUseCase
 * Descripción: Devuelve el estado del ventilador físico: conexión MQTT, reserva activa leída de ReservationsFacade con el nombre de su titular (UsersFacade), última trama y alarmas activas; refresca la caché de la reserva en segundo plano
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { type IVentilatorDeviceGateway, VENTILATOR_DEVICE_GATEWAY_TOKEN } from "@/features/simulation/application/ports/ventilator-device-gateway.interface";
import { VentilatorStatusResult } from "@/features/simulation/application/results/ventilator-status.result";
import { ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { TelemetryMonitorService } from "@/features/simulation/application/services/telemetry-monitor.service";
import { SIMULATION_SETTINGS_TOKEN, type SimulationSettings } from "@/features/simulation/application/tokens/simulation-settings.token";
import { type VentilatorStatusValue } from "@/features/simulation/domain/value-objects/ventilator-telemetry";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

@Injectable()
export class GetVentilatorStatusUseCase {
  public constructor(
    @Inject(VENTILATOR_DEVICE_GATEWAY_TOKEN)
    private readonly _deviceGateway: IVentilatorDeviceGateway,
    @Inject(SIMULATION_SETTINGS_TOKEN)
    private readonly _settings: SimulationSettings,
    private readonly _reservationsFacade: ReservationsFacade,
    private readonly _usersFacade: UsersFacade,
    private readonly _reservationCache: ReservationCacheService,
    private readonly _telemetryMonitor: TelemetryMonitorService,
  ) {}

  public async execute(deviceId?: string): Promise<VentilatorStatusResult> {
    const status: VentilatorStatusValue = this._deviceGateway.getStatus();
    const targetDeviceId: string = deviceId ?? this._settings.deviceId;

    this._reservationCache.refreshInBackground();

    const active: ActiveReservationSummary | undefined = targetDeviceId === this._settings.deviceId ? await this._reservationsFacade.getActiveReservation(new Date()) : undefined;
    const currentUser: string | undefined = active ? active.userId ?? active.createdById : undefined;
    const holder: UserAccount | undefined = currentUser === undefined ? undefined : await this._usersFacade.getUserById(currentUser);

    return new VentilatorStatusResult({
      status,
      deviceId: targetDeviceId,
      isReserved: active !== undefined,
      reservationId: active?.id,
      currentUser,
      currentUserName: holder ? holder.name ?? holder.email : undefined,
      groupId: active?.groupId,
      leaderId: undefined,
      reservationEndsAt: active?.endsAt.getTime(),
      lastDataTimestamp: this._telemetryMonitor.lastDataTimestamp,
      activeAlarms: this._telemetryMonitor.activeAlarms,
    });
  }
}
