/*
 * Funcionalidad: Caso de uso GetModuleProgressSummaryUseCase
 * Descripción: Devuelve el progreso agregado de un módulo: desde UserProgress cuando ya tiene contadores, calculado en tiempo real con la regla de completitud por páginas (y persistido) en la primera visita, o agregado cuando el id es un módulo compuesto del currículo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type LessonCompletionSnapshot,
  type ModuleCounters,
  type ModuleLessonSource,
  type ModuleProgressSnapshot,
} from "@/features/progress/domain/read-models/progress-records.read-model";
import { type LessonProgressView, type ModuleProgressSummary } from "@/features/progress/domain/read-models/progress-views.read-model";
import {
  type IProgressQueriesRepository,
  PROGRESS_QUERIES_REPOSITORY_TOKEN,
} from "@/features/progress/domain/repositories/progress-queries.repository";
import { type IProgressRepository, PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/progress.repository";
import { computeCompositeModuleSummary, getCompositeSubModuleIds } from "@/features/progress/domain/services/composite-modules";
import { computeModuleCounters, toLessonProgressView } from "@/features/progress/domain/services/module-progress-calculator";

@Injectable()
export class GetModuleProgressSummaryUseCase {
  public constructor(
    @Inject(PROGRESS_REPOSITORY_TOKEN)
    private readonly _progressRepository: IProgressRepository,
    @Inject(PROGRESS_QUERIES_REPOSITORY_TOKEN)
    private readonly _progressQueriesRepository: IProgressQueriesRepository,
  ) {}

  public async execute(userId: string, moduleId: string): Promise<ModuleProgressSummary> {
    const isActiveModule: boolean = await this._progressQueriesRepository.isActiveModule(moduleId);

    if (!isActiveModule) {
      return await this._getCompositeOrEmptySummary(userId, moduleId);
    }

    const stored: ModuleProgressSnapshot | undefined = await this._progressRepository.getModuleProgress(userId, moduleId);

    if (stored && stored.totalLessons > 0) {
      return {
        moduleId,
        totalLessons: stored.totalLessons,
        completedLessons: stored.completedLessonsCount,
        completionPercentage: stored.progressPercentage,
        isModuleCompleted: stored.isModuleCompleted,
        timeSpent: stored.timeSpent,
        completedAt: stored.completedAt,
        lessons: [],
        source: "user_progress",
      };
    }

    return await this._calculateRealtimeSummary(userId, moduleId);
  }

  private async _calculateRealtimeSummary(userId: string, moduleId: string): Promise<ModuleProgressSummary> {
    const progress: ModuleProgressSnapshot = await this._progressRepository.ensureModuleProgress(userId, moduleId);
    const lessonIds: string[] = await this._progressQueriesRepository.getActiveLessonIds(moduleId);
    const completions: LessonCompletionSnapshot[] = await this._progressRepository.getLessonCompletions(userId, lessonIds);

    const completionByLesson: Map<string, LessonCompletionSnapshot> = new Map(
      completions.map((completion: LessonCompletionSnapshot): [string, LessonCompletionSnapshot] => [completion.lessonId, completion]),
    );

    const lessons: LessonProgressView[] = lessonIds.map((lessonId: string) => toLessonProgressView(lessonId, completionByLesson.get(lessonId)));
    const counters: ModuleCounters = (await this._progressRepository.refreshModuleCounters({ userId, moduleId })) ?? computeModuleCounters(0, 0);

    return {
      moduleId,
      totalLessons: counters.totalLessons,
      completedLessons: counters.completedLessonsCount,
      completionPercentage: counters.progressPercentage,
      isModuleCompleted: counters.isModuleCompleted,
      timeSpent: progress.timeSpent,
      completedAt: progress.completedAt,
      lessons,
      source: "realtime_calculation",
    };
  }

  private async _getCompositeOrEmptySummary(userId: string, moduleId: string): Promise<ModuleProgressSummary> {
    const subModuleIds: string[] | undefined = getCompositeSubModuleIds(moduleId);

    if (!subModuleIds) {
      return {
        moduleId,
        totalLessons: 0,
        completedLessons: 0,
        completionPercentage: 0,
        isModuleCompleted: false,
        timeSpent: 0,
        lessons: [],
        source: "not_found",
      };
    }

    const [progresses, lessons]: [ModuleProgressSnapshot[], ModuleLessonSource[]] = await Promise.all([
      this._progressRepository.getModuleProgresses(userId, subModuleIds),
      this._progressQueriesRepository.getActiveLessonsByModules(subModuleIds),
    ]);

    const completions: LessonCompletionSnapshot[] = await this._progressRepository.getLessonCompletions(
      userId,
      lessons.map((lesson: ModuleLessonSource) => lesson.id),
    );

    return computeCompositeModuleSummary({ moduleId, subModuleIds, progresses, lessons, completions });
  }
}
