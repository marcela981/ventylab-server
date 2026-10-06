/*
 * Funcionalidad: Estados de la retroalimentación de calificación
 * Descripción: Estados de una fila GradeFeedback (pendiente, lista o fallida) y la comprobación de retroalimentación vigente (pendiente o lista) que evita generarla dos veces
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type GradeFeedbackStatusValue = "PENDING" | "READY" | "FAILED";

export const PENDING_FEEDBACK_STATUS: GradeFeedbackStatusValue = "PENDING";
export const READY_FEEDBACK_STATUS: GradeFeedbackStatusValue = "READY";
export const FAILED_FEEDBACK_STATUS: GradeFeedbackStatusValue = "FAILED";

export const GRADE_FEEDBACK_STATUS_VALUES: readonly GradeFeedbackStatusValue[] = [PENDING_FEEDBACK_STATUS, READY_FEEDBACK_STATUS, FAILED_FEEDBACK_STATUS];

export function isActiveGradeFeedbackStatus(status: GradeFeedbackStatusValue): boolean {
  return status === PENDING_FEEDBACK_STATUS || status === READY_FEEDBACK_STATUS;
}
