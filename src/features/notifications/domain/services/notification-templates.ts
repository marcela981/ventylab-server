/*
 * Funcionalidad: Plantillas de notificaciones
 * Descripción: Único punto con los textos en español (copia de producto para estudiantes y docentes) de cada tipo de notificación y sus referencias de enlace profundo, construidos a partir de la carga útil del evento de dominio de catálogo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type EvaluationActivatedPayload,
  type EvaluationAttemptResetPayload,
  type GradeFeedbackReadyPayload,
  type GradePublishedPayload,
  type ReservationCancelledPayload,
  type ReservationPreemptedPayload,
  type UserRoleChangedPayload,
  type VentilatorDeviceOfflinePayload,
} from "@/common/domain/events/domain-event-catalog";
import { type NotificationContent } from "@/features/notifications/domain/entities/notification.entity";

const DATE_FORMAT: Intl.DateTimeFormat = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

const ROLE_LABELS: Record<string, string> = { STUDENT: "estudiante", TEACHER: "docente", ADMIN: "administrador" };

export function formatNotificationDate(date: Date): string {
  return DATE_FORMAT.format(date);
}

function formatWindow(startsAt: Date, endsAt: Date): string {
  return `del ${formatNotificationDate(startsAt)} al ${formatNotificationDate(endsAt)}`;
}

export const NOTIFICATION_TEMPLATES: {
  reservationPreempted(payload: ReservationPreemptedPayload): NotificationContent;
  reservationCancelled(payload: ReservationCancelledPayload): NotificationContent;
  evaluationActivated(payload: EvaluationActivatedPayload): NotificationContent;
  gradePublished(payload: GradePublishedPayload): NotificationContent;
  feedbackReady(payload: GradeFeedbackReadyPayload): NotificationContent;
  attemptReset(payload: EvaluationAttemptResetPayload): NotificationContent;
  roleChanged(payload: UserRoleChangedPayload): NotificationContent;
  ventilatorOffline(payload: VentilatorDeviceOfflinePayload, reservationId: string): NotificationContent;
} = {
  reservationPreempted: (payload: ReservationPreemptedPayload): NotificationContent => ({
    type: "RESERVATION_PREEMPTED",
    title: "Tu reserva del ventilador fue desplazada",
    body: `Tu reserva ${formatWindow(payload.startsAt, payload.endsAt)} fue reemplazada por otra reserva.${payload.reason ? ` Motivo: ${payload.reason}` : ""}`,
    data: { reservationId: payload.reservationId, replacedByReservationId: payload.replacedByReservationId },
  }),
  reservationCancelled: (payload: ReservationCancelledPayload): NotificationContent => ({
    type: "RESERVATION_CANCELLED",
    title: "Tu reserva del ventilador fue cancelada",
    body: `La reserva ${formatWindow(payload.startsAt, payload.endsAt)} fue cancelada.`,
    data: { reservationId: payload.reservationId },
  }),
  evaluationActivated: (payload: EvaluationActivatedPayload): NotificationContent => ({
    type: "EVALUATION_ACTIVATED",
    title: "Nueva evaluación asignada",
    body: `Se te asignó la evaluación "${payload.title}", disponible desde el ${formatNotificationDate(payload.startsAt)} hasta el ${formatNotificationDate(payload.endsAt)}.`,
    data: { evaluationId: payload.evaluationId, assignmentId: payload.assignmentId },
  }),
  gradePublished: (payload: GradePublishedPayload): NotificationContent => ({
    type: "GRADE_PUBLISHED",
    title: "Calificación publicada",
    body: `Ya puedes consultar tu calificación: ${payload.score} de ${payload.maxScore} puntos (${payload.passed ? "aprobada" : "no aprobada"}).`,
    data: { evaluationId: payload.evaluationId, attemptId: payload.attemptId },
  }),
  feedbackReady: (payload: GradeFeedbackReadyPayload): NotificationContent => ({
    type: "FEEDBACK_READY",
    title: "Retroalimentación disponible",
    body: "La retroalimentación de tu evaluación ya está lista.",
    data: { evaluationId: payload.evaluationId, attemptId: payload.attemptId, feedbackId: payload.feedbackId },
  }),
  attemptReset: (payload: EvaluationAttemptResetPayload): NotificationContent => ({
    type: "ATTEMPT_RESET",
    title: "Puedes repetir la evaluación",
    body: `Tu docente te habilitó un nuevo intento en la evaluación "${payload.title}".`,
    data: { evaluationId: payload.evaluationId },
  }),
  roleChanged: (payload: UserRoleChangedPayload): NotificationContent => ({
    type: "ROLE_CHANGED",
    title: "Tu rol cambió",
    body: `Tu rol en VentyLab ahora es ${ROLE_LABELS[payload.newRole] ?? payload.newRole}.`,
    data: { previousRole: payload.previousRole, newRole: payload.newRole },
  }),
  ventilatorOffline: (payload: VentilatorDeviceOfflinePayload, reservationId: string): NotificationContent => ({
    type: "VENTILATOR_OFFLINE",
    title: "El ventilador se desconectó",
    body: "El ventilador físico dejó de responder durante tu reserva activa. Los datos en tiempo real se reanudarán cuando vuelva a conectarse.",
    data: { reservationId, reason: payload.reason },
  }),
};
