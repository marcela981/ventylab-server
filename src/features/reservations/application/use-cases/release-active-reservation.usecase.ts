/*
 * Funcionalidad: Caso de uso ReleaseActiveReservationUseCase
 * Descripción: Liberación heredada de la reserva activa: bajo el bloqueo del dispositivo la completa con fin en el instante actual si quien la libera es su titular (usuario o miembro del grupo), su creador, el líder del grupo, un docente que supervisa el grupo o un administrador; publica ReservationCompletedEvent tras el commit
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
import { type IReservationClock, RESERVATION_CLOCK_TOKEN } from "@/features/reservations/application/ports/reservation-clock.interface";
import { type ReleasedReservationResult } from "@/features/reservations/application/results/released-reservation.result";
import { ReservationAccessService, type ResolvedGroupFacts } from "@/features/reservations/application/services/reservation-access.service";
import { RESERVATION_SETTINGS_TOKEN, type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type IReservationsRepository, RESERVATIONS_REPOSITORY_TOKEN } from "@/features/reservations/domain/repositories/reservations.repository";
import { canCancel, type ReservationActor, toReservationPartyRole } from "@/features/reservations/domain/services/reservation-access-policy";

interface ReleaseOutcome {
  readonly result?: ReleasedReservationResult;
  readonly events: DomainEvent[];
}

@Injectable()
export class ReleaseActiveReservationUseCase {
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

  public async execute(userId: string, role: string): Promise<ReleasedReservationResult | undefined> {
    const actor: ReservationActor = { userId, role: toReservationPartyRole(role) };
    const now: Date = this._clock.now();

    const outcome: ReleaseOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<ReleaseOutcome> => {
      await this._reservationsRepository.lockDevice(this._settings.deviceId, transaction);

      const active: Reservation | undefined = await this._reservationsRepository.getActiveAt(now, transaction);

      if (!active || !(await this._mayRelease(actor, active))) {
        return { events: [] };
      }

      active.complete(actor.userId, now);

      await this._reservationsRepository.save(active, transaction);

      return {
        result: { reservationId: active.id, holderUserId: active.holder.userId ?? active.createdById, groupId: active.holder.groupId },
        events: active.getEvents(),
      };
    });

    this._eventBus.publish(outcome.events);

    return outcome.result;
  }

  private async _mayRelease(actor: ReservationActor, reservation: Reservation): Promise<boolean> {
    const facts: ResolvedGroupFacts = await this._accessService.resolveGroupFacts(actor, reservation.holder.groupId);

    return canCancel(actor, reservation, facts) || (await this._accessService.isHolder(actor.userId, reservation.holder.toSnapshot()));
  }
}
