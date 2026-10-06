/*
 * Funcionalidad: Caso de uso GetLessonStepsUseCase
 * Descripción: Ejecuta la operación GetLessonSteps de la feature de lecciones; depende de ILessonQueriesRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ContentStatusChain, isContentVisible } from "@/features/curriculum/domain/services/content-visibility";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type LessonStepItem } from "@/features/lessons/domain/read-models/lesson-views.read-model";
import { type ILessonQueriesRepository, LESSON_QUERIES_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lesson-queries.repository";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist or is not visible to the reader
 */
@Injectable()
export class GetLessonStepsUseCase {
  public constructor(
    @Inject(LESSON_QUERIES_REPOSITORY_TOKEN)
    private readonly _lessonQueriesRepository: ILessonQueriesRepository,
  ) {}

  public async execute(lessonId: string, includeInactive: boolean, canManage: boolean): Promise<LessonStepItem[]> {
    const chain: ContentStatusChain | undefined = await this._lessonQueriesRepository.getStatusChain(lessonId);

    if (!chain || !isContentVisible(canManage, chain)) {
      throw new LessonNotFoundError();
    }

    const steps: LessonStepItem[] | undefined = await this._lessonQueriesRepository.getSteps(lessonId, includeInactive);

    if (!steps) {
      throw new LessonNotFoundError();
    }

    return steps;
  }
}
