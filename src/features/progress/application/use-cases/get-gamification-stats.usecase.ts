/*
 * Funcionalidad: Caso de uso GetGamificationStatsUseCase
 * Descripción: Calcula las estadísticas de gamificación del usuario desde el registro de actividad (XP total y de hoy, nivel, XP dentro del nivel, umbral del siguiente, racha actual y más larga en días de America/Bogota) con la única fórmula de gamification-rules
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type GamificationStats, type LearningActivityTotals } from "@/features/progress/domain/read-models/gamification.read-model";
import { type ILearningActivityRepository, LEARNING_ACTIVITY_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/learning-activity.repository";
import { type LocalDate, toBogotaLocalDate } from "@/features/progress/domain/services/activity-calendar";
import { buildGamificationStats } from "@/features/progress/domain/services/gamification-rules";

@Injectable()
export class GetGamificationStatsUseCase {
  public constructor(
    @Inject(LEARNING_ACTIVITY_REPOSITORY_TOKEN)
    private readonly _learningActivityRepository: ILearningActivityRepository,
  ) {}

  public async execute(userId: string, now: Date = new Date()): Promise<GamificationStats> {
    const today: LocalDate = toBogotaLocalDate(now);
    const [totals, activeDates]: [LearningActivityTotals, LocalDate[]] = await Promise.all([
      this._learningActivityRepository.getTotals(userId, today),
      this._learningActivityRepository.getActiveDates(userId),
    ]);

    return buildGamificationStats({ totals, activeDates, today });
  }
}
