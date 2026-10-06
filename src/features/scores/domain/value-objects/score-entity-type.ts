/*
 * Funcionalidad: Tipo de entidad calificada
 * Descripción: Valores permitidos para el tipo de elemento al que se asigna una calificación (MODULE, LESSON, QUIZ, CASE, CUSTOM)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ScoreEntityTypeValue = "MODULE" | "LESSON" | "QUIZ" | "CASE" | "CUSTOM";

export const CUSTOM_SCORE_ENTITY_TYPE: ScoreEntityTypeValue = "CUSTOM";

export const SCORE_ENTITY_TYPE_VALUES: readonly ScoreEntityTypeValue[] = ["MODULE", "LESSON", "QUIZ", "CASE", CUSTOM_SCORE_ENTITY_TYPE] as const;

export const DEFAULT_MAX_POINTS: number = 100;

export function toScoreEntityType(value: string): ScoreEntityTypeValue {
  return SCORE_ENTITY_TYPE_VALUES.includes(value as ScoreEntityTypeValue) ? (value as ScoreEntityTypeValue) : CUSTOM_SCORE_ENTITY_TYPE;
}
