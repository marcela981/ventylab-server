/*
 * Funcionalidad: Caso de uso GetLevelLearningProgressUseCase
 * Descripción: Calcula el progreso de un nivel publicado para un usuario ponderado por lecciones (lecciones completadas del nivel sobre lecciones del nivel, no el promedio de módulos), con el progreso de cada módulo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { LevelNotFoundError } from "@/features/levels/domain/levels.errors";
import {
  type LearningProgressReport,
  type LevelLearningProgress,
  type ProgressSource,
} from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type ILearningProgressRepository, LEARNING_PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-progress.repository";
import { buildLearningProgressReport } from "@/features/progress/domain/services/learning-progress-calculator";

/**
 * @throws {LevelNotFoundError} If the level does not exist or is not published with published ancestors
 */
@Injectable()
export class GetLevelLearningProgressUseCase {
  public constructor(
    @Inject(LEARNING_PROGRESS_REPOSITORY_TOKEN)
    private readonly _learningProgressRepository: ILearningProgressRepository,
  ) {}

  public async execute(userId: string, levelId: string): Promise<LevelLearningProgress> {
    const source: ProgressSource | undefined = await this._learningProgressRepository.getProgressSource(userId, { type: "level", id: levelId });
    const report: LearningProgressReport | undefined = source ? buildLearningProgressReport(source.structure, source.facts) : undefined;
    const progress: LevelLearningProgress | undefined = report?.levels[0];

    if (!progress) {
      throw new LevelNotFoundError();
    }

    return progress;
  }
}
