/*
 * Funcionalidad: DTOs de datos de notificaciones por tipo
 * Descripción: Forma del campo data de cada tipo de notificación (referencias de enlace profundo que construyen las plantillas): reserva desplazada o cancelada, evaluación asignada, calificación publicada, retroalimentación lista, cambio de rol y ventilador fuera de línea
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

const RESERVATION_ID_EXAMPLE: string = "01932e9f-1234-7abc-9def-1a2b3c4d5e6f";
const EVALUATION_ID_EXAMPLE: string = "01932e9f-2345-7abc-9def-1a2b3c4d5e6f";
const ATTEMPT_ID_EXAMPLE: string = "01932e9f-5678-7abc-9def-1a2b3c4d5e6f";

export class ReservationPreemptedNotificationDataDTO {
  @ApiProperty({ description: "ID of the preempted reservation", example: RESERVATION_ID_EXAMPLE })
  public reservationId: string;

  @ApiProperty({ description: "ID of the reservation that replaced it", example: "01932e9f-9999-7abc-9def-1a2b3c4d5e6f" })
  public replacedByReservationId: string;
}

export class ReservationCancelledNotificationDataDTO {
  @ApiProperty({ description: "ID of the cancelled reservation", example: RESERVATION_ID_EXAMPLE })
  public reservationId: string;
}

export class EvaluationActivatedNotificationDataDTO {
  @ApiProperty({ description: "ID of the assigned evaluation", example: EVALUATION_ID_EXAMPLE })
  public evaluationId: string;

  @ApiProperty({ description: "ID of the assignment of the evaluation to the group", example: "01932e9f-3456-7abc-9def-1a2b3c4d5e6f" })
  public assignmentId: string;
}

export class GradePublishedNotificationDataDTO {
  @ApiProperty({ description: "ID of the graded evaluation", example: EVALUATION_ID_EXAMPLE })
  public evaluationId: string;

  @ApiProperty({ description: "ID of the graded attempt", example: ATTEMPT_ID_EXAMPLE })
  public attemptId: string;
}

export class FeedbackReadyNotificationDataDTO {
  @ApiProperty({ description: "ID of the evaluation", example: EVALUATION_ID_EXAMPLE })
  public evaluationId: string;

  @ApiProperty({ description: "ID of the attempt the feedback belongs to", example: ATTEMPT_ID_EXAMPLE })
  public attemptId: string;

  @ApiProperty({ description: "ID of the generated feedback", example: "01932e9f-6789-7abc-9def-1a2b3c4d5e6f" })
  public feedbackId: string;
}

export class AttemptResetNotificationDataDTO {
  @ApiProperty({ description: "ID of the evaluation the student may take again", example: EVALUATION_ID_EXAMPLE })
  public evaluationId: string;
}

export class RoleChangedNotificationDataDTO {
  @ApiProperty({ description: "Role before the change", example: "STUDENT" })
  public previousRole: string;

  @ApiProperty({ description: "Role after the change", example: "TEACHER" })
  public newRole: string;
}

export class VentilatorOfflineNotificationDataDTO {
  @ApiProperty({ description: "ID of the active reservation during which the ventilator went offline", example: RESERVATION_ID_EXAMPLE })
  public reservationId: string;

  @ApiProperty({ description: "Reason reported for the disconnection", example: "heartbeat_timeout" })
  public reason: string;
}
