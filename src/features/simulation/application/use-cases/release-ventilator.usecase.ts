/*
 * Funcionalidad: Caso de uso ReleaseVentilatorUseCase
 * Descripción: Adaptador heredado de DELETE /api/simulation/reserve: delega en ReservationsFacade.releaseActive (completa la reserva activa si quien la libera puede hacerlo), publica el evento que difunde `ventilator:released` y refresca la caché en memoria
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ReleasedReservationResult } from "@/features/reservations/application/results/released-reservation.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { VentilatorReleasedEvent } from "@/features/simulation/domain/events/ventilator-reservation.events";
import { NoActiveReservationError } from "@/features/simulation/domain/simulation.errors";

/**
 * @throws {NoActiveReservationError} If there is no active reservation the user may release
 */
@Injectable()
export class ReleaseVentilatorUseCase {
  public constructor(
    private readonly _reservationsFacade: ReservationsFacade,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    private readonly _reservationCache: ReservationCacheService,
  ) {}

  public async execute(userId: string, userRole: string): Promise<void> {
    const released: ReleasedReservationResult | undefined = await this._reservationsFacade.releaseActive(userId, userRole);

    if (!released) {
      throw new NoActiveReservationError();
    }

    this._eventBus.publish([new VentilatorReleasedEvent({ reservationId: released.reservationId, userId: released.holderUserId })]);

    await this._reservationCache.refresh();
  }
}
