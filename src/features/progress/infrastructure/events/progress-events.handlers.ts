/*
 * Funcionalidad: Manejadores de eventos de progreso
 * Descripción: Al completarse una lección dispara UnlockAchievementsUseCase (lecciones, racha, XP y, si completó el módulo, módulos) y al desbloquearse un logro lo notifica al usuario por IRealtimePublisher; ambos fallan en silencio con registro en el logger
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { UnlockAchievementsCommand } from "@/features/progress/application/commands/unlock-achievements.command";
import { UnlockAchievementsUseCase } from "@/features/progress/application/use-cases/unlock-achievements.usecase";
import { AchievementUnlockedEvent } from "@/features/progress/domain/events/achievement.events";
import { LessonCompletedEvent } from "@/features/progress/domain/events/lesson-completed.event";
import {
  type AchievementConditionType,
  LESSONS_COMPLETED_CONDITION,
  MODULES_COMPLETED_CONDITION,
  STREAK_DAYS_CONDITION,
  XP_REACHED_CONDITION,
} from "@/features/progress/domain/services/achievement-catalog";

export const ACHIEVEMENT_UNLOCKED_REALTIME_EVENT: string = "achievement:unlocked";

@Injectable()
export class ProgressEventsHandlers {
  private readonly _logger: Logger = new Logger(ProgressEventsHandlers.name);

  public constructor(
    private readonly _unlockAchievementsUseCase: UnlockAchievementsUseCase,
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
  ) {}

  @OnEvent(LessonCompletedEvent.name)
  public async handleLessonCompleted(event: LessonCompletedEvent): Promise<void> {
    const triggers: AchievementConditionType[] = [LESSONS_COMPLETED_CONDITION, STREAK_DAYS_CONDITION, XP_REACHED_CONDITION];

    if (event.moduleCompleted) {
      triggers.push(MODULES_COMPLETED_CONDITION);
    }

    try {
      await this._unlockAchievementsUseCase.execute(new UnlockAchievementsCommand({ userId: event.userId, triggers }));
    } catch (error) {
      this._logger.warn(`Achievement unlock failed for user ${event.userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @OnEvent(AchievementUnlockedEvent.name)
  public handleAchievementUnlocked(event: AchievementUnlockedEvent): void {
    try {
      this._realtimePublisher.emitToUser(event.entity.userId, ACHIEVEMENT_UNLOCKED_REALTIME_EVENT, {
        id: event.entity.id,
        title: event.entity.title,
        description: event.entity.description ?? null,
        icon: event.entity.icon ?? null,
        unlockedAt: event.entity.unlockedAt.toISOString(),
        xpReward: event.xpReward,
      });
    } catch (error) {
      this._logger.warn(`Achievement notification failed for user ${event.entity.userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
