/*
 * Funcionalidad: Mapper Prisma de notificaciones
 * Descripción: Convierte entre la fila notifications de Prisma y la entidad Notification, incluida la carga JSON de referencias de enlace profundo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Notification as NotificationModel, type Prisma } from "@prisma/client";

import { Notification, type NotificationData } from "@/features/notifications/domain/entities/notification.entity";

function toData(value: Prisma.JsonValue): NotificationData | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as NotificationData) : undefined;
}

export class NotificationsMapper {
  public static toDomain(row: NotificationModel): Notification {
    return Notification.fromPersistence({
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      body: row.body,
      data: toData(row.data),
      readAt: row.readAt ?? undefined,
      createdAt: row.createdAt,
    });
  }

  public static toCreateInput(notification: Notification): Prisma.NotificationCreateManyInput {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      readAt: notification.readAt ?? null,
      createdAt: notification.createdAt,
    };
  }
}
