/*
 * Funcionalidad: Caso de uso ReleaseVentilatorUseCase
 * Descripción: Libera la reserva activa del usuario (estado COMPLETED y hora de liberación), publica el evento que difunde `ventilator:released` y refresca la caché en memoria
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { type VentilatorReservation } from "@/features/simulation/domain/entities/ventilator-reservation.entity";
import {
  type IVentilatorReservationsRepository,
  VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/ventilator-reservations.repository";
import { NoActiveReservationError } from "@/features/simulation/domain/simulation.errors";

/**
 * @throws {NoActiveReservationError} If the user holds no active reservation
 */
@Injectable()
export class ReleaseVentilatorUseCase {
  public constructor(
    @Inject(VENTILATOR_RESERVATIONS_REPOSITORY_TOKEN)
    private readonly _reservationsRepository: IVentilatorReservationsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    private readonly _reservationCache: ReservationCacheService,
  ) {}

  public async execute(userId: string): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(
      async (transaction: unknown): Promise<DomainEvent[]> => {
        const reservation: VentilatorReservation | undefined = await this._reservationsRepository.getActiveByUser(userId, transaction);

        if (!reservation) {
          throw new NoActiveReservationError();
        }

        reservation.release(userId);

        await this._reservationsRepository.save(reservation, transaction);

        return reservation.getEvents();
      },
    );

    this._eventBus.publish(events);

    await this._reservationCache.refresh();
  }
}
