/*
 * Funcionalidad: Manejadores de eventos de progreso
 * Descripción: Alimentan el registro de actividad de gamificación de forma idempotente (primera vista de página, lección completada y, si completó el módulo, módulo completado, evaluación con nota publicada aprobada y logro desbloqueado con su recompensa) y después disparan UnlockAchievementsUseCase con los tipos de condición afectados; al desbloquearse un logro lo notifican al usuario por IRealtimePublisher (achievement:unlocked); todos fallan en silencio con registro en el logger
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { EvaluationGradePublishedEvent } from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { RecordLearningActivityCommand } from "@/features/progress/application/commands/record-learning-activity.command";
import { UnlockAchievementsCommand } from "@/features/progress/application/commands/unlock-achievements.command";
import { RecordLearningActivityUseCase } from "@/features/progress/application/use-cases/record-learning-activity.usecase";
import { UnlockAchievementsUseCase } from "@/features/progress/application/use-cases/unlock-achievements.usecase";
import { AchievementUnlockedEvent } from "@/features/progress/domain/events/achievement.events";
import { LessonCompletedEvent } from "@/features/progress/domain/events/lesson-completed.event";
import { PageViewedEvent } from "@/features/progress/domain/events/page-viewed.event";
import {
  type AchievementConditionType,
  LESSONS_COMPLETED_CONDITION,
  MODULES_COMPLETED_CONDITION,
  PERFECT_SCORE_CONDITION,
  QUIZZES_PASSED_CONDITION,
  STREAK_DAYS_CONDITION,
  XP_REACHED_CONDITION,
} from "@/features/progress/domain/services/achievement-catalog";
import {
  ACHIEVEMENT_UNLOCKED_ACTIVITY,
  EVALUATION_PASSED_ACTIVITY,
  LESSON_COMPLETED_ACTIVITY,
  MODULE_COMPLETED_ACTIVITY,
  PAGE_VIEWED_ACTIVITY,
} from "@/features/progress/domain/value-objects/learning-activity-kind";

export const ACHIEVEMENT_UNLOCKED_REALTIME_EVENT: string = "achievement:unlocked";

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class ProgressEventsHandlers {
  private readonly _logger: Logger = new Logger(ProgressEventsHandlers.name);

  public constructor(
    private readonly _unlockAchievementsUseCase: UnlockAchievementsUseCase,
    private readonly _recordLearningActivityUseCase: RecordLearningActivityUseCase,
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
  ) {}

  @OnEvent(PageViewedEvent.name)
  public async handlePageViewed(event: PageViewedEvent): Promise<void> {
    if (!event.firstView) {
      return;
    }

    try {
      const inserted: boolean = await this._recordLearningActivityUseCase.execute(
        new RecordLearningActivityCommand({ userId: event.userId, kind: PAGE_VIEWED_ACTIVITY, refId: event.pageId, occurredAt: event.occurredAt }),
      );

      if (inserted) {
        await this._unlock(event.userId, [STREAK_DAYS_CONDITION, XP_REACHED_CONDITION]);
      }
    } catch (error) {
      this._logger.warn(`Page view activity failed for user ${event.userId}: ${describeError(error)}`);
    }
  }

  @OnEvent(LessonCompletedEvent.name)
  public async handleLessonCompleted(event: LessonCompletedEvent): Promise<void> {
    const triggers: AchievementConditionType[] = [LESSONS_COMPLETED_CONDITION, STREAK_DAYS_CONDITION, XP_REACHED_CONDITION];

    try {
      await this._recordLearningActivityUseCase.execute(
        new RecordLearningActivityCommand({ userId: event.userId, kind: LESSON_COMPLETED_ACTIVITY, refId: event.lessonId, occurredAt: event.occurredAt }),
      );

      if (event.moduleCompleted) {
        triggers.push(MODULES_COMPLETED_CONDITION);
        await this._recordLearningActivityUseCase.execute(
          new RecordLearningActivityCommand({ userId: event.userId, kind: MODULE_COMPLETED_ACTIVITY, refId: event.moduleId, occurredAt: event.occurredAt }),
        );
      }
    } catch (error) {
      this._logger.warn(`Lesson activity failed for user ${event.userId}: ${describeError(error)}`);
    }

    await this._unlock(event.userId, triggers);
  }

  @OnEvent(EvaluationGradePublishedEvent.name)
  public async handleEvaluationGradePublished(event: EvaluationGradePublishedEvent): Promise<void> {
    if (!event.passed) {
      return;
    }

    try {
      await this._recordLearningActivityUseCase.execute(
        new RecordLearningActivityCommand({ userId: event.userId, kind: EVALUATION_PASSED_ACTIVITY, refId: event.evaluationId, occurredAt: event.publishedAt }),
      );
    } catch (error) {
      this._logger.warn(`Evaluation activity failed for user ${event.userId}: ${describeError(error)}`);
    }

    await this._unlock(event.userId, [QUIZZES_PASSED_CONDITION, PERFECT_SCORE_CONDITION, STREAK_DAYS_CONDITION, XP_REACHED_CONDITION]);
  }

  @OnEvent(AchievementUnlockedEvent.name)
  public async handleAchievementUnlocked(event: AchievementUnlockedEvent): Promise<void> {
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
      this._logger.warn(`Achievement notification failed for user ${event.entity.userId}: ${describeError(error)}`);
    }

    try {
      const inserted: boolean = await this._recordLearningActivityUseCase.execute(
        new RecordLearningActivityCommand({
          userId: event.entity.userId,
          kind: ACHIEVEMENT_UNLOCKED_ACTIVITY,
          refId: event.entity.id,
          occurredAt: event.entity.unlockedAt,
          achievementReward: event.xpReward,
        }),
      );

      // The reward may cross an XP threshold ("Level 10"): evaluate it again; the catalog is finite, so the chain ends.
      if (inserted && event.xpReward > 0) {
        await this._unlock(event.entity.userId, [XP_REACHED_CONDITION]);
      }
    } catch (error) {
      this._logger.warn(`Achievement activity failed for user ${event.entity.userId}: ${describeError(error)}`);
    }
  }

  private async _unlock(userId: string, triggers: AchievementConditionType[]): Promise<void> {
    try {
      await this._unlockAchievementsUseCase.execute(new UnlockAchievementsCommand({ userId, triggers }));
    } catch (error) {
      this._logger.warn(`Achievement unlock failed for user ${userId}: ${describeError(error)}`);
    }
  }
}
