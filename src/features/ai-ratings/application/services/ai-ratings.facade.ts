/*
 * Funcionalidad: Fachada AiRatingsFacade
 * Descripción: API pública de las valoraciones de IA para otras features: utilidad (porcentaje de valoraciones útiles) y medias de las dimensiones por usuario y caso de uso de varios usuarios, leídas en una sola consulta, y las valoraciones propias de un usuario sobre varios objetivos de un tipo (una consulta)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type AiRating } from "@/features/ai-ratings/domain/entities/ai-rating.entity";
import { type AiRatingTargetTypeValue } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import {
  AI_RATINGS_ANALYTICS_REPOSITORY_TOKEN,
  type AiRatingUserUseCaseAggregate,
  type IAiRatingsAnalyticsRepository,
} from "@/features/ai-ratings/domain/repositories/ai-ratings-analytics.repository";
import { AI_RATINGS_REPOSITORY_TOKEN, type IAiRatingsRepository } from "@/features/ai-ratings/domain/repositories/ai-ratings.repository";

export interface AiRatingUserUseCaseStats extends AiRatingUserUseCaseAggregate {
  readonly helpfulRate: number | null;
}

export interface OwnAiRatingView {
  readonly id: string;
  readonly targetId: string;
  readonly surface?: string;
  readonly helpful: boolean;
  readonly comment?: string;
  readonly quality?: number;
  readonly understanding?: number;
  readonly expression?: number;
  readonly safety?: number;
  readonly trust?: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

@Injectable()
export class AiRatingsFacade {
  public constructor(
    @Inject(AI_RATINGS_ANALYTICS_REPOSITORY_TOKEN)
    private readonly _analyticsRepository: IAiRatingsAnalyticsRepository,
    @Inject(AI_RATINGS_REPOSITORY_TOKEN)
    private readonly _ratingsRepository: IAiRatingsRepository,
  ) {}

  public async getOwnRatings(userId: string, targetType: AiRatingTargetTypeValue, targetIds: ReadonlyArray<string>): Promise<OwnAiRatingView[]> {
    const ratings: AiRating[] = await this._ratingsRepository.getByUserAndTargets(userId, targetType, targetIds);

    return ratings.map(
      (rating: AiRating): OwnAiRatingView => ({
        id: rating.id,
        targetId: rating.targetId,
        surface: rating.surface,
        helpful: rating.answers.helpful,
        comment: rating.answers.comment,
        quality: rating.answers.quality,
        understanding: rating.answers.understanding,
        expression: rating.answers.expression,
        safety: rating.answers.safety,
        trust: rating.answers.trust,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      }),
    );
  }

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
