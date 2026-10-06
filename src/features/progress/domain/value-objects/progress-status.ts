/*
 * Funcionalidad: Estados de progreso de módulo
 * Descripción: Define los valores permitidos ProgressStatusValue, NOT_STARTED_PROGRESS_STATUS, IN_PROGRESS_PROGRESS_STATUS y COMPLETED_PROGRESS_STATUS del progreso por módulo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ProgressStatusValue = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export const NOT_STARTED_PROGRESS_STATUS: ProgressStatusValue = "NOT_STARTED";
export const IN_PROGRESS_PROGRESS_STATUS: ProgressStatusValue = "IN_PROGRESS";
export const COMPLETED_PROGRESS_STATUS: ProgressStatusValue = "COMPLETED";

export const PROGRESS_STATUS_VALUES: readonly ProgressStatusValue[] = [
  NOT_STARTED_PROGRESS_STATUS,
  IN_PROGRESS_PROGRESS_STATUS,
  COMPLETED_PROGRESS_STATUS,
] as const;
