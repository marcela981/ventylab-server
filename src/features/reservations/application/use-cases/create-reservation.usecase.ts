/*
 * Funcionalidad: Caso de uso CreateReservationUseCase
 * Descripción: Programa una reserva del ventilador: valida titular, permisos, franja, duración, antelación y límites (compartidos con la reserva inmediata heredada); bajo pg_advisory_xact_lock del dispositivo comprueba solapamientos y, si un docente o administrador lo confirma, desplaza las reservas de estudiantes (o de cualquiera, si es administrador) en la misma transacción con auditoría, y publica los eventos tras el commit. Sin inicio crea una reserva inmediata (desde ahora truncado al minuto, sin alinear a la franja ni comprobar la antelación, solo la duración máxima) con las mismas reglas de titular, límites, desplazamiento, auditoría y eventos; también devuelve la reserva creada enriquecida para quien la creó
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { CreateReservationCommand } from "@/features/reservations/application/commands/create-reservation.command";
import { type IReservationClock, RESERVATION_CLOCK_TOKEN } from "@/features/reservations/application/ports/reservation-clock.interface";
import { ReservationAccessService, type ResolvedGroupFacts } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationViewsService } from "@/features/reservations/application/services/reservation-views.service";
import { assertWithinUpcomingReservationLimits } from "@/features/reservations/application/services/upcoming-reservation-limits";
import { RESERVATION_SETTINGS_TOKEN, type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { RESERVATION_ENTITY_TYPE, Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type ReservationView, type ReservationViewer } from "@/features/reservations/domain/read-models/reservation.read-model";
import { type IReservationsRepository, RESERVATIONS_REPOSITORY_TOKEN } from "@/features/reservations/domain/repositories/reservations.repository";
import {
  InvalidReservationWindowError,
  type ReservationConflictDetail,
  ReservationConflictError,
  ReservationForbiddenError,
  ReservationHolderNotFoundError,
} from "@/features/reservations/domain/reservations.errors";
import {
  canPreempt,
  canReserveFor,
  isPrivilegedActor,
  type ReservationActor,
  toReservationPartyRole,
} from "@/features/reservations/domain/services/reservation-access-policy";
import {
  assertScheduledWindowRules,
  assertWithinMaxDuration,
  IMMEDIATE_RESERVATION_DURATION_VALUES,
  immediateReservationWindow,
} from "@/features/reservations/domain/services/reservation-scheduling-rules";
import { ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";
import { ReservationWindow } from "@/features/reservations/domain/value-objects/reservation-window";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

export const RESERVATION_PREEMPTED_AUDIT_ACTION: string = "reservation.preempted";

export interface CreatedReservationResult {
  readonly view: ReservationView;
  readonly viewer: ReservationViewer;
}

interface CreationOutcome {
  readonly reservation: Reservation;
  readonly events: DomainEvent[];
}

/**
 * @throws {InvalidReservationHolderError} If the holder type does not match the given user or group
 * @throws {InvalidReservationWindowError} If the reservation does not end after it starts
 * @throws {ReservationNotAlignedError} If the start or end is not on a slot boundary
 * @throws {ReservationTooLongError} If the reservation exceeds the maximum duration
 * @throws {ReservationInPastError} If the reservation starts before the current slot
 * @throws {ReservationTooFarAheadError} If the reservation starts beyond the maximum advance
 * @throws {ReservationForbiddenError} If the caller cannot reserve for the requested holder
 * @throws {ReservationHolderNotFoundError} If the requested user or group does not exist
 * @throws {ReservationLimitReachedError} If a student or a group already has the maximum number of upcoming reservations
 * @throws {ReservationConflictError} If the slot overlaps reservations that are not preempted
 */
@Injectable()
export class CreateReservationUseCase {
  public constructor(
    @Inject(RESERVATIONS_REPOSITORY_TOKEN)
    private readonly _reservationsRepository: IReservationsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
    @Inject(RESERVATION_SETTINGS_TOKEN)
    private readonly _settings: ReservationSettings,
    @Inject(RESERVATION_CLOCK_TOKEN)
    private readonly _clock: IReservationClock,
    private readonly _accessService: ReservationAccessService,
    private readonly _viewsService: ReservationViewsService,
    private readonly _usersFacade: UsersFacade,
  ) {}

  public async execute(command: CreateReservationCommand): Promise<Reservation> {
    const actor: ReservationActor = { userId: command.actorId, role: toReservationPartyRole(command.actorRole) };
    const holder: ReservationHolder = ReservationHolder.create({ type: command.holderType, userId: command.userId, groupId: command.groupId });
    const now: Date = this._clock.now();
    const window: ReservationWindow = this._resolveWindow(command, now);

    await this._assertCanReserveFor(actor, holder);

    const outcome: CreationOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<CreationOutcome> => {
      await this._reservationsRepository.lockDevice(this._settings.deviceId, transaction);
      await assertWithinUpcomingReservationLimits(this._reservationsRepository, this._settings, actor, holder, now, transaction);

      const overlapping: Reservation[] = await this._reservationsRepository.getScheduledOverlapping(window, transaction);

      if (overlapping.length > 0) {
        await this._assertPreemptionAllowed(actor, overlapping, command.confirmPreempt);
      }

      const reservation: Reservation = Reservation.schedule({ holder, window, createdById: actor.userId, purpose: command.purpose, now });

      await this._reservationsRepository.save(reservation, transaction);

      for (const previous of overlapping) {
        await this._preempt(previous, reservation, actor, command.preemptReason, now, transaction);
      }

      return {
        reservation,
        events: [...overlapping.flatMap((previous: Reservation): DomainEvent[] => previous.getEvents()), ...reservation.getEvents()],
      };
    });

    this._eventBus.publish(outcome.events);

    return outcome.reservation;
  }

  /** Creates the reservation and returns it enriched, with the creator as viewer, for the response projection */
  public async executeWithView(command: CreateReservationCommand): Promise<CreatedReservationResult> {
    const reservation: Reservation = await this.execute(command);
    const actor: ReservationActor = { userId: command.actorId, role: toReservationPartyRole(command.actorRole) };

    const [view, viewer]: [ReservationView, ReservationViewer] = await Promise.all([this._viewsService.toView(reservation), this._accessService.resolveViewer(actor)]);

    return { view, viewer };
  }

  private _resolveWindow(command: CreateReservationCommand, now: Date): ReservationWindow {
    if (command.startsAt === undefined) {
      if (command.durationMinutes === undefined || !IMMEDIATE_RESERVATION_DURATION_VALUES.includes(command.durationMinutes)) {
        throw new InvalidReservationWindowError();
      }

      const immediate: ReservationWindow = immediateReservationWindow(now, command.durationMinutes);

      assertWithinMaxDuration(immediate, this._settings.maxDurationMinutes);

      return immediate;
    }

    if (command.endsAt === undefined) {
      throw new InvalidReservationWindowError();
    }

    const scheduled: ReservationWindow = ReservationWindow.create(command.startsAt, command.endsAt);

    assertScheduledWindowRules(scheduled, now, this._settings);

    return scheduled;
  }

  private async _assertCanReserveFor(actor: ReservationActor, holder: ReservationHolder): Promise<void> {
    const facts: ResolvedGroupFacts = await this._accessService.resolveGroupFacts(actor, holder.groupId);

    if (!canReserveFor(actor, holder, facts)) {
      throw new ReservationForbiddenError();
    }

    if (holder.groupId !== undefined && !facts.exists) {
      throw new ReservationHolderNotFoundError();
    }

    if (holder.userId !== undefined && holder.userId !== actor.userId) {
      const user: UserAccount | undefined = await this._usersFacade.getUserById(holder.userId);

      if (!user) {
        throw new ReservationHolderNotFoundError();
      }
    }
  }

  private async _assertPreemptionAllowed(actor: ReservationActor, overlapping: Reservation[], confirmPreempt: boolean): Promise<void> {
    if (!isPrivilegedActor(actor)) {
      throw new ReservationConflictError({
        preemptable: false,
        conflicts: overlapping.map((reservation: Reservation): ReservationConflictDetail => ({
          startsAt: reservation.startsAt.toISOString(),
          endsAt: reservation.endsAt.toISOString(),
        })),
      });
    }

    const views: ReservationView[] = await this._viewsService.toViews(overlapping);
    const preemptable: boolean = views.every((view: ReservationView): boolean => canPreempt(actor, view.holderRole));

    if (!preemptable || !confirmPreempt) {
      throw new ReservationConflictError({ preemptable, conflicts: views.map(CreateReservationUseCase._toConflictDetail) });
    }
  }

  private async _preempt(
    previous: Reservation,
    replacement: Reservation,
    actor: ReservationActor,
    reason: string | undefined,
    now: Date,
    transaction: unknown,
  ): Promise<void> {
    previous.preempt({ preemptedById: actor.userId, reason, replacedByReservationId: replacement.id, now });

    await this._reservationsRepository.save(previous, transaction);

    await this._auditRecorder.record(
      actor.userId,
      RESERVATION_PREEMPTED_AUDIT_ACTION,
      RESERVATION_ENTITY_TYPE,
      previous.id,
      { status: "SCHEDULED", holder: previous.holder.toSnapshot(), startsAt: previous.startsAt.toISOString(), endsAt: previous.endsAt.toISOString() },
      { status: previous.status, preemptedById: actor.userId, preemptedReason: reason ?? null, replacedByReservationId: replacement.id },
      transaction,
    );
  }

  private static _toConflictDetail(view: ReservationView): ReservationConflictDetail {
    return {
      reservationId: view.reservation.id,
      holderType: view.reservation.holder.type,
      holderRole: view.holderRole,
      holderName: view.holderUser?.name ?? view.holderGroup?.name,
      holderIdentifier: view.holderUser?.email,
      groupName: view.holderGroup?.name,
      startsAt: view.reservation.startsAt.toISOString(),
      endsAt: view.reservation.endsAt.toISOString(),
    };
  }
}
