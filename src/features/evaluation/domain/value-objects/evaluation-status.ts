/*
 * Funcionalidad: Estados de evaluación
 * Descripción: Valores DRAFT, READY y ARCHIVED de una evaluación y las transiciones permitidas (DRAFT↔READY y cualquiera hacia ARCHIVED, sin salida de ARCHIVED)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type EvaluationStatusValue = "DRAFT" | "READY" | "ARCHIVED";

export const DRAFT_EVALUATION_STATUS: EvaluationStatusValue = "DRAFT";
export const READY_EVALUATION_STATUS: EvaluationStatusValue = "READY";
export const ARCHIVED_EVALUATION_STATUS: EvaluationStatusValue = "ARCHIVED";

export const EVALUATION_STATUS_VALUES: readonly EvaluationStatusValue[] = [
  DRAFT_EVALUATION_STATUS,
  READY_EVALUATION_STATUS,
  ARCHIVED_EVALUATION_STATUS,
] as const;

const ALLOWED_TRANSITIONS: Readonly<Record<EvaluationStatusValue, readonly EvaluationStatusValue[]>> = {
  DRAFT: [READY_EVALUATION_STATUS, ARCHIVED_EVALUATION_STATUS],
  READY: [DRAFT_EVALUATION_STATUS, ARCHIVED_EVALUATION_STATUS],
  ARCHIVED: [],
};

export function isAllowedStatusTransition(from: EvaluationStatusValue, to: EvaluationStatusValue): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
