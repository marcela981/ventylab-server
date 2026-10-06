/*
 * Funcionalidad: Valores de estado de entrega
 * Descripción: Constantes del enum SubmissionStatus (DRAFT, SUBMITTED, GRADED, LATE) usadas en las transiciones de las entregas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type SubmissionStatusValue = "DRAFT" | "SUBMITTED" | "GRADED" | "LATE";

export const DRAFT_SUBMISSION_STATUS: SubmissionStatusValue = "DRAFT";
export const SUBMITTED_SUBMISSION_STATUS: SubmissionStatusValue = "SUBMITTED";
export const GRADED_SUBMISSION_STATUS: SubmissionStatusValue = "GRADED";
export const LATE_SUBMISSION_STATUS: SubmissionStatusValue = "LATE";

export const SUBMISSION_STATUS_VALUES: readonly SubmissionStatusValue[] = [
  DRAFT_SUBMISSION_STATUS,
  SUBMITTED_SUBMISSION_STATUS,
  GRADED_SUBMISSION_STATUS,
  LATE_SUBMISSION_STATUS,
] as const;
