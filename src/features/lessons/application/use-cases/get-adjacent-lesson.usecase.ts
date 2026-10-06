/*
 * Funcionalidad: Caso de uso GetAdjacentLessonUseCase
 * Descripción: Ejecuta la operación GetAdjacentLesson de la feature de lecciones; depende de ILessonQueriesRepository, ILessonRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { isContentVisible } from "@/features/curriculum/domain/services/content-visibility";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type LessonNeighbor } from "@/features/lessons/domain/read-models/lesson-views.read-model";
import {
  type ILessonQueriesRepository,
  LESSON_QUERIES_REPOSITORY_TOKEN,
  type LessonNeighborDirection,
} from "@/features/lessons/domain/repositories/lesson-queries.repository";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";

/**
 * @throws {LessonNotFoundError} If the current lesson does not exist or is not visible to the reader
 */
@Injectable()
export class GetAdjacentLessonUseCase {
  public constructor(
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(LESSON_QUERIES_REPOSITORY_TOKEN)
    private readonly _lessonQueriesRepository: ILessonQueriesRepository,
  ) {}

  public async execute(lessonId: string, direction: LessonNeighborDirection, canManage: boolean): Promise<LessonNeighbor | undefined> {
    const [lesson, chain] = await Promise.all([this._lessonsRepository.getById(lessonId), this._lessonQueriesRepository.getStatusChain(lessonId)]);

    if (!lesson || !chain || !isContentVisible(canManage, chain)) {
      throw new LessonNotFoundError();
    }

    return await this._lessonQueriesRepository.getNeighbor(lesson.moduleId, lesson.order, direction, canManage);
  }
}
