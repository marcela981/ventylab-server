/*
 * Funcionalidad: Caso de uso GetVentilatorStatusUseCase
 * Descripción: Devuelve el estado del ventilador físico: conexión MQTT, último mensaje y alarmas activas leídos de VentilatorTelemetryFacade y reserva activa leída de ReservationsFacade con el nombre de su titular (UsersFacade)
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { VentilatorStatusResult } from "@/features/simulation/application/results/ventilator-status.result";
import { SIMULATION_SETTINGS_TOKEN, type SimulationSettings } from "@/features/simulation/application/tokens/simulation-settings.token";
import { CONNECTED_STATUS_VALUE, DISCONNECTED_STATUS_VALUE, type VentilatorStatusValue } from "@/features/simulation/domain/value-objects/ventilator-telemetry";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";
import { type VentilatorTelemetryStatus } from "@/features/ventilator-telemetry/application/results/ventilator-telemetry-status.result";
import { VentilatorTelemetryFacade } from "@/features/ventilator-telemetry/application/services/ventilator-telemetry.facade";

@Injectable()
export class GetVentilatorStatusUseCase {
  public constructor(
    @Inject(SIMULATION_SETTINGS_TOKEN)
    private readonly _settings: SimulationSettings,
    private readonly _telemetryFacade: VentilatorTelemetryFacade,
    private readonly _reservationsFacade: ReservationsFacade,
    private readonly _usersFacade: UsersFacade,
  ) {}

  public async execute(deviceId?: string): Promise<VentilatorStatusResult> {
    const telemetry: VentilatorTelemetryStatus = this._telemetryFacade.getStatus();
    const status: VentilatorStatusValue = telemetry.brokerConnected ? CONNECTED_STATUS_VALUE : DISCONNECTED_STATUS_VALUE;
    const targetDeviceId: string = deviceId ?? this._settings.deviceId;

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
      lastDataTimestamp: telemetry.lastMessageAt,
      activeAlarms: this._telemetryFacade.getActiveAlarms(),
    });
  }
}
