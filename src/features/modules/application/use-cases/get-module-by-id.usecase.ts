/*
 * Funcionalidad: Caso de uso GetModuleByIdUseCase
 * Descripción: Ejecuta la operación GetModuleById de la feature de módulos; depende de IModuleQueriesRepository
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
import { type ModuleDetail } from "@/features/modules/domain/read-models/module-views.read-model";
import { type IModuleQueriesRepository, MODULE_QUERIES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/module-queries.repository";

/**
 * @throws {ModuleNotFoundError} If the module does not exist or is not visible to the reader
 */
@Injectable()
export class GetModuleByIdUseCase {
  public constructor(
    @Inject(MODULE_QUERIES_REPOSITORY_TOKEN)
    private readonly _moduleQueriesRepository: IModuleQueriesRepository,
  ) {}

  public async execute(moduleId: string, canManage: boolean): Promise<ModuleDetail> {
    const chain: ContentStatusChain | undefined = await this._moduleQueriesRepository.getStatusChain(moduleId);

    if (!chain || !isContentVisible(canManage, chain)) {
      throw new ModuleNotFoundError();
    }

    const module: ModuleDetail | undefined = await this._moduleQueriesRepository.getDetail(moduleId);

    if (!module) {
      throw new ModuleNotFoundError();
    }

    return module;
  }
}
