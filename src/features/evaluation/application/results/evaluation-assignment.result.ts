/*
 * Funcionalidad: Resultado de asignaciones de evaluación
 * Descripción: Vista de una asignación enriquecida con su estado visible derivado en el instante de la consulta (UPCOMING, ACTIVE o CLOSED)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAssignmentView } from "@/features/evaluation/domain/read-models/evaluation-assignment.read-model";
import {
  deriveEvaluationAssignmentState,
  type EvaluationAssignmentStateValue,
} from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";

export interface EvaluationAssignmentResult extends EvaluationAssignmentView {
  readonly state: EvaluationAssignmentStateValue;
}

export function withAssignmentState(view: EvaluationAssignmentView, now: Date): EvaluationAssignmentResult {
  return { ...view, state: deriveEvaluationAssignmentState(view, now) };
}
