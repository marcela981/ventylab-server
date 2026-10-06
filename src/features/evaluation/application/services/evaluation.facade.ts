/*
 * Funcionalidad: EvaluationFacade
 * Descripción: API pública de la feature de evaluaciones para otras features: notas publicadas de un usuario (incluidas las heredadas) y de un grupo con su aprobación según EVALUATION_PASSING_GRADE, estadísticas de una evaluación (intentos por estado, publicados, promedio, mínimo, máximo y tasa de aprobación sobre los intentos calificados) y conteo de intentos pendientes de revisión en el alcance de un profesor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { type EvaluationGradeStats, type EvaluationUserGrade } from "@/features/evaluation/application/results/evaluation-grading.result";
import { EvaluationAssignmentAccess } from "@/features/evaluation/application/services/evaluation-assignment-access";
import { type EvaluationGradeAggregateView, type PublishedGradeView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  EVALUATION_GRADING_REPOSITORY_TOKEN,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import { hasPassedEvaluation, roundTo } from "@/features/evaluation/domain/services/evaluation-attempt-grader";

const TEACHER_ROLE: string = "TEACHER";

@Injectable()
export class EvaluationFacade {
  public constructor(
    @Inject(EVALUATION_GRADING_REPOSITORY_TOKEN)
    private readonly _gradingRepository: IEvaluationGradingRepository,
    private readonly _assignmentAccess: EvaluationAssignmentAccess,
    @Inject(EVALUATION_GRADING_CONFIG_TOKEN)
    private readonly _gradingConfig: EvaluationGradingConfig,
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
    const view: EvaluationGradeAggregateView = await this._gradingRepository.getEvaluationStats(evaluationId, passingGrade);
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
      passRate: hasGrades ? roundTo(view.passedCount / view.gradedCount, 4) : undefined,
      passingGrade,
    };
  }

  public async getPendingReviewCount(teacherUserId: string): Promise<number> {
    const scope: EvaluationAssignmentScope | undefined = await this._assignmentAccess.scopeFor({ id: teacherUserId, role: TEACHER_ROLE });

    return await this._gradingRepository.countPendingReview(scope);
  }

  private _toUserGrade(view: PublishedGradeView): EvaluationUserGrade {
    return { ...view, passed: hasPassedEvaluation(view.grade, this._gradingConfig.passingGrade) };
  }
}
