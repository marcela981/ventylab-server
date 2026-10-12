/*
 * Funcionalidad: Caso de uso MarkNotificationRead
 * Descripción: Marca como leída una notificación del usuario autenticado (idempotente); una notificación ajena se trata como inexistente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Notification } from "@/features/notifications/domain/entities/notification.entity";
import { NotificationNotFoundError } from "@/features/notifications/domain/notifications.errors";
import { type INotificationsRepository, NOTIFICATIONS_REPOSITORY_TOKEN } from "@/features/notifications/domain/repositories/notifications.repository";

/**
 * @throws {NotificationNotFoundError} If the notification does not exist or belongs to another user
 */
@Injectable()
export class MarkNotificationReadUseCase {
  public constructor(
    @Inject(NOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly _repository: INotificationsRepository,
  ) {}

  public async execute(id: string, userId: string): Promise<Notification> {
    const notification: Notification | undefined = await this._repository.getByIdForUser(id, userId);

    if (!notification) {
      throw new NotificationNotFoundError();
    }

    if (notification.markRead(new Date())) {
      await this._repository.markRead(notification);
    }

    return notification;
  }
}
