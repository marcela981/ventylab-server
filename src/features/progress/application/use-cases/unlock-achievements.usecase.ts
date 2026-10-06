/*
 * Funcionalidad: Caso de uso UnlockAchievementsUseCase
 * Descripción: Evalúa las definiciones de logros aún bloqueadas cuyos tipos de condición fueron disparados, desbloquea las que se cumplen con Achievement.unlock en una transacción y publica AchievementUnlockedEvent
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { UnlockAchievementsCommand } from "@/features/progress/application/commands/unlock-achievements.command";
import { Achievement } from "@/features/progress/domain/entities/achievement.entity";
import { ACHIEVEMENTS_REPOSITORY_TOKEN, type IAchievementsRepository } from "@/features/progress/domain/repositories/achievements.repository";
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementDefinition,
  type AchievementMetrics,
  meetsAchievementCondition,
} from "@/features/progress/domain/services/achievement-catalog";

@Injectable()
export class UnlockAchievementsUseCase {
  public constructor(
    @Inject(ACHIEVEMENTS_REPOSITORY_TOKEN)
    private readonly _achievementsRepository: IAchievementsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UnlockAchievementsCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const unlocked: Achievement[] = await this._achievementsRepository.getByUserId(command.userId, transaction);
      const unlockedTitles: Set<string> = new Set(unlocked.map((achievement: Achievement) => achievement.title));

      const candidates: AchievementDefinition[] = ACHIEVEMENT_DEFINITIONS.filter(
        (definition: AchievementDefinition) => !unlockedTitles.has(definition.title) && command.triggers.includes(definition.condition.type),
      );

      if (candidates.length === 0) {
        return [];
      }

      const metrics: AchievementMetrics = await this._achievementsRepository.getMetrics(command.userId);
      const today: Date = new Date();
      const pendingEvents: DomainEvent[] = [];

      for (const definition of candidates) {
        if (!meetsAchievementCondition(definition, metrics, unlockedTitles, today)) {
          continue;
        }

        const achievement: Achievement = Achievement.unlock({
          userId: command.userId,
          title: definition.title,
          description: definition.description,
          icon: definition.icon,
          xpReward: definition.xpReward,
        });

        await this._achievementsRepository.save(achievement, transaction);

        unlockedTitles.add(definition.title);
        pendingEvents.push(...achievement.getEvents());
      }

      return pendingEvents;
    });

    if (events.length > 0) {
      this._eventBus.publish(events);
    }
  }
}
