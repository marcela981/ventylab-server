/*
 * Funcionalidad: DTOs de respuesta de notificaciones
 * Descripción: Notificación del usuario (misma forma que la carga útil de notification:new), conteo de no leídas y resultado de marcar todas como leídas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { NOTIFICATION_TYPES } from "@/features/notifications/domain/value-objects/notification-type";

export class NotificationDTO {
  @ApiProperty({ description: "Notification ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Notification type", enum: NOTIFICATION_TYPES, example: "GRADE_PUBLISHED" })
  public type: string;

  @ApiProperty({ description: "Title shown to the user", example: "Calificación publicada" })
  public title: string;

  @ApiProperty({ description: "Body shown to the user", example: "Ya puedes consultar tu calificación: 8 de 10 puntos (aprobada)." })
  public body: string;

  @ApiProperty({
    description: "Deep-link references (record IDs) for the client to build the target route",
    example: { evaluationId: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f", attemptId: "01932e9f-5678-7abc-9def-1a2b3c4d5e6f" },
    nullable: true,
    type: Object,
  })
  public data: Record<string, string | number | boolean | null> | null;

  @ApiProperty({ description: "When the notification was read (null while unread)", example: null, nullable: true, type: Date })
  public readAt: Date | null;

  @ApiProperty({ description: "When the notification was created", example: "2026-10-11T14:00:00.000Z" })
  public createdAt: Date;
}

export class UnreadNotificationsCountDTO {
  @ApiProperty({ description: "Number of unread notifications", example: 3 })
  public count: number;
}

export class ReadAllNotificationsResultDTO {
  @ApiProperty({ description: "Number of notifications marked as read", example: 3 })
  public updated: number;
}
