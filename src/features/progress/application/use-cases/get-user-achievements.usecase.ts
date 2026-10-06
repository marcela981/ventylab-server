/*
 * Funcionalidad: Caso de uso GetUserAchievementsUseCase
 * Descripción: Devuelve los logros desbloqueados por un usuario, del más reciente al más antiguo, con la recompensa de XP de su definición
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Achievement } from "@/features/progress/domain/entities/achievement.entity";
import { type UnlockedAchievementView } from "@/features/progress/domain/read-models/progress-views.read-model";
import { ACHIEVEMENTS_REPOSITORY_TOKEN, type IAchievementsRepository } from "@/features/progress/domain/repositories/achievements.repository";
import { getAchievementXPReward } from "@/features/progress/domain/services/achievement-catalog";

@Injectable()
export class GetUserAchievementsUseCase {
  public constructor(
    @Inject(ACHIEVEMENTS_REPOSITORY_TOKEN)
    private readonly _achievementsRepository: IAchievementsRepository,
  ) {}

  public async execute(userId: string): Promise<UnlockedAchievementView[]> {
    const achievements: Achievement[] = await this._achievementsRepository.getByUserId(userId);

    return achievements.map((achievement: Achievement) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      unlockedAt: achievement.unlockedAt,
      xpReward: getAchievementXPReward(achievement.title),
    }));
  }
}
