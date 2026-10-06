/*
 * Funcionalidad: Caso de uso GetModuleLearningProgressUseCase
 * Descripción: Calcula el progreso ponderado por lecciones de un módulo publicado para un usuario (lecciones completadas sobre lecciones publicadas, con el detalle de páginas vistas por lección)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import {
  type LearningProgressReport,
  type ModuleLearningProgress,
  type ProgressSource,
} from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type ILearningProgressRepository, LEARNING_PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-progress.repository";
import { buildLearningProgressReport } from "@/features/progress/domain/services/learning-progress-calculator";

/**
 * @throws {ModuleNotFoundError} If the module does not exist or is not published with published ancestors
 */
@Injectable()
export class GetModuleLearningProgressUseCase {
  public constructor(
    @Inject(LEARNING_PROGRESS_REPOSITORY_TOKEN)
    private readonly _learningProgressRepository: ILearningProgressRepository,
  ) {}

  public async execute(userId: string, moduleId: string): Promise<ModuleLearningProgress> {
    const source: ProgressSource | undefined = await this._learningProgressRepository.getProgressSource(userId, { type: "module", id: moduleId });
    const report: LearningProgressReport | undefined = source ? buildLearningProgressReport(source.structure, source.facts) : undefined;
    const progress: ModuleLearningProgress | undefined = report?.modules[0];

    if (!progress) {
      throw new ModuleNotFoundError();
    }

    return progress;
  }
}
