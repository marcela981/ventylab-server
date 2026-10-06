/*
 * Funcionalidad: Caso de uso GetLevelsUseCase
 * Descripción: Ejecuta la operación GetLevels de la feature de niveles; depende de ILevelQueriesRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type LevelSummary } from "@/features/levels/domain/read-models/level-views.read-model";
import {
  type GetLevelsQuery,
  type ILevelQueriesRepository,
  LEVEL_QUERIES_REPOSITORY_TOKEN,
} from "@/features/levels/domain/repositories/level-queries.repository";

@Injectable()
export class GetLevelsUseCase {
  public constructor(
    @Inject(LEVEL_QUERIES_REPOSITORY_TOKEN)
    private readonly _levelQueriesRepository: ILevelQueriesRepository,
  ) {}

  public async execute(query: GetLevelsQuery): Promise<Paginated<LevelSummary>> {
    return await this._levelQueriesRepository.getSummaries(query);
  }
}
