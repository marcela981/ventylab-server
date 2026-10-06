/*
 * Funcionalidad: Caso de uso GetMyAiRatingUseCase
 * Descripción: Devuelve la valoración propia de un usuario sobre una salida de IA (para precargar el formulario) o undefined si aún no la valoró
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type AiRating } from "@/features/ai-ratings/domain/entities/ai-rating.entity";
import { type AiRatingTargetTypeValue } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { AI_RATINGS_REPOSITORY_TOKEN, type IAiRatingsRepository } from "@/features/ai-ratings/domain/repositories/ai-ratings.repository";

@Injectable()
export class GetMyAiRatingUseCase {
  public constructor(
    @Inject(AI_RATINGS_REPOSITORY_TOKEN)
    private readonly _aiRatingsRepository: IAiRatingsRepository,
  ) {}

  public async execute(userId: string, targetType: AiRatingTargetTypeValue, targetId: string): Promise<AiRating | undefined> {
    return this._aiRatingsRepository.getByUserAndTarget(userId, targetType, targetId);
  }
}
