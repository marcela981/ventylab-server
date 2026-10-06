/*
 * Funcionalidad: Caso de uso GetLessonPagesUseCase
 * Descripción: Lista las páginas de una lección visibles para el lector (los estudiantes solo ven páginas publicadas de lecciones publicadas con ancestros publicados); es la lectura que la feature de progreso puede reutilizar; depende de ILessonRepository e IPageQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { PUBLISHED_CONTENT_STATUS } from "@/features/curriculum/domain/value-objects/content-status";
import { type Lesson } from "@/features/lessons/domain/entities/lesson.entity";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";
import { type PageSummary } from "@/features/pages/domain/read-models/page-views.read-model";
import { type IPageQueriesRepository, PAGE_QUERIES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/page-queries.repository";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist or is not visible to the reader
 */
@Injectable()
export class GetLessonPagesUseCase {
  public constructor(
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(PAGE_QUERIES_REPOSITORY_TOKEN)
    private readonly _pageQueriesRepository: IPageQueriesRepository,
  ) {}

  public async execute(lessonId: string, canManage: boolean): Promise<PageSummary[]> {
    const lesson: Lesson | undefined = await this._lessonsRepository.getById(lessonId);

    if (!lesson || (!canManage && lesson.status !== PUBLISHED_CONTENT_STATUS)) {
      throw new LessonNotFoundError();
    }

    return await this._pageQueriesRepository.getVisibleByLesson(lesson.id, canManage);
  }
}
