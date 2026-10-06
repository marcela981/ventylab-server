/*
 * Funcionalidad: Modelos de lectura de asignaciones de evaluación
 * Descripción: Vistas planas de una asignación (evaluación, grupo, ventana, marca heredada y conteos de intentos por estado), datos mínimos del grupo destino para validar la activación y la regla pura de grupo asignable (STUDENT y activo)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-status";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export const ASSIGNABLE_GROUP_TYPE: string = "STUDENT";

export interface EvaluationAssignmentGroupTarget {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly isActive: boolean;
}

export interface EvaluationAssignmentAttemptCounts {
  readonly inProgress: number;
  readonly submitted: number;
  readonly pendingReview: number;
  readonly graded: number;
}

export interface EvaluationAssignmentView {
  readonly id: string;
  readonly evaluationId: string;
  readonly evaluationTitle: string;
  readonly evaluationType: EvaluationTypeValue;
  readonly evaluationStatus: EvaluationStatusValue;
  readonly groupId: string;
  readonly groupName: string;
  readonly startsAt: Date;
  readonly endsAt?: Date;
  readonly assignedById?: string;
  readonly legacyIsActive?: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly attemptCounts: EvaluationAssignmentAttemptCounts;
}

export function isAssignableGroup(group: EvaluationAssignmentGroupTarget): boolean {
  return group.type === ASSIGNABLE_GROUP_TYPE && group.isActive;
}
