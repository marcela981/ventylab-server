/*
 * Funcionalidad: Caso de uso CancelReservationUseCase
 * Descripción: Cancela una reserva programada si quien lo pide es su creador, su titular, el líder del grupo titular, un docente que supervisa ese grupo o un administrador; publica ReservationCancelledEvent tras el commit
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
import { CancelReservationCommand } from "@/features/reservations/application/commands/cancel-reservation.command";
import { type IReservationClock, RESERVATION_CLOCK_TOKEN } from "@/features/reservations/application/ports/reservation-clock.interface";
import { ReservationAccessService, type ResolvedGroupFacts } from "@/features/reservations/application/services/reservation-access.service";
import { RESERVATION_SETTINGS_TOKEN, type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type IReservationsRepository, RESERVATIONS_REPOSITORY_TOKEN } from "@/features/reservations/domain/repositories/reservations.repository";
import { ReservationCancelForbiddenError, ReservationNotFoundError } from "@/features/reservations/domain/reservations.errors";
import { canCancel, type ReservationActor, toReservationPartyRole } from "@/features/reservations/domain/services/reservation-access-policy";

/**
 * @throws {ReservationNotFoundError} If the reservation does not exist
 * @throws {ReservationCancelForbiddenError} If the caller cannot cancel the reservation
 * @throws {ReservationNotScheduledError} If the reservation is no longer scheduled
 */
@Injectable()
export class CancelReservationUseCase {
  public constructor(
    @Inject(RESERVATIONS_REPOSITORY_TOKEN)
    private readonly _reservationsRepository: IReservationsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    @Inject(RESERVATION_SETTINGS_TOKEN)
    private readonly _settings: ReservationSettings,
    @Inject(RESERVATION_CLOCK_TOKEN)
    private readonly _clock: IReservationClock,
    private readonly _accessService: ReservationAccessService,
  ) {}

  public async execute(command: CancelReservationCommand): Promise<void> {
    const actor: ReservationActor = { userId: command.actorId, role: toReservationPartyRole(command.actorRole) };

    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      await this._reservationsRepository.lockDevice(this._settings.deviceId, transaction);

      const reservation: Reservation | undefined = await this._reservationsRepository.getById(command.reservationId, transaction);

      if (!reservation) {
        throw new ReservationNotFoundError();
      }

      const facts: ResolvedGroupFacts = await this._accessService.resolveGroupFacts(actor, reservation.holder.groupId);

      if (!canCancel(actor, reservation, facts)) {
        throw new ReservationCancelForbiddenError();
      }

      reservation.cancel(actor.userId, this._clock.now());

      await this._reservationsRepository.save(reservation, transaction);

      return reservation.getEvents();
    });

    this._eventBus.publish(events);
  }
}
