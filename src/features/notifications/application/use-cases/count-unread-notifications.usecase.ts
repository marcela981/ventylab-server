/*
 * Funcionalidad: Caso de uso CountUnreadNotifications
 * Descripción: Cuenta las notificaciones no leídas de un usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type INotificationsRepository, NOTIFICATIONS_REPOSITORY_TOKEN } from "@/features/notifications/domain/repositories/notifications.repository";

@Injectable()
export class CountUnreadNotificationsUseCase {
  public constructor(
    @Inject(NOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly _repository: INotificationsRepository,
  ) {}

  public async execute(userId: string): Promise<number> {
    return await this._repository.countUnread(userId);
  }
}
