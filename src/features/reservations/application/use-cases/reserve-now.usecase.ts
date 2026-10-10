/*
 * Funcionalidad: Caso de uso ReserveNowUseCase
 * Descripción: Reserva inmediata del flujo heredado: desde ahora por una duración (sin alinear a la franja) para el usuario o, si puede reservar para él, para su grupo; bajo el mismo bloqueo del dispositivo recupera la reserva activa del mismo usuario, informa que el ventilador está ocupado (también si una reserva futura del propio usuario se solapa con la ventana pedida) o aplica a estudiantes los mismos límites de reservas futuras por estudiante y por grupo que la creación programada
 * Versión: 1.1
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
import { ReserveNowCommand } from "@/features/reservations/application/commands/reserve-now.command";
import { type IReservationClock, RESERVATION_CLOCK_TOKEN } from "@/features/reservations/application/ports/reservation-clock.interface";
import { type ReserveNowResult } from "@/features/reservations/application/results/reserve-now.result";
import { ReservationAccessService, type ResolvedGroupFacts } from "@/features/reservations/application/services/reservation-access.service";
import { assertWithinUpcomingReservationLimits } from "@/features/reservations/application/services/upcoming-reservation-limits";
import { RESERVATION_SETTINGS_TOKEN, type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type IReservationsRepository, RESERVATIONS_REPOSITORY_TOKEN } from "@/features/reservations/domain/repositories/reservations.repository";
import { canReserveFor, type ReservationActor, toReservationPartyRole } from "@/features/reservations/domain/services/reservation-access-policy";
import { assertWithinMaxDuration } from "@/features/reservations/domain/services/reservation-scheduling-rules";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";
import { ReservationWindow } from "@/features/reservations/domain/value-objects/reservation-window";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

const MS_PER_MINUTE: number = 60_000;

type ReserveNowOutcome =
  | { kind: "recovered"; reservation: Reservation }
  | { kind: "occupied" }
  | { kind: "created"; reservation: Reservation; events: DomainEvent[] };

/**
 * @throws {InvalidReservationWindowError} If the duration is not positive
 * @throws {ReservationTooLongError} If the duration exceeds the maximum
 * @throws {ReservationLimitReachedError} If a student or a group already has the maximum number of upcoming reservations
 */
@Injectable()
export class ReserveNowUseCase {
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
    private readonly _usersFacade: UsersFacade,
  ) {}

  public async execute(command: ReserveNowCommand): Promise<ReserveNowResult> {
    const actor: ReservationActor = { userId: command.userId, role: toReservationPartyRole(command.role) };
    const now: Date = this._clock.now();
    const window: ReservationWindow = ReservationWindow.create(now, new Date(now.getTime() + command.durationMinutes * MS_PER_MINUTE));

    assertWithinMaxDuration(window, this._settings.maxDurationMinutes);

    const holder: ReservationHolder = await this._resolveHolder(actor, command.groupId);

    const outcome: ReserveNowOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<ReserveNowOutcome> => {
      await this._reservationsRepository.lockDevice(this._settings.deviceId, transaction);

      const overlapping: Reservation[] = await this._reservationsRepository.getScheduledOverlapping(window, transaction);
      const active: Reservation | undefined = overlapping.find((reservation: Reservation): boolean => reservation.isActiveAt(now));

      if (active && (active.holder.userId === actor.userId || active.createdById === actor.userId)) {
        return { kind: "recovered", reservation: active };
      }

      // Any other overlap is occupied, including a future reservation of the caller that starts inside the requested window
      if (overlapping.length > 0) {
        return { kind: "occupied" };
      }

      await assertWithinUpcomingReservationLimits(this._reservationsRepository, this._settings, actor, holder, now, transaction);

      const reservation: Reservation = Reservation.schedule({ holder, window, createdById: actor.userId, purpose: command.purpose, now });

      await this._reservationsRepository.save(reservation, transaction);

      return { kind: "created", reservation, events: reservation.getEvents() };
    });

    if (outcome.kind === "occupied") {
      return { kind: "occupied" };
    }

    if (outcome.kind === "created") {
      this._eventBus.publish(outcome.events);
    }

    const user: UserAccount | undefined = await this._usersFacade.getUserById(actor.userId);

    return {
      kind: "reserved",
      reservationId: outcome.reservation.id,
      holderUserId: actor.userId,
      holderName: user ? user.name ?? user.email : undefined,
      groupId: outcome.reservation.holder.groupId,
      startsAt: outcome.reservation.startsAt,
      endsAt: outcome.reservation.endsAt,
      recovered: outcome.kind === "recovered",
    };
  }

  private async _resolveHolder(actor: ReservationActor, groupId: string | undefined): Promise<ReservationHolder> {
    if (groupId === undefined) {
      return ReservationHolder.forUser(actor.userId);
    }

    const groupHolder: ReservationHolder = ReservationHolder.forGroup(groupId);
    const facts: ResolvedGroupFacts = await this._accessService.resolveGroupFacts(actor, groupId);

    return facts.exists && canReserveFor(actor, groupHolder, facts) ? groupHolder : ReservationHolder.forUser(actor.userId);
  }
}
