/*
 * Funcionalidad: Caso de uso GetProgressOverviewUseCase
 * Descripción: Arma el resumen general de progreso del usuario sobre los módulos publicados del track por defecto, con la completitud por páginas (hechos de completitud) y los registros de LessonCompletion para las fechas de acceso; XP, nivel y racha salen de GetGamificationStatsUseCase (registro de actividad, una sola fórmula)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { DEFAULT_LEVEL_TRACK_VALUE } from "@/features/levels/domain/value-objects/level-track";
import { GetGamificationStatsUseCase } from "@/features/progress/application/use-cases/get-gamification-stats.usecase";
import { type GamificationStats } from "@/features/progress/domain/read-models/gamification.read-model";
import { type LessonCompletionSnapshot, type OverviewModuleSource } from "@/features/progress/domain/read-models/progress-records.read-model";
import { type ProgressOverview } from "@/features/progress/domain/read-models/progress-views.read-model";
import { type ILearningProgressRepository, LEARNING_PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-progress.repository";
import {
  type IProgressQueriesRepository,
  PROGRESS_QUERIES_REPOSITORY_TOKEN,
} from "@/features/progress/domain/repositories/progress-queries.repository";
import { type IProgressRepository, PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/progress.repository";
import { buildProgressOverview } from "@/features/progress/domain/services/progress-overview-builder";

@Injectable()
export class GetProgressOverviewUseCase {
  public constructor(
    @Inject(PROGRESS_REPOSITORY_TOKEN)
    private readonly _progressRepository: IProgressRepository,
    @Inject(PROGRESS_QUERIES_REPOSITORY_TOKEN)
    private readonly _progressQueriesRepository: IProgressQueriesRepository,
    @Inject(LEARNING_PROGRESS_REPOSITORY_TOKEN)
    private readonly _learningProgressRepository: ILearningProgressRepository,
    private readonly _getGamificationStatsUseCase: GetGamificationStatsUseCase,
  ) {}

  public async execute(userId: string): Promise<ProgressOverview> {
    const modules: OverviewModuleSource[] = await this._progressQueriesRepository.getOverviewModules(DEFAULT_LEVEL_TRACK_VALUE);
    const lessonIds: string[] = modules.flatMap((module: OverviewModuleSource) => module.lessonIds);

    const [facts, completions, gamification]: [LessonCompletionFact[], LessonCompletionSnapshot[], GamificationStats] = await Promise.all([
      this._learningProgressRepository.getLessonFacts(userId, lessonIds),
      this._progressRepository.getLessonCompletions(userId, lessonIds),
      this._getGamificationStatsUseCase.execute(userId),
    ]);

    return buildProgressOverview({ modules, facts, completions, gamification });
  }
}
