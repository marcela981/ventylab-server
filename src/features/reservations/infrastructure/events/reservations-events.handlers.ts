/*
 * Funcionalidad: Manejadores de eventos de reservas
 * Descripción: Al desplazarse una reserva resuelve en segundo plano los usuarios del titular y emite reservation:preempted por IRealtimePublisher a la sala del grupo titular y, como nadie se une hoy a las salas de grupo, también a la sala de cada usuario; atrapa todo error para no bloquear ni romper la petición
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { ReservationAccessService } from "@/features/reservations/application/services/reservation-access.service";
import { ReservationPreemptedEvent } from "@/features/reservations/domain/events/reservation.events";

export const RESERVATION_PREEMPTED_REALTIME_EVENT: string = "reservation:preempted";

@Injectable()
export class ReservationsEventsHandlers {
  private readonly _logger: Logger = new Logger(ReservationsEventsHandlers.name);

  public constructor(
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
    private readonly _accessService: ReservationAccessService,
  ) {}

  @OnEvent(ReservationPreemptedEvent.name, { async: true })
  public async handleReservationPreempted(event: ReservationPreemptedEvent): Promise<void> {
    try {
      const recipientUserIds: string[] = await this._accessService.listHolderUserIds(event.previousHolder);

      const payload: Record<string, unknown> = {
        reservationId: event.reservationId,
        holderType: event.previousHolder.type,
        groupId: event.previousHolder.groupId ?? null,
        startsAt: event.window.startsAt.toISOString(),
        endsAt: event.window.endsAt.toISOString(),
        reason: event.reason ?? null,
        wasActive: event.wasActive,
      };

      if (event.previousHolder.groupId !== undefined) {
        this._realtimePublisher.emitToGroup(event.previousHolder.groupId, RESERVATION_PREEMPTED_REALTIME_EVENT, payload);
      }

      for (const userId of new Set<string>(recipientUserIds)) {
        this._realtimePublisher.emitToUser(userId, RESERVATION_PREEMPTED_REALTIME_EVENT, payload);
      }
    } catch (error: unknown) {
      this._logger.error(`Preemption notification failed for reservation ${event.reservationId} (${error instanceof Error ? error.name : "UnknownError"})`);
    }
  }
}
