/*
 * Funcionalidad: Caso de uso MarkAllNotificationsRead
 * Descripción: Marca como leídas todas las notificaciones pendientes del usuario autenticado y devuelve cuántas cambiaron
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
export class MarkAllNotificationsReadUseCase {
  public constructor(
    @Inject(NOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly _repository: INotificationsRepository,
  ) {}

  public async execute(userId: string): Promise<number> {
    return await this._repository.markAllRead(userId, new Date());
  }
}
