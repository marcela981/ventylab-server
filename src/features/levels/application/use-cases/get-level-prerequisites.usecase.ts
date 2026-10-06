/*
 * Funcionalidad: Caso de uso GetLevelPrerequisitesUseCase
 * Descripción: Ejecuta la operación GetLevelPrerequisites de la feature de niveles; depende de ILevelQueriesRepository
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
import { type LevelPrerequisitesView } from "@/features/levels/domain/read-models/level-views.read-model";
import { type ILevelQueriesRepository, LEVEL_QUERIES_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/level-queries.repository";

/**
 * @throws {LevelNotFoundError} If the level does not exist or is not visible to the reader
 */
@Injectable()
export class GetLevelPrerequisitesUseCase {
  public constructor(
    @Inject(LEVEL_QUERIES_REPOSITORY_TOKEN)
    private readonly _levelQueriesRepository: ILevelQueriesRepository,
  ) {}

  public async execute(levelId: string, canManage: boolean): Promise<LevelPrerequisitesView> {
    const chain: ContentStatusChain | undefined = await this._levelQueriesRepository.getStatusChain(levelId);

    if (!chain || !isContentVisible(canManage, chain)) {
      throw new LevelNotFoundError();
    }

    const view: LevelPrerequisitesView | undefined = await this._levelQueriesRepository.getPrerequisitesView(levelId);

    if (!view) {
      throw new LevelNotFoundError();
    }

    return view;
  }
}
