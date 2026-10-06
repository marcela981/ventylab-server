/*
 * Funcionalidad: Caso de uso GetPageByLegacyJsonIdUseCase
 * Descripción: Ejecuta la operación GetPageByLegacyJsonId de la feature de páginas; depende de IPageQueriesRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type PageView } from "@/features/pages/domain/read-models/page-views.read-model";
import { type IPageQueriesRepository, PAGE_QUERIES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/page-queries.repository";

@Injectable()
export class GetPageByLegacyJsonIdUseCase {
  public constructor(
    @Inject(PAGE_QUERIES_REPOSITORY_TOKEN)
    private readonly _pageQueriesRepository: IPageQueriesRepository,
  ) {}

  public async execute(legacyJsonId: string, canManage: boolean): Promise<PageView | undefined> {
    return await this._pageQueriesRepository.getVisibleByLegacyJsonId(legacyJsonId, canManage);
  }
}
