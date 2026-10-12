/*
 * Funcionalidad: Puerto de repositorio EVALUATION_ANALYTICS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IEvaluationAnalyticsRepository de lecturas por lotes para analítica (notas publicadas de varios usuarios, notas de los intentos calificados de una evaluación, preguntas con los puntajes obtenidos en esos intentos, referencia de una evaluación con sus grupos asignados e intentos de un usuario en un rango), sus modelos de lectura y su token de inyección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PublishedGradeView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAttemptStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";
import { type EvaluationQuestionTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-question-type";
import { type EvaluationTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-type";

export const EVALUATION_ANALYTICS_REPOSITORY_TOKEN: unique symbol = Symbol("EVALUATION_ANALYTICS_REPOSITORY_TOKEN");

export interface EvaluationReferenceView {
  readonly id: string;
  readonly title: string;
  readonly type: EvaluationTypeValue;
  readonly assignedGroupIds: string[];
}

export interface EvaluationQuestionItemView {
  readonly id: string;
  readonly order: number;
  readonly type: EvaluationQuestionTypeValue;
  readonly points: number;
}

export interface EvaluationAnswerScoreView {
  readonly questionId: string;
  readonly earned?: number;
}

export interface EvaluationQuestionScoreSource {
  readonly questions: EvaluationQuestionItemView[];
  readonly gradedAttemptCount: number;
  readonly answers: EvaluationAnswerScoreView[];
}

export interface EvaluationAttemptActivityView {
  readonly attemptId: string;
  readonly evaluationId: string;
  readonly evaluationTitle: string;
  readonly status: EvaluationAttemptStatusValue;
  readonly startedAt: Date;
  readonly submittedAt?: Date;
  readonly publishedGrade?: number;
}

export interface IEvaluationAnalyticsRepository {
  getPublishedGradesOfUsers(userIds: readonly string[], evaluationIds?: readonly string[]): Promise<PublishedGradeView[]>;
  getGradedGrades(evaluationId: string): Promise<number[]>;
  getQuestionScoreSource(evaluationId: string): Promise<EvaluationQuestionScoreSource>;
  getEvaluationReference(evaluationId: string): Promise<EvaluationReferenceView | undefined>;
  getAttemptActivityOfUser(userId: string, from: Date, to: Date, limit: number): Promise<EvaluationAttemptActivityView[]>;
}
