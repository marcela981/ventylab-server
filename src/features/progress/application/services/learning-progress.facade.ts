/*
 * Funcionalidad: Fachada LearningProgressFacade
 * Descripción: API pública de progreso por páginas que exporta ProgressModule para otras features: getModuleProgress, getLevelProgress, getSectionProgress, getSummary e isUnlocked, delegando en sus casos de uso; y lecturas por lotes para analítica: getProgressForUsers (informe por sección, nivel y módulo de varios usuarios con un número fijo de lecturas), getLessonCompletionsOfUser (lecciones completadas en un rango) y getLastActivityForUsers (última actividad de aprendizaje de varios usuarios en una sola consulta). v1.3: getLessonAccess y assertLessonAccessible (orden obligatorio de lecciones con bypass de staff, para otras features como pages). v1.4: getContinueLearning (dónde retomar el estudio, para el resumen del usuario)
 * Versión: 1.4
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { CheckContentUnlockedUseCase } from "@/features/progress/application/use-cases/check-content-unlocked.usecase";
import { CheckLessonAccessUseCase } from "@/features/progress/application/use-cases/check-lesson-access.usecase";
import { GetContinueLearningUseCase } from "@/features/progress/application/use-cases/get-continue-learning.usecase";
import { GetLearningProgressSummaryUseCase } from "@/features/progress/application/use-cases/get-learning-progress-summary.usecase";
import { GetLevelLearningProgressUseCase } from "@/features/progress/application/use-cases/get-level-learning-progress.usecase";
import { GetModuleLearningProgressUseCase } from "@/features/progress/application/use-cases/get-module-learning-progress.usecase";
import { GetSectionLearningProgressUseCase } from "@/features/progress/application/use-cases/get-section-learning-progress.usecase";
import { LessonLockedError } from "@/features/progress/domain/progress.errors";
import {
  type ContentUnlockTarget,
  type ContinueLearningTarget,
  type LearningProgressReport,
  type LevelLearningProgress,
  type ModuleLearningProgress,
  type SectionLearningProgress,
} from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type LessonAccessDecision } from "@/features/progress/domain/read-models/lesson-access.read-model";
import {
  type IProgressAnalyticsRepository,
  type LessonCompletionActivity,
  type UserProgressLastActivity,
  PROGRESS_ANALYTICS_REPOSITORY_TOKEN,
  type UsersProgressSource,
} from "@/features/progress/domain/repositories/progress-analytics.repository";
import { buildLearningProgressReport } from "@/features/progress/domain/services/learning-progress-calculator";

export interface UserLearningProgress {
  readonly userId: string;
  readonly report: LearningProgressReport;
}

export interface ProgressActivityRange {
  readonly from: Date;
  readonly to: Date;
}

@Injectable()
export class LearningProgressFacade {
  public constructor(
    private readonly _getModuleLearningProgressUseCase: GetModuleLearningProgressUseCase,
    private readonly _getLevelLearningProgressUseCase: GetLevelLearningProgressUseCase,
    private readonly _getSectionLearningProgressUseCase: GetSectionLearningProgressUseCase,
    private readonly _getLearningProgressSummaryUseCase: GetLearningProgressSummaryUseCase,
    private readonly _checkContentUnlockedUseCase: CheckContentUnlockedUseCase,
    private readonly _checkLessonAccessUseCase: CheckLessonAccessUseCase,
    private readonly _getContinueLearningUseCase: GetContinueLearningUseCase,
    @Inject(PROGRESS_ANALYTICS_REPOSITORY_TOKEN)
    private readonly _analyticsRepository: IProgressAnalyticsRepository,
  ) {}

  public async getModuleProgress(userId: string, moduleId: string): Promise<ModuleLearningProgress> {
    return await this._getModuleLearningProgressUseCase.execute(userId, moduleId);
  }

  public async getLevelProgress(userId: string, levelId: string): Promise<LevelLearningProgress> {
    return await this._getLevelLearningProgressUseCase.execute(userId, levelId);
  }

  public async getSectionProgress(userId: string, sectionId: string): Promise<SectionLearningProgress> {
    return await this._getSectionLearningProgressUseCase.execute(userId, sectionId);
  }

  public async getSummary(userId: string): Promise<LearningProgressReport> {
    return await this._getLearningProgressSummaryUseCase.execute(userId);
  }

  public async getProgressForUsers(userIds: readonly string[]): Promise<UserLearningProgress[]> {
    const source: UsersProgressSource = await this._analyticsRepository.getProgressSourceForUsers(userIds);

    return [...source.factsByUser.entries()].map(
      ([userId, facts]: [string, LessonCompletionFact[]]): UserLearningProgress => ({ userId, report: buildLearningProgressReport(source.structure, facts) }),
    );
  }

  public async getLessonCompletionsOfUser(userId: string, range: ProgressActivityRange, limit: number): Promise<LessonCompletionActivity[]> {
    return await this._analyticsRepository.getLessonCompletionsOfUser(userId, range.from, range.to, limit);
  }

  public async getLastActivityForUsers(userIds: readonly string[]): Promise<UserProgressLastActivity[]> {
    return await this._analyticsRepository.getLastActivityForUsers(userIds);
  }

  public async isUnlocked(userId: string, target: ContentUnlockTarget): Promise<boolean> {
    return await this._checkContentUnlockedUseCase.execute(userId, target);
  }

  // The most recently accessed published lesson across modules, or undefined.
  public async getContinueLearning(userId: string): Promise<ContinueLearningTarget | undefined> {
    return await this._getContinueLearningUseCase.execute(userId);
  }

  // Undefined when the lesson does not exist or is not visible to the caller; staff (canManage) are always allowed.
  public async getLessonAccess(userId: string, lessonId: string, canManage: boolean): Promise<LessonAccessDecision | undefined> {
    return await this._checkLessonAccessUseCase.execute(userId, lessonId, canManage);
  }

  /**
   * @throws {LessonLockedError} If the lesson exists and the user may not open it yet
   */
  public async assertLessonAccessible(userId: string, lessonId: string, canManage: boolean): Promise<void> {
    const decision: LessonAccessDecision | undefined = await this.getLessonAccess(userId, lessonId, canManage);

    if (decision && !decision.allowed) {
      throw new LessonLockedError(decision);
    }
  }
}
