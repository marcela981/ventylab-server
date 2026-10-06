/*
 * Funcionalidad: Objeto de valor override-entity-type
 * Descripción: Define los valores permitidos OverrideEntityTypeValue, LEVEL_OVERRIDE_ENTITY_TYPE, LESSON_OVERRIDE_ENTITY_TYPE, CARD_OVERRIDE_ENTITY_TYPE, OVERRIDE_ENTITY_TYPE_VALUES de la feature de personalizaciones de contenido por estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type OverrideEntityTypeValue = "LEVEL" | "LESSON" | "CARD";

export const LEVEL_OVERRIDE_ENTITY_TYPE: OverrideEntityTypeValue = "LEVEL";
export const LESSON_OVERRIDE_ENTITY_TYPE: OverrideEntityTypeValue = "LESSON";
export const CARD_OVERRIDE_ENTITY_TYPE: OverrideEntityTypeValue = "CARD";

export const OVERRIDE_ENTITY_TYPE_VALUES: readonly OverrideEntityTypeValue[] = [
  LEVEL_OVERRIDE_ENTITY_TYPE,
  LESSON_OVERRIDE_ENTITY_TYPE,
  CARD_OVERRIDE_ENTITY_TYPE,
] as const;
