/*
 * Funcionalidad: Caso de uso GetPageByIdUseCase
 * Descripción: Obtiene una página con sus bloques activos aplicando la visibilidad por estado (404 para estudiantes si la página o un ancestro no está publicado) y resuelve en un lote las URLs de media mediante IMediaUrlResolver (opcional: sin resolver, mediaUrl es null). v1.2: un estudiante autenticado no lee una página de una lección bloqueada (LearningProgressFacade.assertLessonAccessible, 403 LessonLockedError); staff y lectores anónimos no se validan
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Optional } from "@nestjs/common";

import { type IMediaUrlResolver, MEDIA_URL_RESOLVER_TOKEN, type ResolvedMediaURL } from "@/common/application/ports/media-url-resolver.interface";
import { type ContentStatusChain, isContentVisible } from "@/features/curriculum/domain/services/content-visibility";
import { PageNotFoundError } from "@/features/pages/domain/pages.errors";
import { type PageSectionView, type PageView } from "@/features/pages/domain/read-models/page-views.read-model";
import { type IPageQueriesRepository, PAGE_QUERIES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/page-queries.repository";
import { LearningProgressFacade } from "@/features/progress/application/services/learning-progress.facade";

/**
 * @throws {PageNotFoundError} If the page does not exist or is not visible to the reader
 * @throws {LessonLockedError} If an authenticated student reads a page of a lesson that is still locked for them
 */
@Injectable()
export class GetPageByIdUseCase {
  public constructor(
    @Inject(PAGE_QUERIES_REPOSITORY_TOKEN)
    private readonly _pageQueriesRepository: IPageQueriesRepository,
    private readonly _learningProgressFacade: LearningProgressFacade,
    @Optional()
    @Inject(MEDIA_URL_RESOLVER_TOKEN)
    private readonly _mediaUrlResolver?: IMediaUrlResolver,
  ) {}

  // userId is the authenticated reader, if any: anonymous reads keep the publication rule only.
  public async execute(pageId: string, canManage: boolean, userId?: string): Promise<PageView> {
    const chain: ContentStatusChain | undefined = await this._pageQueriesRepository.getStatusChain(pageId);

    if (!chain || !isContentVisible(canManage, chain)) {
      throw new PageNotFoundError();
    }

    const page: PageView | undefined = await this._pageQueriesRepository.getById(pageId);

    if (!page) {
      throw new PageNotFoundError();
    }

    if (userId && !canManage && page.lessonId) {
      await this._learningProgressFacade.assertLessonAccessible(userId, page.lessonId, false);
    }

    const mediaIds: string[] = [
      ...new Set(page.sections.map((section: PageSectionView) => section.mediaId).filter((mediaId: string | undefined): mediaId is string => mediaId !== undefined)),
    ];
    const urls: Map<string, ResolvedMediaURL> =
      this._mediaUrlResolver && mediaIds.length > 0 ? await this._mediaUrlResolver.resolveMany(mediaIds) : new Map<string, ResolvedMediaURL>();

    return {
      ...page,
      sections: page.sections.map((section: PageSectionView) => ({
        ...section,
        mediaUrl: section.mediaId ? (urls.get(section.mediaId)?.url ?? null) : null,
      })),
    };
  }
}
