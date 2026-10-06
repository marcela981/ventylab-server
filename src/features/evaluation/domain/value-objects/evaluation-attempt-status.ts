/*
 * Funcionalidad: Estados de intentos de evaluación
 * Descripción: Valores IN_PROGRESS, SUBMITTED, PENDING_REVIEW y GRADED de un intento de estudiante y la distinción entre intentos abiertos y cerrados (entregados)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type EvaluationAttemptStatusValue = "IN_PROGRESS" | "SUBMITTED" | "PENDING_REVIEW" | "GRADED";

export const IN_PROGRESS_ATTEMPT_STATUS: EvaluationAttemptStatusValue = "IN_PROGRESS";
export const SUBMITTED_ATTEMPT_STATUS: EvaluationAttemptStatusValue = "SUBMITTED";
export const PENDING_REVIEW_ATTEMPT_STATUS: EvaluationAttemptStatusValue = "PENDING_REVIEW";
export const GRADED_ATTEMPT_STATUS: EvaluationAttemptStatusValue = "GRADED";

export const EVALUATION_ATTEMPT_STATUS_VALUES: readonly EvaluationAttemptStatusValue[] = [
  IN_PROGRESS_ATTEMPT_STATUS,
  SUBMITTED_ATTEMPT_STATUS,
  PENDING_REVIEW_ATTEMPT_STATUS,
  GRADED_ATTEMPT_STATUS,
] as const;

export function isClosedAttemptStatus(status: EvaluationAttemptStatusValue): boolean {
  return status !== IN_PROGRESS_ATTEMPT_STATUS;
}
