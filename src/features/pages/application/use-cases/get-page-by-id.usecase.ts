/*
 * Funcionalidad: Caso de uso GetPageByIdUseCase
 * Descripción: Obtiene una página con sus bloques activos aplicando la visibilidad por estado (404 para estudiantes si la página o un ancestro no está publicado) y resuelve en un lote las URLs de media mediante IMediaUrlResolver (opcional: sin resolver, mediaUrl es null)
 * Versión: 1.1
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

/**
 * @throws {PageNotFoundError} If the page does not exist or is not visible to the reader
 */
@Injectable()
export class GetPageByIdUseCase {
  public constructor(
    @Inject(PAGE_QUERIES_REPOSITORY_TOKEN)
    private readonly _pageQueriesRepository: IPageQueriesRepository,
    @Optional()
    @Inject(MEDIA_URL_RESOLVER_TOKEN)
    private readonly _mediaUrlResolver?: IMediaUrlResolver,
  ) {}

  public async execute(pageId: string, canManage: boolean): Promise<PageView> {
    const chain: ContentStatusChain | undefined = await this._pageQueriesRepository.getStatusChain(pageId);

    if (!chain || !isContentVisible(canManage, chain)) {
      throw new PageNotFoundError();
    }

    const page: PageView | undefined = await this._pageQueriesRepository.getById(pageId);

    if (!page) {
      throw new PageNotFoundError();
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
