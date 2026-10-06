/*
 * Funcionalidad: Caso de uso GetAiRatingStatsUseCase
 * Descripción: Estadísticas de valoraciones de IA en un rango (máximo 366 días) agrupadas por caso de uso, proveedor, modelo y versión de prompt de la llamada enlazada ("unknown" sin llamada): tasa de utilidad y media con n por dimensión QUEST
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type AiRatingGroupAggregate,
  type AiRatingStats,
  type AiRatingStatsFilters,
  type AiRatingStatsGroup,
} from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { AI_RATINGS_REPOSITORY_TOKEN, type IAiRatingsRepository } from "@/features/ai-ratings/domain/repositories/ai-ratings.repository";
import { assertValidAiRatingsRange } from "@/features/ai-ratings/domain/services/ai-ratings-range";

/**
 * @throws {InvalidAiRatingsRangeError} If the range does not start before it ends or spans more than 366 days
 */
@Injectable()
export class GetAiRatingStatsUseCase {
  public constructor(
    @Inject(AI_RATINGS_REPOSITORY_TOKEN)
    private readonly _aiRatingsRepository: IAiRatingsRepository,
  ) {}

  public async execute(filters: AiRatingStatsFilters): Promise<AiRatingStats> {
    assertValidAiRatingsRange(filters.from, filters.to);

    const groups: AiRatingGroupAggregate[] = await this._aiRatingsRepository.getStatsGroups(filters);

    return {
      from: filters.from,
      to: filters.to,
      groups: groups.map(
        (group: AiRatingGroupAggregate): AiRatingStatsGroup => ({
          ...group,
          helpfulRate: group.ratings > 0 ? group.helpfulCount / group.ratings : 0,
        }),
      ),
    };
  }
}
