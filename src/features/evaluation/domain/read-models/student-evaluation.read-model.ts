/*
 * Funcionalidad: Modelos de lectura de evaluaciones del estudiante
 * Descripción: Vistas planas para el listado del estudiante: resumen de una evaluación sin respuestas (título, tipo, descripción, duración, intentos permitidos, número de preguntas) y resumen de cada intento propio (estado, fechas y nota, que solo se expone si está publicada)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAttemptStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export interface StudentEvaluationBriefView {
  readonly id: string;
  readonly title: string;
  readonly type: EvaluationTypeValue;
  readonly description?: string;
  readonly durationMinutes?: number;
  readonly maxAttempts: number;
  readonly questionCount: number;
  readonly showResultsImmediately: boolean;
}

export interface StudentAttemptSummaryView {
  readonly id: string;
  readonly evaluationId: string;
  readonly assignmentId?: string;
  readonly attemptNumber: number;
  readonly status: EvaluationAttemptStatusValue;
  readonly startedAt: Date;
  readonly submittedAt?: Date;
  readonly deadlineAt?: Date;
  readonly score?: number;
  readonly maxScore?: number;
  readonly grade?: number;
  readonly gradePublishedAt?: Date;
}
