/*
 * Funcionalidad: Objeto de valor change-log-entity-type
 * Descripción: Define los valores permitidos ChangeLogEntityTypeValue, LEVEL_CHANGE_LOG_ENTITY_TYPE, MODULE_CHANGE_LOG_ENTITY_TYPE, LESSON_CHANGE_LOG_ENTITY_TYPE, STEP_CHANGE_LOG_ENTITY_TYPE, CONTENT_OVERRIDE_CHANGE_LOG_ENTITY_TYPE y otros de la feature de historial de cambios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ChangeLogEntityTypeValue = "Level" | "Module" | "Lesson" | "Step" | "ContentOverride";

export const LEVEL_CHANGE_LOG_ENTITY_TYPE: ChangeLogEntityTypeValue = "Level";
export const MODULE_CHANGE_LOG_ENTITY_TYPE: ChangeLogEntityTypeValue = "Module";
export const LESSON_CHANGE_LOG_ENTITY_TYPE: ChangeLogEntityTypeValue = "Lesson";
export const STEP_CHANGE_LOG_ENTITY_TYPE: ChangeLogEntityTypeValue = "Step";
export const CONTENT_OVERRIDE_CHANGE_LOG_ENTITY_TYPE: ChangeLogEntityTypeValue = "ContentOverride";

export const QUERYABLE_CHANGE_LOG_ENTITY_TYPES: readonly ChangeLogEntityTypeValue[] = [
  LEVEL_CHANGE_LOG_ENTITY_TYPE,
  MODULE_CHANGE_LOG_ENTITY_TYPE,
  LESSON_CHANGE_LOG_ENTITY_TYPE,
  STEP_CHANGE_LOG_ENTITY_TYPE,
] as const;
