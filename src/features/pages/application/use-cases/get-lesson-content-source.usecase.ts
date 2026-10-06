/*
 * Funcionalidad: Caso de uso GetLessonContentSourceUseCase
 * Descripción: Ejecuta la operación GetLessonContentSource de la feature de páginas; depende de IPageQueriesRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { LessonContentSourceResult } from "@/features/pages/application/results/lesson-content-source.result";
import { type PageView } from "@/features/pages/domain/read-models/page-views.read-model";
import { type IPageQueriesRepository, PAGE_QUERIES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/page-queries.repository";

@Injectable()
export class GetLessonContentSourceUseCase {
  public constructor(
    @Inject(PAGE_QUERIES_REPOSITORY_TOKEN)
    private readonly _pageQueriesRepository: IPageQueriesRepository,
  ) {}

  public async execute(lessonId: string, canManage: boolean): Promise<LessonContentSourceResult> {
    const page: PageView | undefined =
      (await this._pageQueriesRepository.getVisibleByLegacyLessonId(lessonId, canManage)) ??
      (await this._pageQueriesRepository.getVisibleByLegacyJsonId(lessonId, canManage));

    return new LessonContentSourceResult({ source: page ? "page" : "lesson", lessonId, page });
  }
}
