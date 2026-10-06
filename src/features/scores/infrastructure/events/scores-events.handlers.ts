/*
 * Funcionalidad: Manejadores de eventos de calificaciones
 * Descripción: Al calificarse una entrega de actividad (ActivitySubmissionGradedEvent) registra o actualiza la calificación CUSTOM del profesor para el estudiante y la actividad mediante UpsertScoreUseCase; falla en silencio y deja registro en el log
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { ActivitySubmissionGradedEvent } from "@/features/activities/domain/events/activity-submission.events";
import { UpsertScoreCommand } from "@/features/scores/application/commands/upsert-score.command";
import { UpsertScoreUseCase } from "@/features/scores/application/use-cases/upsert-score.usecase";
import { CUSTOM_SCORE_ENTITY_TYPE } from "@/features/scores/domain/value-objects/score-entity-type";

@Injectable()
export class ScoresEventsHandlers {
  private readonly _logger: Logger = new Logger(ScoresEventsHandlers.name);

  public constructor(private readonly _upsertScoreUseCase: UpsertScoreUseCase) {}

  @OnEvent(ActivitySubmissionGradedEvent.name)
  public async handleActivitySubmissionGraded(event: ActivitySubmissionGradedEvent): Promise<void> {
    const submission: ActivitySubmissionGradedEvent["entity"] = event.entity;
    const graderId: string | undefined = submission.gradedBy ?? event.performedBy;

    if (!graderId || submission.score === undefined || submission.maxScore === undefined) {
      this._logger.warn(`Score not recorded for submission ${submission.id}: grader, score or maximum score missing`);

      return;
    }

    try {
      await this._upsertScoreUseCase.execute(
        new UpsertScoreCommand({
          graderId,
          userId: submission.userId,
          entityType: CUSTOM_SCORE_ENTITY_TYPE,
          entityId: submission.activityId,
          points: submission.score,
          maxPoints: submission.maxScore,
          comments: submission.feedback ?? `Actividad (${event.activityType}): ${event.activityTitle}`,
        }),
      );
    } catch (error) {
      this._logger.warn(
        `Score upsert failed for submission ${submission.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
