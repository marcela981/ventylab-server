/*
 * Funcionalidad: Tipos de evaluación
 * Descripción: Valores EXAM, QUIZ y WORKSHOP de una evaluación, el valor por defecto de mostrar resultados inmediatamente (solo QUIZ) y la política derivada por tipo: retroalimentación inmediata por pregunta (QUIZ y WORKSHOP) y publicación automática de la nota al cerrar (QUIZ y WORKSHOP siempre; EXAM según showResultsImmediately)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type EvaluationTypeValue = "EXAM" | "QUIZ" | "WORKSHOP";

export const EXAM_EVALUATION_TYPE: EvaluationTypeValue = "EXAM";
export const QUIZ_EVALUATION_TYPE: EvaluationTypeValue = "QUIZ";
export const WORKSHOP_EVALUATION_TYPE: EvaluationTypeValue = "WORKSHOP";

export const EVALUATION_TYPE_VALUES: readonly EvaluationTypeValue[] = [EXAM_EVALUATION_TYPE, QUIZ_EVALUATION_TYPE, WORKSHOP_EVALUATION_TYPE] as const;

export function defaultShowResultsImmediately(type: EvaluationTypeValue): boolean {
  return type === QUIZ_EVALUATION_TYPE;
}

// Whether a student may check a choice answer during the attempt (the answer is locked afterwards).
export function immediateFeedbackFor(type: EvaluationTypeValue): boolean {
  return type === QUIZ_EVALUATION_TYPE || type === WORKSHOP_EVALUATION_TYPE;
}

// Derived instead of stored so existing WORKSHOP rows need no mass update: only EXAM honours the showResultsImmediately column.
export function autoPublishFor(type: EvaluationTypeValue, showResultsImmediately: boolean): boolean {
  return type === EXAM_EVALUATION_TYPE ? showResultsImmediately : true;
}
