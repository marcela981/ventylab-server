/*
 * Funcionalidad: Fachada AiRatingsFacade
 * Descripción: API pública de las valoraciones de IA para otras features: utilidad (porcentaje de valoraciones útiles) y medias de las dimensiones por usuario y caso de uso de varios usuarios, leídas en una sola consulta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  AI_RATINGS_ANALYTICS_REPOSITORY_TOKEN,
  type AiRatingUserUseCaseAggregate,
  type IAiRatingsAnalyticsRepository,
} from "@/features/ai-ratings/domain/repositories/ai-ratings-analytics.repository";

export interface AiRatingUserUseCaseStats extends AiRatingUserUseCaseAggregate {
  readonly helpfulRate: number | null;
}

@Injectable()
export class AiRatingsFacade {
  public constructor(
    @Inject(AI_RATINGS_ANALYTICS_REPOSITORY_TOKEN)
    private readonly _analyticsRepository: IAiRatingsAnalyticsRepository,
  ) {}

  public async getHelpfulnessForUsers(userIds: readonly string[]): Promise<AiRatingUserUseCaseStats[]> {
    const aggregates: AiRatingUserUseCaseAggregate[] = await this._analyticsRepository.getUserUseCaseAggregates(userIds);

    return aggregates.map(
      (aggregate: AiRatingUserUseCaseAggregate): AiRatingUserUseCaseStats => ({
        ...aggregate,
        helpfulRate: aggregate.ratings > 0 ? aggregate.helpfulCount / aggregate.ratings : null,
      }),
    );
  }
}
