/*
 * Funcionalidad: Caso de uso ListMyNotifications
 * Descripción: Página de notificaciones del usuario autenticado, más recientes primero, con filtro opcional de solo no leídas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type Notification } from "@/features/notifications/domain/entities/notification.entity";
import {
  type INotificationsRepository,
  NOTIFICATIONS_REPOSITORY_TOKEN,
  type NotificationsPageQuery,
} from "@/features/notifications/domain/repositories/notifications.repository";

@Injectable()
export class ListMyNotificationsUseCase {
  public constructor(
    @Inject(NOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly _repository: INotificationsRepository,
  ) {}

  public async execute(query: NotificationsPageQuery): Promise<Paginated<Notification>> {
    return await this._repository.getPageForUser(query);
  }
}
