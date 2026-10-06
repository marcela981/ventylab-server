/*
 * Funcionalidad: Caso de uso GetModulesUseCase
 * Descripción: Ejecuta la operación GetModules de la feature de módulos; depende de IModuleQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type ModuleListItem } from "@/features/modules/domain/read-models/module-views.read-model";
import {
  type GetModulesQuery,
  type IModuleQueriesRepository,
  MODULE_QUERIES_REPOSITORY_TOKEN,
} from "@/features/modules/domain/repositories/module-queries.repository";

@Injectable()
export class GetModulesUseCase {
  public constructor(
    @Inject(MODULE_QUERIES_REPOSITORY_TOKEN)
    private readonly _moduleQueriesRepository: IModuleQueriesRepository,
  ) {}

  public async execute(query: GetModulesQuery): Promise<Paginated<ModuleListItem>> {
    return await this._moduleQueriesRepository.getList(query);
  }
}
