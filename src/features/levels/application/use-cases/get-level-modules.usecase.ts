/*
 * Funcionalidad: Caso de uso GetLevelModulesUseCase
 * Descripción: Ejecuta la operación GetLevelModules de la feature de niveles; depende de ILevelQueriesRepository, ILevelRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ContentStatusChain, isContentVisible } from "@/features/curriculum/domain/services/content-visibility";
import { LevelNotFoundError } from "@/features/levels/domain/levels.errors";
import { type LevelModuleItem } from "@/features/levels/domain/read-models/level-views.read-model";
import { type ILevelQueriesRepository, LEVEL_QUERIES_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/level-queries.repository";

/**
 * @throws {LevelNotFoundError} If the level does not exist or is not visible to the reader
 */
@Injectable()
export class GetLevelModulesUseCase {
  public constructor(
    @Inject(LEVEL_QUERIES_REPOSITORY_TOKEN)
    private readonly _levelQueriesRepository: ILevelQueriesRepository,
  ) {}

  public async execute(levelId: string, includeInactive: boolean, canManage: boolean): Promise<LevelModuleItem[]> {
    const chain: ContentStatusChain | undefined = await this._levelQueriesRepository.getStatusChain(levelId);

    if (!chain || !isContentVisible(canManage, chain)) {
      throw new LevelNotFoundError();
    }

    return await this._levelQueriesRepository.getModules(levelId, includeInactive, canManage);
  }
}
