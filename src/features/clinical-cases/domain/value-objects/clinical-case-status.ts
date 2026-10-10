/*
 * Funcionalidad: Valores de estado de caso clínico
 * Descripción: Constantes del enum ClinicalCaseStatus (DRAFT, PUBLISHED, ARCHIVED); el estado es la fuente de verdad y deriva la columna heredada isActive
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ClinicalCaseStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export const DRAFT_STATUS_VALUE: ClinicalCaseStatusValue = "DRAFT";
export const PUBLISHED_STATUS_VALUE: ClinicalCaseStatusValue = "PUBLISHED";
export const ARCHIVED_STATUS_VALUE: ClinicalCaseStatusValue = "ARCHIVED";

export const CLINICAL_CASE_STATUS_VALUES: readonly ClinicalCaseStatusValue[] = [DRAFT_STATUS_VALUE, PUBLISHED_STATUS_VALUE, ARCHIVED_STATUS_VALUE] as const;

export function isLegacyActiveStatus(status: ClinicalCaseStatusValue): boolean {
  return status === PUBLISHED_STATUS_VALUE;
}
