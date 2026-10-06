/*
 * Funcionalidad: Estado derivado de asignaciones de evaluación
 * Descripción: Valores UPCOMING, ACTIVE y CLOSED calculados en lectura a partir de la ventana [startsAt, endsAt] y la marca heredada legacyIsActive (sin tareas programadas), y detección de ventanas solapadas para un mismo grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type EvaluationAssignmentStateValue = "UPCOMING" | "ACTIVE" | "CLOSED";

export const UPCOMING_ASSIGNMENT_STATE: EvaluationAssignmentStateValue = "UPCOMING";
export const ACTIVE_ASSIGNMENT_STATE: EvaluationAssignmentStateValue = "ACTIVE";
export const CLOSED_ASSIGNMENT_STATE: EvaluationAssignmentStateValue = "CLOSED";

export const EVALUATION_ASSIGNMENT_STATE_VALUES: readonly EvaluationAssignmentStateValue[] = [
  UPCOMING_ASSIGNMENT_STATE,
  ACTIVE_ASSIGNMENT_STATE,
  CLOSED_ASSIGNMENT_STATE,
] as const;

export interface EvaluationAssignmentWindow {
  readonly startsAt: Date;
  readonly endsAt?: Date;
  readonly legacyIsActive?: boolean;
}

export function deriveEvaluationAssignmentState(window: EvaluationAssignmentWindow, now: Date): EvaluationAssignmentStateValue {
  if (window.legacyIsActive === false) {
    return CLOSED_ASSIGNMENT_STATE;
  }

  // The end is checked before the start so an upcoming assignment closed early never reopens
  if (window.endsAt !== undefined && now.getTime() > window.endsAt.getTime()) {
    return CLOSED_ASSIGNMENT_STATE;
  }

  if (now.getTime() < window.startsAt.getTime()) {
    return UPCOMING_ASSIGNMENT_STATE;
  }

  return ACTIVE_ASSIGNMENT_STATE;
}

export function evaluationAssignmentWindowsOverlap(left: EvaluationAssignmentWindow, right: EvaluationAssignmentWindow): boolean {
  if (left.legacyIsActive === false || right.legacyIsActive === false) {
    return false;
  }

  const leftEnd: number = left.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightEnd: number = right.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;

  return left.startsAt.getTime() < rightEnd && right.startsAt.getTime() < leftEnd;
}
