/*
 * Funcionalidad: Caso de uso GetLessonContentUseCase
 * Descripción: Ejecuta la operación GetLessonContent de la feature de lecciones; depende de ILessonQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type LessonContentView } from "@/features/lessons/domain/read-models/lesson-views.read-model";
import { type ILessonQueriesRepository, LESSON_QUERIES_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lesson-queries.repository";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist
 */
@Injectable()
export class GetLessonContentUseCase {
  public constructor(
    @Inject(LESSON_QUERIES_REPOSITORY_TOKEN)
    private readonly _lessonQueriesRepository: ILessonQueriesRepository,
  ) {}

  public async execute(lessonId: string): Promise<LessonContentView> {
    const content: LessonContentView | undefined = await this._lessonQueriesRepository.getContent(lessonId);

    if (!content) {
      throw new LessonNotFoundError();
    }

    return content;
  }
}
