/*
 * Funcionalidad: Resultado de notificación
 * Descripción: Forma pública de una notificación, compartida por la respuesta HTTP y la carga útil del evento en tiempo real notification:new
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Notification, type NotificationData } from "@/features/notifications/domain/entities/notification.entity";

export const NOTIFICATION_NEW_REALTIME_EVENT: string = "notification:new";

export interface NotificationResult {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly data: NotificationData | null;
  readonly readAt: Date | null;
  readonly createdAt: Date;
}

export function toNotificationResult(notification: Notification): NotificationResult {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data ?? null,
    readAt: notification.readAt ?? null,
    createdAt: notification.createdAt,
  };
}
