/*
 * Funcionalidad: Notificador de reservas por WebSocket
 * Descripción: Adaptador de IReservationNotifier sobre IRealtimePublisher: emite reservation:preempted a la sala del usuario o del grupo titular y, como nadie se une hoy a las salas de grupo, también a la sala de cada miembro
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { type IReservationNotifier, type ReservationPreemptedNotification } from "@/features/reservations/application/ports/reservation-notifier.interface";

export const RESERVATION_PREEMPTED_REALTIME_EVENT: string = "reservation:preempted";

@Injectable()
export class RealtimeReservationNotifier implements IReservationNotifier {
  public constructor(
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
  ) {}

  public notifyPreempted(notification: ReservationPreemptedNotification): Promise<void> {
    const payload: Record<string, unknown> = {
      reservationId: notification.reservationId,
      holderType: notification.holder.type,
      groupId: notification.holder.groupId ?? null,
      startsAt: notification.startsAt.toISOString(),
      endsAt: notification.endsAt.toISOString(),
      reason: notification.reason ?? null,
      wasActive: notification.wasActive,
    };

    if (notification.holder.groupId !== undefined) {
      this._realtimePublisher.emitToGroup(notification.holder.groupId, RESERVATION_PREEMPTED_REALTIME_EVENT, payload);
    }

    for (const userId of new Set<string>(notification.recipientUserIds)) {
      this._realtimePublisher.emitToUser(userId, RESERVATION_PREEMPTED_REALTIME_EVENT, payload);
    }

    return Promise.resolve();
  }
}
