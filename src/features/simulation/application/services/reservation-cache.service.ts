/*
 * Funcionalidad: Caché de la reserva activa
 * Descripción: Espejo en memoria de la reserva activa del dispositivo, leído en cada trama de telemetría sin consultar la base de datos; se refresca al reservar, liberar, expirar y arrancar, y expira las reservas vencidas a través del repositorio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { SIMULATION_SETTINGS_TOKEN, type SimulationSettings } from "@/features/simulation/application/tokens/simulation-settings.token";
import { type ActiveReservationView } from "@/features/simulation/domain/read-models/active-reservation.read-model";
import {
  type IVentilatorReservationsRepository,
  VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/ventilator-reservations.repository";

export interface CachedReservation {
  reservationId: string;
  userId: string;
  leaderId?: string;
  groupId?: string;
  endTime: number;
}

@Injectable()
export class ReservationCacheService {
  private readonly _logger: Logger = new Logger(ReservationCacheService.name);
  private _current: CachedReservation | undefined;

  public constructor(
    @Inject(VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN)
    private readonly _reservationsRepository: IVentilatorReservationsRepository,
    @Inject(SIMULATION_SETTINGS_TOKEN)
    private readonly _settings: SimulationSettings,
  ) {}

  public get current(): CachedReservation | undefined {
    return this._current;
  }

  public clear(): void {
    this._current = undefined;
  }

  public async refresh(): Promise<void> {
    const view: ActiveReservationView | undefined = await this._reservationsRepository.getActiveByDevice(this._settings.deviceId);

    this._current = view
      ? {
        reservationId: view.reservation.id,
        userId: view.reservation.userId,
        leaderId: view.reservation.leaderId,
        groupId: view.reservation.groupId,
        endTime: view.reservation.endTime.getTime(),
      }
      : undefined;
  }

  public async expireOverdue(): Promise<void> {
    await this._reservationsRepository.expireOverdue(new Date());

    this._refreshInBackground();
  }

  private _refreshInBackground(): void {
    this.refresh().catch((error: unknown): void => {
      this._logger.warn(`Reservation cache refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
}
