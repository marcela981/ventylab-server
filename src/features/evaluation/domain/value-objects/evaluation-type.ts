/*
 * Funcionalidad: Tipos de evaluación
 * Descripción: Valores EXAM, QUIZ y WORKSHOP de una evaluación y el valor por defecto de mostrar resultados inmediatamente (solo QUIZ)
 * Versión: 1.0
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
