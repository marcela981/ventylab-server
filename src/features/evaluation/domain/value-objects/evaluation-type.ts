/*
 * Funcionalidad: Tipos de evaluación
 * Descripción: Valores EXAM, QUIZ y WORKSHOP de una evaluación y el valor por defecto heredado de mostrar resultados inmediatamente (solo QUIZ). v2.0 (ajustes C1): ningún tipo revisa respuestas durante el intento ni publica la nota al cerrar; los resultados se liberan solo desde la calificación docente (results-release-scope.ts) y showResultsImmediately queda guardado sin efecto
 * Versión: 2.0
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

// Stored for compatibility only: no evaluation type publishes results without a teacher release.
export function defaultShowResultsImmediately(type: EvaluationTypeValue): boolean {
  return type === QUIZ_EVALUATION_TYPE;
}
