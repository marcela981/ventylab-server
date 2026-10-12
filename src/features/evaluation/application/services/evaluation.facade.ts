/*
 * Funcionalidad: EvaluationFacade
 * Descripción: API pública de la feature de evaluaciones para otras features: notas publicadas de un usuario (incluidas las heredadas) y de un grupo con su aprobación según EVALUATION_PASSING_GRADE, estadísticas de una evaluación (intentos por estado, publicados, promedio, mediana, mínimo, máximo, histograma en intervalos de 0.5 y tasa de aprobación sobre los intentos calificados), conteo de intentos pendientes de revisión en el alcance de un profesor y lecturas para analítica: notas publicadas de varios usuarios en una consulta, índice de dificultad por pregunta, referencia de una evaluación con sus grupos asignados, intentos de un usuario en un rango y asignaciones activas y próximas de un estudiante
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { type EvaluationAssignmentResult } from "@/features/evaluation/application/results/evaluation-assignment.result";
import { type EvaluationGradeStats, type EvaluationUserGrade } from "@/features/evaluation/application/results/evaluation-grading.result";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { GetStudentEvaluationAssignmentsUseCase } from "@/features/evaluation/application/use-cases/get-student-evaluation-assignments.usecase";
import { type EvaluationGradeAggregateView, type PublishedGradeView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import {
  EVALUATION_ANALYTICS_REPOSITORY_TOKEN,
  type EvaluationAttemptActivityView,
  type EvaluationQuestionScoreSource,
  type EvaluationReferenceView,
  type IEvaluationAnalyticsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-analytics.repository";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  EVALUATION_GRADING_REPOSITORY_TOKEN,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import { buildGradeHistogram, computeQuestionStats, type EvaluationQuestionStats, medianOf } from "@/features/evaluation/domain/services/evaluation-analytics";
import { hasPassedEvaluation, roundTo } from "@/features/evaluation/domain/services/evaluation-attempt-grader";
import {
  ACTIVE_ASSIGNMENT_STATE,
  UPCOMING_ASSIGNMENT_STATE,
} from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";

const TEACHER_ROLE: string = "TEACHER";

export interface EvaluationActivityRange {
  readonly from: Date;
  readonly to: Date;
}

@Injectable()
export class EvaluationFacade {
  public constructor(
    @Inject(EVALUATION_GRADING_REPOSITORY_TOKEN)
    private readonly _gradingRepository: IEvaluationGradingRepository,
    private readonly _assignmentAccess: EvaluationAssignmentAccess,
    @Inject(EVALUATION_GRADING_CONFIG_TOKEN)
    private readonly _gradingConfig: EvaluationGradingConfig,
    @Inject(EVALUATION_ANALYTICS_REPOSITORY_TOKEN)
    private readonly _analyticsRepository: IEvaluationAnalyticsRepository,
    private readonly _getStudentAssignmentsUseCase: GetStudentEvaluationAssignmentsUseCase,
  ) {}

  public async getUserGrades(userId: string): Promise<EvaluationUserGrade[]> {
    const views: PublishedGradeView[] = await this._gradingRepository.getPublishedGradesOfUser(userId);

    return views.map((view: PublishedGradeView) => this._toUserGrade(view));
  }

  public async getGroupGrades(groupId: string, evaluationId?: string): Promise<EvaluationUserGrade[]> {
    const views: PublishedGradeView[] = await this._gradingRepository.getPublishedGradesOfGroup(groupId, evaluationId);

    return views.map((view: PublishedGradeView) => this._toUserGrade(view));
  }

  public async getEvaluationStats(evaluationId: string): Promise<EvaluationGradeStats> {
    const passingGrade: number = this._gradingConfig.passingGrade;
    const [view, grades]: [EvaluationGradeAggregateView, number[]] = await Promise.all([
      this._gradingRepository.getEvaluationStats(evaluationId, passingGrade),
      this._analyticsRepository.getGradedGrades(evaluationId),
    ]);
    const totalAttempts: number = Object.values(view.attemptsByStatus).reduce((total: number, count: number) => total + count, 0);
    const hasGrades: boolean = view.gradedCount > 0;

    return {
      evaluationId: view.evaluationId,
      attemptsByStatus: view.attemptsByStatus,
      totalAttempts,
      publishedCount: view.publishedCount,
      gradedCount: view.gradedCount,
      averageGrade: hasGrades && view.averageGrade !== undefined ? roundTo(view.averageGrade, 2) : undefined,
      minGrade: hasGrades ? view.minGrade : undefined,
      maxGrade: hasGrades ? view.maxGrade : undefined,
      medianGrade: medianOf(grades),
      histogram: buildGradeHistogram(grades),
      passRate: hasGrades ? roundTo(view.passedCount / view.gradedCount, 4) : undefined,
      passingGrade,
    };
  }

  public async getPendingReviewCount(teacherUserId: string): Promise<number> {
    const scope: EvaluationAssignmentScope | undefined = await this._assignmentAccess.scopeFor({ id: teacherUserId, role: TEACHER_ROLE });

    return await this._gradingRepository.countPendingReview(scope);
  }

  public async getGradesForUsers(userIds: readonly string[], evaluationIds?: readonly string[]): Promise<EvaluationUserGrade[]> {
    const views: PublishedGradeView[] = await this._analyticsRepository.getPublishedGradesOfUsers(userIds, evaluationIds);

    return views.map((view: PublishedGradeView) => this._toUserGrade(view));
  }

  public async getEvaluationQuestionStats(evaluationId: string): Promise<EvaluationQuestionStats[]> {
    const source: EvaluationQuestionScoreSource = await this._analyticsRepository.getQuestionScoreSource(evaluationId);

    return computeQuestionStats(source);
  }

  public async getEvaluationReference(evaluationId: string): Promise<EvaluationReferenceView | undefined> {
    return await this._analyticsRepository.getEvaluationReference(evaluationId);
  }

  public async getAttemptActivityOfUser(userId: string, range: EvaluationActivityRange, limit: number): Promise<EvaluationAttemptActivityView[]> {
    return await this._analyticsRepository.getAttemptActivityOfUser(userId, range.from, range.to, limit);
  }

  public async getOpenAssignmentsOfStudent(userId: string): Promise<EvaluationAssignmentResult[]> {
    const assignments: EvaluationAssignmentResult[] = await this._getStudentAssignmentsUseCase.execute(userId);

    return assignments.filter(
      (assignment: EvaluationAssignmentResult) => assignment.state === ACTIVE_ASSIGNMENT_STATE || assignment.state === UPCOMING_ASSIGNMENT_STATE,
    );
  }

  private _toUserGrade(view: PublishedGradeView): EvaluationUserGrade {
    return { ...view, passed: hasPassedEvaluation(view.grade, this._gradingConfig.passingGrade) };
  }
}
