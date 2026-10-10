/*
 * Funcionalidad: Caché de la reserva activa
 * Descripción: Espejo en memoria de la reserva activa leído en cada trama de telemetría sin consultar la base de datos; se alimenta de ReservationsFacade (reserva programada cuya ventana contiene el instante actual) y se refresca al reservar, liberar, al cambiar cualquier reserva, periódicamente y al vencer la reserva en caché
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";

import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";

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

  public constructor(private readonly _reservationsFacade: ReservationsFacade) {}

  public get current(): CachedReservation | undefined {
    return this._current;
  }

  public clear(): void {
    this._current = undefined;
  }

  public async refresh(): Promise<void> {
    const active: ActiveReservationSummary | undefined = await this._reservationsFacade.getActiveReservation(new Date());

    this._current = active
      ? {
        reservationId: active.id,
        userId: active.userId ?? active.createdById,
        groupId: active.groupId,
        endTime: active.endsAt.getTime(),
      }
      : undefined;
  }

  public expireOverdue(): Promise<void> {
    this._refreshInBackground();

    return Promise.resolve();
  }

  public refreshInBackground(): void {
    this._refreshInBackground();
  }

  private _refreshInBackground(): void {
    this.refresh().catch((error: unknown): void => {
      this._logger.warn(`Reservation cache refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
}
