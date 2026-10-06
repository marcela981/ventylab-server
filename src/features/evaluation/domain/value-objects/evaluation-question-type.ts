/*
 * Funcionalidad: Tipos de pregunta de evaluación
 * Descripción: Valores SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, OPEN_TEXT y SIMULATION y la distinción entre preguntas de selección (con opciones) y el resto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type EvaluationQuestionTypeValue = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "OPEN_TEXT" | "SIMULATION";

export const SINGLE_CHOICE_QUESTION_TYPE: EvaluationQuestionTypeValue = "SINGLE_CHOICE";
export const MULTIPLE_CHOICE_QUESTION_TYPE: EvaluationQuestionTypeValue = "MULTIPLE_CHOICE";
export const TRUE_FALSE_QUESTION_TYPE: EvaluationQuestionTypeValue = "TRUE_FALSE";
export const OPEN_TEXT_QUESTION_TYPE: EvaluationQuestionTypeValue = "OPEN_TEXT";
export const SIMULATION_QUESTION_TYPE: EvaluationQuestionTypeValue = "SIMULATION";

export const EVALUATION_QUESTION_TYPE_VALUES: readonly EvaluationQuestionTypeValue[] = [
  SINGLE_CHOICE_QUESTION_TYPE,
  MULTIPLE_CHOICE_QUESTION_TYPE,
  TRUE_FALSE_QUESTION_TYPE,
  OPEN_TEXT_QUESTION_TYPE,
  SIMULATION_QUESTION_TYPE,
] as const;

export const CHOICE_QUESTION_TYPES: readonly EvaluationQuestionTypeValue[] = [
  SINGLE_CHOICE_QUESTION_TYPE,
  MULTIPLE_CHOICE_QUESTION_TYPE,
  TRUE_FALSE_QUESTION_TYPE,
] as const;

export function isChoiceQuestionType(type: EvaluationQuestionTypeValue): boolean {
  return CHOICE_QUESTION_TYPES.includes(type);
}
