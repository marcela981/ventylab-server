/*
 * Funcionalidad: Tipos de notificación
 * Descripción: Catálogo de tipos de notificación persistida que genera la plataforma a partir de los eventos de dominio; v1.2: GROUP_MEMBER_ADDED
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type NotificationTypeValue =
  | "RESERVATION_PREEMPTED"
  | "RESERVATION_CANCELLED"
  | "EVALUATION_ACTIVATED"
  | "GRADE_PUBLISHED"
  | "FEEDBACK_READY"
  | "ATTEMPT_RESET"
  | "ROLE_CHANGED"
  | "GROUP_MEMBER_ADDED"
  | "VENTILATOR_OFFLINE";

export const NOTIFICATION_TYPES: readonly NotificationTypeValue[] = [
  "RESERVATION_PREEMPTED",
  "RESERVATION_CANCELLED",
  "EVALUATION_ACTIVATED",
  "GRADE_PUBLISHED",
  "FEEDBACK_READY",
  "ATTEMPT_RESET",
  "ROLE_CHANGED",
  "GROUP_MEMBER_ADDED",
  "VENTILATOR_OFFLINE",
];
