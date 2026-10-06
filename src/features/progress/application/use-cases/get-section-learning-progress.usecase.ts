/*
 * Funcionalidad: Caso de uso GetSectionLearningProgressUseCase
 * Descripción: Calcula el progreso de una sección publicada para un usuario ponderado por lecciones, con el progreso de cada nivel publicado de la sección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type LearningProgressReport,
  type SectionLearningProgress,
  type ProgressSource,
} from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type ILearningProgressRepository, LEARNING_PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-progress.repository";
import { buildLearningProgressReport } from "@/features/progress/domain/services/learning-progress-calculator";
import { SectionNotFoundError } from "@/features/sections/domain/sections.errors";

/**
 * @throws {SectionNotFoundError} If the section does not exist or is not published with published ancestors
 */
@Injectable()
export class GetSectionLearningProgressUseCase {
  public constructor(
    @Inject(LEARNING_PROGRESS_REPOSITORY_TOKEN)
    private readonly _learningProgressRepository: ILearningProgressRepository,
  ) {}

  public async execute(userId: string, sectionId: string): Promise<SectionLearningProgress> {
    const source: ProgressSource | undefined = await this._learningProgressRepository.getProgressSource(userId, { type: "section", id: sectionId });
    const report: LearningProgressReport | undefined = source ? buildLearningProgressReport(source.structure, source.facts) : undefined;
    const progress: SectionLearningProgress | undefined = report?.sections[0];

    if (!progress) {
      throw new SectionNotFoundError();
    }

    return progress;
  }
}
