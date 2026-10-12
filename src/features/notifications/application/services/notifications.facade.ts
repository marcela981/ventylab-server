/*
 * Funcionalidad: Fachada pública de notificaciones
 * Descripción: API que NotificationsModule exporta para otras features (panel personal de analítica): conteo de notificaciones no leídas de un usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { CountUnreadNotificationsUseCase } from "@/features/notifications/application/use-cases/count-unread-notifications.usecase";

@Injectable()
export class NotificationsFacade {
  public constructor(private readonly _countUnreadUseCase: CountUnreadNotificationsUseCase) {}

  public async countUnread(userId: string): Promise<number> {
    return await this._countUnreadUseCase.execute(userId);
  }
}
