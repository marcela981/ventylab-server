/*
 * Funcionalidad: Caso de uso GetLearningProgressSummaryUseCase
 * Descripción: Calcula el resumen de progreso de un usuario sobre todo el contenido publicado: total ponderado por lecciones y progreso de cada sección, nivel y módulo publicados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type LearningProgressReport, type ProgressSource } from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type ILearningProgressRepository, LEARNING_PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-progress.repository";
import { buildLearningProgressReport } from "@/features/progress/domain/services/learning-progress-calculator";

@Injectable()
export class GetLearningProgressSummaryUseCase {
  public constructor(
    @Inject(LEARNING_PROGRESS_REPOSITORY_TOKEN)
    private readonly _learningProgressRepository: ILearningProgressRepository,
  ) {}

  public async execute(userId: string): Promise<LearningProgressReport> {
    const source: ProgressSource | undefined = await this._learningProgressRepository.getProgressSource(userId, { type: "all" });

    return buildLearningProgressReport(source?.structure ?? { sections: [], levels: [], modules: [] }, source?.facts ?? []);
  }
}
