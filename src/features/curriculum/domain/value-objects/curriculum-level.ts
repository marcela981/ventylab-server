/*
 * Funcionalidad: Objeto de valor curriculum-level
 * Descripción: Define los valores permitidos CurriculumLevelValue, PREREQUISITOS_CURRICULUM_LEVEL, BEGINNER_CURRICULUM_LEVEL, INTERMEDIATE_CURRICULUM_LEVEL, ADVANCED_CURRICULUM_LEVEL, CURRICULUM_LEVEL_VALUES de la feature de currículo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type CurriculumLevelValue = "prerequisitos" | "beginner" | "intermediate" | "advanced";

export const PREREQUISITOS_CURRICULUM_LEVEL: CurriculumLevelValue = "prerequisitos";
export const BEGINNER_CURRICULUM_LEVEL: CurriculumLevelValue = "beginner";
export const INTERMEDIATE_CURRICULUM_LEVEL: CurriculumLevelValue = "intermediate";
export const ADVANCED_CURRICULUM_LEVEL: CurriculumLevelValue = "advanced";

export const CURRICULUM_LEVEL_VALUES: readonly CurriculumLevelValue[] = [
  PREREQUISITOS_CURRICULUM_LEVEL,
  BEGINNER_CURRICULUM_LEVEL,
  INTERMEDIATE_CURRICULUM_LEVEL,
  ADVANCED_CURRICULUM_LEVEL,
] as const;
