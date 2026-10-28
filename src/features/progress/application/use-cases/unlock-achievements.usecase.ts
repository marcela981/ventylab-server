/*
 * Funcionalidad: Caso de uso UnlockAchievementsUseCase
 * Descripción: Evalúa las definiciones de logros aún bloqueadas cuyos tipos de condición fueron disparados, desbloquea las que se cumplen con Achievement.unlock con las lecturas fuera de la transacción y las inserciones en una transacción corta (por código de catálogo, omitiendo en conflicto) y publica AchievementUnlockedEvent solo de las insertadas, de modo que un desbloqueo concurrente no se duplica
 * Versión: 1.1
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
    // Reads run before the transaction so concurrent unlocks never hold a pooled connection while waiting for another one.
    const unlocked: Achievement[] = await this._achievementsRepository.getByUserId(command.userId);
    const unlockedCodes: Set<string> = new Set(unlocked.map((achievement: Achievement) => achievement.code));

    const candidates: AchievementDefinition[] = ACHIEVEMENT_DEFINITIONS.filter(
      (definition: AchievementDefinition) => !unlockedCodes.has(definition.code) && command.triggers.includes(definition.condition.type),
    );

    if (candidates.length === 0) {
      return;
    }

    const metrics: AchievementMetrics = await this._achievementsRepository.getMetrics(command.userId);
    const met: AchievementDefinition[] = candidates.filter((definition: AchievementDefinition) => meetsAchievementCondition(definition, metrics));

    if (met.length === 0) {
      return;
    }

    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const pendingEvents: DomainEvent[] = [];

      for (const definition of met) {
        const achievement: Achievement = Achievement.unlock({
          userId: command.userId,
          code: definition.code,
          title: definition.title,
          description: definition.description,
          icon: definition.icon,
          xpReward: definition.xpReward,
        });

        // A concurrent request may have inserted the same code first: then no event is published for this copy.
        if (await this._achievementsRepository.insertIfAbsent(achievement, transaction)) {
          pendingEvents.push(...achievement.getEvents());
        }
      }

      return pendingEvents;
    });

    if (events.length > 0) {
      this._eventBus.publish(events);
    }
  }
}
