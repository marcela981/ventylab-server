/*
 * Funcionalidad: Modelos de lectura de evaluaciones
 * Descripción: Vistas planas del listado de gestión de evaluaciones (resumen con conteos y autor) y conteos de uso (intentos, intentos entregados que bloquean la estructura y asignaciones)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-status";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export interface EvaluationSummaryView {
  readonly id: string;
  readonly type: EvaluationTypeValue;
  readonly title: string;
  readonly status: EvaluationStatusValue;
  readonly moduleId?: string;
  readonly levelId?: string;
  readonly lessonId?: string;
  readonly durationMinutes?: number;
  readonly maxAttempts: number;
  readonly showResultsImmediately: boolean;
  readonly createdById?: string;
  readonly createdByName?: string;
  readonly legacySource?: string;
  readonly questionCount: number;
  readonly scenarioCount: number;
  readonly assignmentCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface EvaluationUsage {
  readonly attempts: number;
  readonly submittedAttempts: number;
  readonly assignments: number;
}
