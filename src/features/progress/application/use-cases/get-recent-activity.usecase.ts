/*
 * Funcionalidad: Caso de uso GetRecentActivityUseCase
 * Descripción: Devuelve los hitos más recientes del registro de actividad del usuario (lecciones y módulos completados, evaluaciones aprobadas y logros) con su título, limitados a la cantidad pedida (1 a 50, por defecto 10)
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type RecentActivityItem } from "@/features/progress/domain/read-models/gamification.read-model";
import { type ILearningActivityRepository, LEARNING_ACTIVITY_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-activity.repository";
import { RECENT_ACTIVITY_KINDS } from "@/features/progress/domain/value-objects/learning-activity-kind";

export const DEFAULT_RECENT_ACTIVITY_LIMIT: number = 10;
export const MAX_RECENT_ACTIVITY_LIMIT: number = 50;

@Injectable()
export class GetRecentActivityUseCase {
  public constructor(
    @Inject(LEARNING_ACTIVITY_REPOSITORY_TOKEN)
    private readonly _learningActivityRepository: ILearningActivityRepository,
  ) {}

  public async execute(userId: string, limit: number = DEFAULT_RECENT_ACTIVITY_LIMIT): Promise<RecentActivityItem[]> {
    const boundedLimit: number = Math.min(MAX_RECENT_ACTIVITY_LIMIT, Math.max(1, Math.trunc(limit)));

    return await this._learningActivityRepository.getRecent(userId, RECENT_ACTIVITY_KINDS, boundedLimit);
  }
}
