/*
 * Funcionalidad: Caso de uso GetModulePagesUseCase
 * Descripción: Ejecuta la operación GetModulePages de la feature de páginas; depende de IModuleRepository, IPageQueriesRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { PUBLISHED_CONTENT_STATUS } from "@/features/curriculum/domain/value-objects/content-status";
import { type Module } from "@/features/modules/domain/entities/module.entity";
import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import { type IModuleRepository, MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";
import { type PageSummary } from "@/features/pages/domain/read-models/page-views.read-model";
import { type IPageQueriesRepository, PAGE_QUERIES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/page-queries.repository";

/**
 * @throws {ModuleNotFoundError} If the module does not exist or is not visible to the reader
 */
@Injectable()
export class GetModulePagesUseCase {
  public constructor(
    @Inject(MODULES_REPOSITORY_TOKEN)
    private readonly _modulesRepository: IModuleRepository,
    @Inject(PAGE_QUERIES_REPOSITORY_TOKEN)
    private readonly _pageQueriesRepository: IPageQueriesRepository,
  ) {}

  public async execute(moduleId: string, canManage: boolean): Promise<PageSummary[]> {
    const module: Module | undefined = await this._modulesRepository.getById(moduleId);

    if (!module || (!canManage && module.status !== PUBLISHED_CONTENT_STATUS)) {
      throw new ModuleNotFoundError();
    }

    return await this._pageQueriesRepository.getVisibleByModule(module.id, canManage);
  }
}
