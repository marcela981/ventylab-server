/*
 * Funcionalidad: Caso de uso GetLessonProgressUseCase
 * Descripción: Devuelve el progreso de una lección identificada por su id o por un id heredado del frontend; asegura el registro UserProgress del módulo y responde un estado inicial cuando el id no se puede resolver
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type LessonCompletionSnapshot, type LessonReference } from "@/features/progress/domain/read-models/progress-records.read-model";
import { type LessonProgressView } from "@/features/progress/domain/read-models/progress-views.read-model";
import {
  type IProgressQueriesRepository,
  PROGRESS_QUERIES_REPOSITORY_TOKEN,
} from "@/features/progress/domain/repositories/progress-queries.repository";
import { type IProgressRepository, PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/progress.repository";
import { toLessonProgressView } from "@/features/progress/domain/services/module-progress-calculator";

@Injectable()
export class GetLessonProgressUseCase {
  public constructor(
    @Inject(PROGRESS_REPOSITORY_TOKEN)
    private readonly _progressRepository: IProgressRepository,
    @Inject(PROGRESS_QUERIES_REPOSITORY_TOKEN)
    private readonly _progressQueriesRepository: IProgressQueriesRepository,
  ) {}

  public async execute(userId: string, lessonReference: string, moduleIdHint?: string): Promise<LessonProgressView> {
    const reference: LessonReference | undefined = await this._progressQueriesRepository.resolveLessonReference(lessonReference, moduleIdHint);

    if (!reference) {
      return toLessonProgressView(lessonReference, undefined);
    }

    await this._progressRepository.ensureModuleProgress(userId, reference.moduleId);

    const completion: LessonCompletionSnapshot | undefined = await this._progressRepository.getLessonCompletion(userId, reference.lessonId);

    return toLessonProgressView(lessonReference, completion);
  }
}
