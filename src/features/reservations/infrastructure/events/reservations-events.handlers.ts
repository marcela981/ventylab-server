/*
 * Funcionalidad: Manejadores de eventos de reservas
 * Descripción: Al desplazarse una reserva resuelve en segundo plano los usuarios del titular y los avisa a través de IReservationNotifier; atrapa todo error para no bloquear ni romper la petición
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { type IReservationNotifier, RESERVATION_NOTIFIER_TOKEN } from "@/features/reservations/application/ports/reservation-notifier.interface";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationPreemptedEvent } from "@/features/reservations/domain/events/reservation.events";

@Injectable()
export class ReservationsEventsHandlers {
  private readonly _logger: Logger = new Logger(ReservationsEventsHandlers.name);

  public constructor(
    @Inject(RESERVATION_NOTIFIER_TOKEN)
    private readonly _notifier: IReservationNotifier,
    private readonly _accessService: ReservationAccessService,
  ) {}

  @OnEvent(ReservationPreemptedEvent.name, { async: true })
  public async handleReservationPreempted(event: ReservationPreemptedEvent): Promise<void> {
    try {
      const recipientUserIds: string[] = await this._accessService.listHolderUserIds(event.previousHolder);

      await this._notifier.notifyPreempted({
        reservationId: event.reservationId,
        holder: event.previousHolder,
        recipientUserIds,
        startsAt: event.window.startsAt,
        endsAt: event.window.endsAt,
        reason: event.reason,
        wasActive: event.wasActive,
      });
    } catch (error: unknown) {
      this._logger.error(`Preemption notification failed for reservation ${event.reservationId} (${error instanceof Error ? error.name : "UnknownError"})`);
    }
  }
}
