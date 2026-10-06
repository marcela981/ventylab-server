/*
 * Funcionalidad: Caso de uso GetModuleFullUseCase
 * Descripción: Devuelve un módulo con sus lecciones, páginas y bloques en una sola consulta anidada, aplica la visibilidad por estado y resuelve en un único lote las URLs de media mediante IMediaUrlResolver (opcional: sin resolver, mediaUrl es null)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Optional } from "@nestjs/common";

import { type IMediaUrlResolver, MEDIA_URL_RESOLVER_TOKEN, type ResolvedMediaURL } from "@/common/application/ports/media-url-resolver.interface";
import { isContentVisible } from "@/features/curriculum/domain/services/content-visibility";
import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import {
  type ModuleFullBlock,
  type ModuleFullContent,
  type ModuleFullLesson,
  type ModuleFullPage,
} from "@/features/modules/domain/read-models/module-views.read-model";
import { type IModuleQueriesRepository, MODULE_QUERIES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/module-queries.repository";

/**
 * @throws {ModuleNotFoundError} If the module does not exist or is not visible to the reader
 */
@Injectable()
export class GetModuleFullUseCase {
  public constructor(
    @Inject(MODULE_QUERIES_REPOSITORY_TOKEN)
    private readonly _moduleQueriesRepository: IModuleQueriesRepository,
    @Optional()
    @Inject(MEDIA_URL_RESOLVER_TOKEN)
    private readonly _mediaUrlResolver?: IMediaUrlResolver,
  ) {}

  public async execute(moduleId: string, canManage: boolean): Promise<ModuleFullContent> {
    const content: ModuleFullContent | undefined = await this._moduleQueriesRepository.getFullContent(moduleId, canManage);

    if (!content || !isContentVisible(canManage, content.statusChain)) {
      throw new ModuleNotFoundError();
    }

    const pages: ModuleFullPage[] = [...content.lessons.flatMap((lesson: ModuleFullLesson) => lesson.pages), ...content.unassignedPages];
    const mediaIds: string[] = [
      ...new Set(
        pages
          .flatMap((page: ModuleFullPage) => page.blocks)
          .map((block: ModuleFullBlock) => block.mediaId)
          .filter((mediaId: string | undefined): mediaId is string => mediaId !== undefined),
      ),
    ];
    const urls: Map<string, ResolvedMediaURL> =
      this._mediaUrlResolver && mediaIds.length > 0 ? await this._mediaUrlResolver.resolveMany(mediaIds) : new Map<string, ResolvedMediaURL>();

    return {
      ...content,
      lessons: content.lessons.map((lesson: ModuleFullLesson) => ({
        ...lesson,
        pages: lesson.pages.map((page: ModuleFullPage) => this._withMediaUrls(page, urls)),
      })),
      unassignedPages: content.unassignedPages.map((page: ModuleFullPage) => this._withMediaUrls(page, urls)),
    };
  }

  private _withMediaUrls(page: ModuleFullPage, urls: ReadonlyMap<string, ResolvedMediaURL>): ModuleFullPage {
    return {
      ...page,
      blocks: page.blocks.map((block: ModuleFullBlock) => ({
        ...block,
        mediaUrl: block.mediaId ? (urls.get(block.mediaId)?.url ?? null) : null,
      })),
    };
  }
}
