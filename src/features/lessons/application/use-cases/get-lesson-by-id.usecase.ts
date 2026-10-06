/*
 * Funcionalidad: Caso de uso GetLessonByIdUseCase
 * Descripción: Ejecuta la operación GetLessonById de la feature de lecciones; depende de ILessonQueriesRepository
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
import { type LessonDetail } from "@/features/lessons/domain/read-models/lesson-views.read-model";
import { type ILessonQueriesRepository, LESSON_QUERIES_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lesson-queries.repository";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist or is not visible to the reader
 */
@Injectable()
export class GetLessonByIdUseCase {
  public constructor(
    @Inject(LESSON_QUERIES_REPOSITORY_TOKEN)
    private readonly _lessonQueriesRepository: ILessonQueriesRepository,
  ) {}

  public async execute(lessonId: string, canManage: boolean): Promise<LessonDetail> {
    const chain: ContentStatusChain | undefined = await this._lessonQueriesRepository.getStatusChain(lessonId);

    if (!chain || !isContentVisible(canManage, chain)) {
      throw new LessonNotFoundError();
    }

    const lesson: LessonDetail | undefined = await this._lessonQueriesRepository.getDetail(lessonId);

    if (!lesson) {
      throw new LessonNotFoundError();
    }

    return lesson;
  }
}
