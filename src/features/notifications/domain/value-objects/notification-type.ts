/*
 * Funcionalidad: Tipos de notificación
 * Descripción: Catálogo de tipos de notificación persistida que genera la plataforma a partir de los eventos de dominio
 * Versión: 1.0
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
  | "ROLE_CHANGED"
  | "VENTILATOR_OFFLINE";

export const NOTIFICATION_TYPES: readonly NotificationTypeValue[] = [
  "RESERVATION_PREEMPTED",
  "RESERVATION_CANCELLED",
  "EVALUATION_ACTIVATED",
  "GRADE_PUBLISHED",
  "FEEDBACK_READY",
  "ROLE_CHANGED",
  "VENTILATOR_OFFLINE",
];
