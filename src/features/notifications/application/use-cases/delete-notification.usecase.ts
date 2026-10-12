/*
 * Funcionalidad: Caso de uso DeleteNotification
 * Descripción: Elimina una notificación del usuario autenticado; una notificación ajena se trata como inexistente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { NotificationNotFoundError } from "@/features/notifications/domain/notifications.errors";
import { type INotificationsRepository, NOTIFICATIONS_REPOSITORY_TOKEN } from "@/features/notifications/domain/repositories/notifications.repository";

/**
 * @throws {NotificationNotFoundError} If the notification does not exist or belongs to another user
 */
@Injectable()
export class DeleteNotificationUseCase {
  public constructor(
    @Inject(NOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly _repository: INotificationsRepository,
  ) {}

  public async execute(id: string, userId: string): Promise<void> {
    const deleted: boolean = await this._repository.deleteForUser(id, userId);

    if (!deleted) {
      throw new NotificationNotFoundError();
    }
  }
}
