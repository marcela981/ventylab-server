/*
 * Funcionalidad: Caso de uso ReserveVentilatorUseCase
 * Descripción: Adaptador heredado de POST /api/simulation/reserve: delega en ReservationsFacade.reserveNow (mismo bloqueo del dispositivo y reglas de solapamiento que las reservas programadas), conserva la recuperación de la reserva del mismo usuario y el error de ventilador ocupado, publica el evento que difunde `ventilator:reserved` y refresca la caché en memoria
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ReserveNowResult } from "@/features/reservations/application/results/reserve-now.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { ReserveVentilatorCommand } from "@/features/simulation/application/commands/reserve-ventilator.command";
import { ReserveVentilatorResult } from "@/features/simulation/application/results/reserve-ventilator.result";
import { ReservationCacheService } from "@/features/simulation/application/services/reservation-cache.service";
import { VentilatorReservedEvent } from "@/features/simulation/domain/events/ventilator-reservation.events";
import { VentilatorAlreadyReservedError } from "@/features/simulation/domain/simulation.errors";

/**
 * @throws {VentilatorAlreadyReservedError} If another holder has a reservation overlapping the requested time
 * @throws {InvalidReservationWindowError} If the duration is not positive
 * @throws {ReservationTooLongError} If the duration exceeds the maximum reservation length
 */
@Injectable()
export class ReserveVentilatorUseCase {
  public constructor(
    private readonly _reservationsFacade: ReservationsFacade,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
    private readonly _reservationCache: ReservationCacheService,
  ) {}

  public async execute(command: ReserveVentilatorCommand): Promise<ReserveVentilatorResult> {
    const result: ReserveNowResult = await this._reservationsFacade.reserveNow({
      userId: command.userId,
      role: command.userRole,
      durationMinutes: command.durationMinutes,
      groupId: command.groupId,
      purpose: command.purpose,
    });

    if (result.kind === "occupied") {
      throw new VentilatorAlreadyReservedError();
    }

    if (!result.recovered) {
      this._eventBus.publish([
        new VentilatorReservedEvent({
          reservationId: result.reservationId,
          userId: result.holderUserId,
          holderName: result.holderName,
          groupId: result.groupId,
          endTime: result.endsAt,
        }),
      ]);
    }

    await this._reservationCache.refresh();

    return new ReserveVentilatorResult({
      reservationId: result.reservationId,
      startTime: result.startsAt.getTime(),
      endTime: result.endsAt.getTime(),
      recovered: result.recovered,
    });
  }
}
