/*
 * Funcionalidad: Caso de uso DeliverNotifications
 * Descripción: Crea una notificación por destinatario (sin duplicados), las inserta en una sola operación en lote y, solo después de persistirlas, emite notification:new a la sala de cada usuario por IRealtimePublisher
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { NOTIFICATION_NEW_REALTIME_EVENT, toNotificationResult } from "@/features/notifications/application/results/notification.result";
import { Notification, type NotificationContent } from "@/features/notifications/domain/entities/notification.entity";
import { type INotificationsRepository, NOTIFICATIONS_REPOSITORY_TOKEN } from "@/features/notifications/domain/repositories/notifications.repository";

@Injectable()
export class DeliverNotificationsUseCase {
  public constructor(
    @Inject(NOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly _repository: INotificationsRepository,
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
  ) {}

  public async execute(recipientUserIds: string[], content: NotificationContent): Promise<Notification[]> {
    const now: Date = new Date();
    const notifications: Notification[] = [...new Set<string>(recipientUserIds)].map((userId: string): Notification => Notification.create(userId, content, now));

    if (notifications.length === 0) {
      return [];
    }

    await this._repository.createMany(notifications);

    for (const notification of notifications) {
      this._realtimePublisher.emitToUser(notification.userId, NOTIFICATION_NEW_REALTIME_EVENT, toNotificationResult(notification));
    }

    return notifications;
  }
}
