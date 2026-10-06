/*
 * Funcionalidad: Modelos de lectura de la calificación docente de evaluaciones
 * Descripción: Vistas planas de la cola de revisión (intento, evaluación, estudiante, fechas y puntajes), de las notas publicadas (con título y tipo de la evaluación, incluidas las heredadas) y de los agregados de una evaluación (intentos por estado, publicados, calificados, promedio, mínimo, máximo y aprobados)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAttemptStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export interface GradingStudentView {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
}

export interface GradingQueueItemView {
  readonly attemptId: string;
  readonly evaluationId: string;
  readonly evaluationTitle: string;
  readonly evaluationType: EvaluationTypeValue;
  readonly assignmentId?: string;
  readonly attemptNumber: number;
  readonly student: GradingStudentView;
  readonly status: EvaluationAttemptStatusValue;
  readonly submittedAt?: Date;
  readonly score?: number;
  readonly maxScore?: number;
  readonly legacy: boolean;
}

export interface PublishedGradeView {
  readonly attemptId: string;
  readonly evaluationId: string;
  readonly evaluationTitle: string;
  readonly evaluationType: EvaluationTypeValue;
  readonly userId: string;
  readonly attemptNumber: number;
  readonly score?: number;
  readonly maxScore?: number;
  readonly grade: number;
  readonly publishedAt: Date;
  readonly legacy: boolean;
}

export interface EvaluationGradeAggregateView {
  readonly evaluationId: string;
  readonly attemptsByStatus: Readonly<Record<EvaluationAttemptStatusValue, number>>;
  readonly publishedCount: number;
  readonly gradedCount: number;
  readonly averageGrade?: number;
  readonly minGrade?: number;
  readonly maxGrade?: number;
  readonly passedCount: number;
}
