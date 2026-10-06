/*
 * Funcionalidad: Manejadores de eventos de quizzes
 * Descripción: Tras registrarse un intento de quiz dispara UnlockAchievementsUseCase (quizzes aprobados, puntaje perfecto y XP) de la feature de progreso; falla en silencio con registro en el logger
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { UnlockAchievementsCommand } from "@/features/progress/application/commands/unlock-achievements.command";
import { UnlockAchievementsUseCase } from "@/features/progress/application/use-cases/unlock-achievements.usecase";
import {
  PERFECT_SCORE_CONDITION,
  QUIZZES_PASSED_CONDITION,
  XP_REACHED_CONDITION,
} from "@/features/progress/domain/services/achievement-catalog";
import { QuizAttemptedEvent } from "@/features/quizzes/domain/events/quiz-attempt.events";

@Injectable()
export class QuizzesEventsHandlers {
  private readonly _logger: Logger = new Logger(QuizzesEventsHandlers.name);

  public constructor(private readonly _unlockAchievementsUseCase: UnlockAchievementsUseCase) {}

  @OnEvent(QuizAttemptedEvent.name)
  public async handleQuizAttempted(event: QuizAttemptedEvent): Promise<void> {
    const userId: string = event.entity.userId;

    try {
      await this._unlockAchievementsUseCase.execute(
        new UnlockAchievementsCommand({
          userId,
          triggers: [QUIZZES_PASSED_CONDITION, PERFECT_SCORE_CONDITION, XP_REACHED_CONDITION],
        }),
      );
    } catch (error) {
      this._logger.warn(`Achievement unlock failed for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
