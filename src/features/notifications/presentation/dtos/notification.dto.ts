/*
 * Funcionalidad: DTOs de respuesta de notificaciones
 * Descripción: Notificación del usuario (misma forma que la carga útil de notification:new) con una variante por tipo que documenta su campo data y la unión discriminada por type, conteo de no leídas y resultado de marcar todas como leídas
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, getSchemaPath, OmitType, type ReferenceObject, type SchemaObject } from "@nestjs/swagger";

import { type NotificationTypeValue, NOTIFICATION_TYPES } from "@/features/notifications/domain/value-objects/notification-type";
import {
  AttemptResetNotificationDataDTO,
  EvaluationActivatedNotificationDataDTO,
  FeedbackReadyNotificationDataDTO,
  GradePublishedNotificationDataDTO,
  ReservationCancelledNotificationDataDTO,
  ReservationPreemptedNotificationDataDTO,
  RoleChangedNotificationDataDTO,
  VentilatorOfflineNotificationDataDTO,
} from "@/features/notifications/presentation/dtos/notification-data.dto";

export const NOTIFICATION_DATA_DTOS: (new () => object)[] = [
  ReservationPreemptedNotificationDataDTO,
  ReservationCancelledNotificationDataDTO,
  EvaluationActivatedNotificationDataDTO,
  GradePublishedNotificationDataDTO,
  FeedbackReadyNotificationDataDTO,
  AttemptResetNotificationDataDTO,
  RoleChangedNotificationDataDTO,
  VentilatorOfflineNotificationDataDTO,
];

export class NotificationDTO {
  @ApiProperty({ description: "Notification ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Notification type; it decides the shape of data", enum: NOTIFICATION_TYPES, example: "GRADE_PUBLISHED" })
  public type: string;

  @ApiProperty({ description: "Title shown to the user", example: "Calificación publicada" })
  public title: string;

  @ApiProperty({ description: "Body shown to the user", example: "Ya puedes consultar tu calificación: 8 de 10 puntos (aprobada)." })
  public body: string;

  @ApiProperty({
    description: "Deep-link references (record IDs) for the client to build the target route; its shape depends on type",
    example: { evaluationId: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f", attemptId: "01932e9f-5678-7abc-9def-1a2b3c4d5e6f" },
    nullable: true,
    oneOf: NOTIFICATION_DATA_DTOS.map((dto: new () => object): ReferenceObject => ({ $ref: getSchemaPath(dto) })),
  })
  public data: Record<string, string | number | boolean | null> | null;

  @ApiProperty({ description: "When the notification was read (null while unread)", example: null, nullable: true, type: Date })
  public readAt: Date | null;

  @ApiProperty({ description: "When the notification was created", example: "2026-10-11T14:00:00.000Z" })
  public createdAt: Date;
}

export class ReservationPreemptedNotificationDTO extends OmitType(NotificationDTO, ["type", "data"] as const) {
  @ApiProperty({ description: "Notification type", enum: ["RESERVATION_PREEMPTED"], example: "RESERVATION_PREEMPTED" })
  public type: string;

  @ApiProperty({ description: "References of the preempted reservation", type: ReservationPreemptedNotificationDataDTO, nullable: true })
  public data: Record<string, string | number | boolean | null> | null;
}

export class ReservationCancelledNotificationDTO extends OmitType(NotificationDTO, ["type", "data"] as const) {
  @ApiProperty({ description: "Notification type", enum: ["RESERVATION_CANCELLED"], example: "RESERVATION_CANCELLED" })
  public type: string;

  @ApiProperty({ description: "References of the cancelled reservation", type: ReservationCancelledNotificationDataDTO, nullable: true })
  public data: Record<string, string | number | boolean | null> | null;
}

export class EvaluationActivatedNotificationDTO extends OmitType(NotificationDTO, ["type", "data"] as const) {
  @ApiProperty({ description: "Notification type", enum: ["EVALUATION_ACTIVATED"], example: "EVALUATION_ACTIVATED" })
  public type: string;

  @ApiProperty({ description: "References of the assigned evaluation", type: EvaluationActivatedNotificationDataDTO, nullable: true })
  public data: Record<string, string | number | boolean | null> | null;
}

export class GradePublishedNotificationDTO extends OmitType(NotificationDTO, ["type", "data"] as const) {
  @ApiProperty({ description: "Notification type", enum: ["GRADE_PUBLISHED"], example: "GRADE_PUBLISHED" })
  public type: string;

  @ApiProperty({ description: "References of the published grade", type: GradePublishedNotificationDataDTO, nullable: true })
  public data: Record<string, string | number | boolean | null> | null;
}

export class FeedbackReadyNotificationDTO extends OmitType(NotificationDTO, ["type", "data"] as const) {
  @ApiProperty({ description: "Notification type", enum: ["FEEDBACK_READY"], example: "FEEDBACK_READY" })
  public type: string;

  @ApiProperty({ description: "References of the ready feedback", type: FeedbackReadyNotificationDataDTO, nullable: true })
  public data: Record<string, string | number | boolean | null> | null;
}

export class AttemptResetNotificationDTO extends OmitType(NotificationDTO, ["type", "data"] as const) {
  @ApiProperty({ description: "Notification type", enum: ["ATTEMPT_RESET"], example: "ATTEMPT_RESET" })
  public type: string;

  @ApiProperty({ description: "Evaluation the student may take again", type: AttemptResetNotificationDataDTO, nullable: true })
  public data: Record<string, string | number | boolean | null> | null;
}

export class RoleChangedNotificationDTO extends OmitType(NotificationDTO, ["type", "data"] as const) {
  @ApiProperty({ description: "Notification type", enum: ["ROLE_CHANGED"], example: "ROLE_CHANGED" })
  public type: string;

  @ApiProperty({ description: "Previous and new role of the user", type: RoleChangedNotificationDataDTO, nullable: true })
  public data: Record<string, string | number | boolean | null> | null;
}

export class VentilatorOfflineNotificationDTO extends OmitType(NotificationDTO, ["type", "data"] as const) {
  @ApiProperty({ description: "Notification type", enum: ["VENTILATOR_OFFLINE"], example: "VENTILATOR_OFFLINE" })
  public type: string;

  @ApiProperty({ description: "Active reservation and disconnection reason", type: VentilatorOfflineNotificationDataDTO, nullable: true })
  public data: Record<string, string | number | boolean | null> | null;
}

export const NOTIFICATION_VARIANT_DTOS: Record<NotificationTypeValue, new () => object> = {
  RESERVATION_PREEMPTED: ReservationPreemptedNotificationDTO,
  RESERVATION_CANCELLED: ReservationCancelledNotificationDTO,
  EVALUATION_ACTIVATED: EvaluationActivatedNotificationDTO,
  GRADE_PUBLISHED: GradePublishedNotificationDTO,
  FEEDBACK_READY: FeedbackReadyNotificationDTO,
  ATTEMPT_RESET: AttemptResetNotificationDTO,
  ROLE_CHANGED: RoleChangedNotificationDTO,
  VENTILATOR_OFFLINE: VentilatorOfflineNotificationDTO,
};

export const NOTIFICATION_UNION_SCHEMA: SchemaObject = {
  oneOf: Object.values(NOTIFICATION_VARIANT_DTOS).map((dto: new () => object): ReferenceObject => ({ $ref: getSchemaPath(dto) })),
  discriminator: {
    propertyName: "type",
    mapping: Object.fromEntries(
      Object.entries(NOTIFICATION_VARIANT_DTOS).map(([type, dto]: [string, new () => object]): [string, string] => [type, getSchemaPath(dto)]),
    ),
  },
};

export class UnreadNotificationsCountDTO {
  @ApiProperty({ description: "Number of unread notifications", example: 3 })
  public count: number;
}

export class ReadAllNotificationsResultDTO {
  @ApiProperty({ description: "Number of notifications marked as read", example: 3 })
  public updated: number;
}
