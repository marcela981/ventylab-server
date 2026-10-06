/*
 * Funcionalidad: Caso de uso GetModuleLessonsUseCase
 * Descripción: Ejecuta la operación GetModuleLessons de la feature de módulos; depende de IModuleQueriesRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ContentStatusChain, isContentVisible } from "@/features/curriculum/domain/services/content-visibility";
import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import { type ModuleLessonItem } from "@/features/modules/domain/read-models/module-views.read-model";
import { type IModuleQueriesRepository, MODULE_QUERIES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/module-queries.repository";

/**
 * @throws {ModuleNotFoundError} If the module does not exist or is not visible to the reader
 */
@Injectable()
export class GetModuleLessonsUseCase {
  public constructor(
    @Inject(MODULE_QUERIES_REPOSITORY_TOKEN)
    private readonly _moduleQueriesRepository: IModuleQueriesRepository,
  ) {}

  public async execute(moduleId: string, canManage: boolean): Promise<ModuleLessonItem[]> {
    const chain: ContentStatusChain | undefined = await this._moduleQueriesRepository.getStatusChain(moduleId);

    if (!chain || !isContentVisible(canManage, chain)) {
      throw new ModuleNotFoundError();
    }

    return await this._moduleQueriesRepository.getLessons(moduleId, canManage);
  }
}
