/*
 * Funcionalidad: Caso de uso PreemptReservationUseCase
 * Descripción: Desplazamiento explícito de una reserva por un docente o administrador: toma la ventana pedida o, por defecto, la de la reserva desplazada (desde la franja en curso si ya está activa) y delega en CreateReservationUseCase con la confirmación de desplazamiento y el motivo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { CreateReservationCommand } from "@/features/reservations/application/commands/create-reservation.command";
import { type IReservationClock, RESERVATION_CLOCK_TOKEN } from "@/features/reservations/application/ports/reservation-clock.interface";
import { RESERVATION_SETTINGS_TOKEN, type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { CreateReservationUseCase } from "@/features/reservations/application/use-cases/create-reservation.usecase";
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type IReservationsRepository, RESERVATIONS_REPOSITORY_TOKEN } from "@/features/reservations/domain/repositories/reservations.repository";
import { ReservationNotFoundError, ReservationNotScheduledError } from "@/features/reservations/domain/reservations.errors";
import { floorToSlot } from "@/features/reservations/domain/services/reservation-scheduling-rules";

const MS_PER_MINUTE: number = 60_000;

export interface PreemptReservationInput {
  readonly reservationId: string;
  readonly actorId: string;
  readonly actorRole: string;
  readonly reason: string;
  readonly holderType: string;
  readonly userId?: string;
  readonly groupId?: string;
  readonly startsAt?: Date;
  readonly endsAt?: Date;
  readonly purpose?: string;
}

/**
 * @throws {ReservationNotFoundError} If the reservation to preempt does not exist
 * @throws {ReservationNotScheduledError} If the reservation to preempt is no longer scheduled
 * @throws {InvalidReservationHolderError} If the holder type does not match the given user or group
 * @throws {InvalidReservationWindowError} If the new reservation does not end after it starts
 * @throws {ReservationNotAlignedError} If the start or end is not on a slot boundary
 * @throws {ReservationTooLongError} If the new reservation exceeds the maximum duration
 * @throws {ReservationInPastError} If the new reservation starts before the current slot
 * @throws {ReservationTooFarAheadError} If the new reservation starts beyond the maximum advance
 * @throws {ReservationForbiddenError} If the caller cannot reserve for the requested holder
 * @throws {ReservationHolderNotFoundError} If the requested user or group does not exist
 * @throws {ReservationLimitReachedError} If the upcoming reservations limit was reached
 * @throws {ReservationConflictError} If an overlapping reservation cannot be preempted by the caller
 */
@Injectable()
export class PreemptReservationUseCase {
  public constructor(
    @Inject(RESERVATIONS_REPOSITORY_TOKEN)
    private readonly _reservationsRepository: IReservationsRepository,
    @Inject(RESERVATION_SETTINGS_TOKEN)
    private readonly _settings: ReservationSettings,
    @Inject(RESERVATION_CLOCK_TOKEN)
    private readonly _clock: IReservationClock,
    private readonly _createReservationUseCase: CreateReservationUseCase,
  ) {}

  public async execute(input: PreemptReservationInput): Promise<Reservation> {
    const target: Reservation | undefined = await this._reservationsRepository.getById(input.reservationId);

    if (!target) {
      throw new ReservationNotFoundError();
    }

    if (!target.isScheduled()) {
      throw new ReservationNotScheduledError();
    }

    const now: Date = this._clock.now();
    const startsAt: Date = input.startsAt ?? this._defaultStart(target, now);
    const endsAt: Date = input.endsAt ?? this._defaultEnd(target, startsAt);

    return await this._createReservationUseCase.execute(
      new CreateReservationCommand({
        actorId: input.actorId,
        actorRole: input.actorRole,
        holderType: input.holderType,
        userId: input.userId,
        groupId: input.groupId,
        startsAt,
        endsAt,
        purpose: input.purpose,
        confirmPreempt: true,
        preemptReason: input.reason,
      }),
    );
  }

  private _defaultStart(target: Reservation, now: Date): Date {
    const slotStart: Date = floorToSlot(target.startsAt, this._settings.slotMinutes);
    const currentSlot: Date = floorToSlot(now, this._settings.slotMinutes);

    return slotStart.getTime() < currentSlot.getTime() ? currentSlot : slotStart;
  }

  private _defaultEnd(target: Reservation, startsAt: Date): Date {
    const slotMs: number = this._settings.slotMinutes * MS_PER_MINUTE;
    const alignedEnd: number = Math.ceil(target.endsAt.getTime() / slotMs) * slotMs;
    const maxEnd: number = startsAt.getTime() + this._settings.maxDurationMinutes * MS_PER_MINUTE;

    return new Date(Math.min(Math.max(alignedEnd, startsAt.getTime() + slotMs), maxEnd));
  }
}
