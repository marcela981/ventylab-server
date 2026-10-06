/*
 * Funcionalidad: Objeto de valor change-log-action
 * Descripción: Define los valores permitidos ChangeLogActionValue, CREATE_CHANGE_LOG_ACTION, UPDATE_CHANGE_LOG_ACTION, DELETE_CHANGE_LOG_ACTION, REORDER_CHANGE_LOG_ACTION, CHANGE_LOG_ACTION_VALUES de la feature de historial de cambios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ChangeLogActionValue = "create" | "update" | "delete" | "reorder";

export const CREATE_CHANGE_LOG_ACTION: ChangeLogActionValue = "create";
export const UPDATE_CHANGE_LOG_ACTION: ChangeLogActionValue = "update";
export const DELETE_CHANGE_LOG_ACTION: ChangeLogActionValue = "delete";
export const REORDER_CHANGE_LOG_ACTION: ChangeLogActionValue = "reorder";

export const CHANGE_LOG_ACTION_VALUES: readonly ChangeLogActionValue[] = [
  CREATE_CHANGE_LOG_ACTION,
  UPDATE_CHANGE_LOG_ACTION,
  DELETE_CHANGE_LOG_ACTION,
  REORDER_CHANGE_LOG_ACTION,
] as const;
