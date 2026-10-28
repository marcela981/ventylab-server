/*
 * Funcionalidad: Caso de uso GetContinueLearningUseCase
 * Descripción: Devuelve dónde retomar el estudio: la lección a la que el usuario accedió más recientemente entre todos sus módulos (UserProgress.lastAccessedLessonId y lastAccessedAt), solo si la lección y su módulo siguen publicados, con el porcentaje de completitud del módulo calculado con la regla de completitud por páginas; undefined si no hay ninguna
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ContinueLearningTarget, type ProgressSource } from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type ILearningProgressRepository, LEARNING_PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-progress.repository";
import {
  type IProgressAnalyticsRepository,
  type LastAccessedLesson,
  PROGRESS_ANALYTICS_REPOSITORY_TOKEN,
} from "@/features/progress/domain/repositories/progress-analytics.repository";
import { buildLearningProgressReport } from "@/features/progress/domain/services/learning-progress-calculator";

@Injectable()
export class GetContinueLearningUseCase {
  public constructor(
    @Inject(PROGRESS_ANALYTICS_REPOSITORY_TOKEN)
    private readonly _analyticsRepository: IProgressAnalyticsRepository,
    @Inject(LEARNING_PROGRESS_REPOSITORY_TOKEN)
    private readonly _learningProgressRepository: ILearningProgressRepository,
  ) {}

  public async execute(userId: string): Promise<ContinueLearningTarget | undefined> {
    const last: LastAccessedLesson | undefined = await this._analyticsRepository.getLastAccessedLesson(userId);

    if (!last) {
      return undefined;
    }

    const source: ProgressSource | undefined = await this._learningProgressRepository.getProgressSource(userId, { type: "module", id: last.moduleId });
    const percent: number | undefined = source ? buildLearningProgressReport(source.structure, source.facts).modules[0]?.percentage : undefined;

    // The module stopped being published between both reads: nothing to continue.
    if (percent === undefined) {
      return undefined;
    }

    return { ...last, percent };
  }
}
