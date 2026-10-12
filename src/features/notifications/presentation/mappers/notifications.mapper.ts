/*
 * Funcionalidad: Mapper de presentación de notificaciones
 * Descripción: Convierte la entidad Notification en NotificationDTO con la misma forma que la carga útil en tiempo real notification:new
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { toNotificationResult } from "@/features/notifications/application/results/notification.result";
import { type Notification } from "@/features/notifications/domain/entities/notification.entity";
import { type NotificationDTO } from "@/features/notifications/presentation/dtos/notification.dto";

export class NotificationsPresentationMapper {
  public static toDTO(notification: Notification): NotificationDTO {
    return { ...toNotificationResult(notification) };
  }

  public static toDTOList(notifications: Notification[]): NotificationDTO[] {
    return notifications.map((notification: Notification) => NotificationsPresentationMapper.toDTO(notification));
  }
}
