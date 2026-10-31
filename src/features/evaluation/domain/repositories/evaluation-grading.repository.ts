/*
 * Funcionalidad: Repositorio de lectura de la calificación docente de evaluaciones
 * Descripción: Contrato de las consultas de calificación: cola paginada de intentos PENDING_REVIEW (por evaluación, grupo o estudiante) y su conteo, intentos en curso vencidos (acotados) para el cierre perezoso, pertenencia de un intento al alcance de un profesor (grupos STUDENT creados o supervisados por la asignación; intentos heredados sin asignación solo si el profesor creó la evaluación), intentos GRADED sin publicar, notas publicadas de un usuario (opcionalmente en el alcance de un profesor) o de un grupo, agregados de una evaluación (opcionalmente acotados al alcance de intentos de un profesor) y conteo de pendientes de revisión en un alcance
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Paginated } from "@/common/domain/utils/paginated";
import {
  type AttemptStatusCountsView,
  type EvaluationGradeAggregateView,
  type GradingAttemptListItemView,
  type GradingQueueItemView,
  type PublishedGradeView,
} from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAttemptScope } from "@/features/evaluation/domain/repositories/evaluation-analytics.repository";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import { type EvaluationAttemptStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";

export const EVALUATION_GRADING_REPOSITORY_TOKEN: unique symbol = Symbol("EVALUATION_GRADING_REPOSITORY_TOKEN");

export interface GradingAttemptFilter {
  readonly evaluationId?: string;
  readonly groupId?: string;
  readonly studentId?: string;
  readonly scope?: EvaluationAssignmentScope;
}

export interface GetGradingQueueQuery extends GradingAttemptFilter {
  readonly page: number;
  readonly limit: number;
}

export interface GetGradingAttemptsQuery extends GradingAttemptFilter {
  readonly statuses?: ReadonlyArray<EvaluationAttemptStatusValue>;
  readonly page: number;
  readonly limit: number;
}

export interface GradingAttemptKey {
  readonly id: string;
  readonly evaluationId: string;
  readonly userId: string;
}

export interface IEvaluationGradingRepository {
  getQueue(query: GetGradingQueueQuery): Promise<Paginated<GradingQueueItemView>>;
  countQueue(filter: GradingAttemptFilter): Promise<number>;
  // New-flow attempts only (legacy attempts are excluded), whatever their status
  getAttempts(query: GetGradingAttemptsQuery): Promise<Paginated<GradingAttemptListItemView>>;
  countAttemptsByStatus(filter: GradingAttemptFilter): Promise<AttemptStatusCountsView>;
  getExpiredInProgressAttemptIds(filter: GradingAttemptFilter, cutoff: Date, limit: number): Promise<string[]>;
  isAttemptInScope(attemptId: string, scope: EvaluationAssignmentScope): Promise<boolean>;
  getPublishableAttempts(filter: GradingAttemptFilter): Promise<GradingAttemptKey[]>;
  getPublishedGradesOfUser(userId: string, scope?: EvaluationAssignmentScope): Promise<PublishedGradeView[]>;
  getPublishedGradesOfGroup(groupId: string, evaluationId?: string): Promise<PublishedGradeView[]>;
  getEvaluationStats(evaluationId: string, passingGrade: number, scope?: EvaluationAttemptScope): Promise<EvaluationGradeAggregateView>;
  countPendingReview(scope?: EvaluationAssignmentScope): Promise<number>;
}
