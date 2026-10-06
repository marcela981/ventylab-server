/*
 * Funcionalidad: Caso de uso GradeSubmissionUseCase
 * Descripción: Califica una entrega ya enviada con un puntaje entre 0 y su puntaje máximo (o el de la actividad) y publica ActivitySubmissionGradedEvent para registrar la nota en la tabla de calificaciones
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
import { GradeSubmissionCommand } from "@/features/activities/application/commands/grade-submission.command";
import { ActivityNotFoundError, ActivitySubmissionNotFoundError } from "@/features/activities/domain/activities.errors";
import { type ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import { type Activity } from "@/features/activities/domain/entities/activity.entity";
import { ACTIVITIES_REPOSITORY_TOKEN, type IActivitiesRepository } from "@/features/activities/domain/repositories/activities.repository";
import {
  ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN,
  type IActivitySubmissionsRepository,
} from "@/features/activities/domain/repositories/activity-submissions.repository";

/**
 * @throws {ActivitySubmissionNotFoundError} If the submission does not exist
 * @throws {ActivityNotFoundError} If the submission's activity no longer exists
 * @throws {ActivitySubmissionNotSubmittedError} If the submission is still a draft
 * @throws {InvalidActivitySubmissionScoreError} If the score is outside 0 and the maximum score
 */
@Injectable()
export class GradeSubmissionUseCase {
  public constructor(
    @Inject(ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN)
    private readonly _submissionsRepository: IActivitySubmissionsRepository,
    @Inject(ACTIVITIES_REPOSITORY_TOKEN)
    private readonly _activitiesRepository: IActivitiesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: GradeSubmissionCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const submission: ActivitySubmission | undefined = await this._submissionsRepository.getById(command.submissionId, transaction);

      if (!submission) {
        throw new ActivitySubmissionNotFoundError();
      }

      const activity: Activity | undefined = await this._activitiesRepository.getById(submission.activityId, transaction);

      if (!activity) {
        throw new ActivityNotFoundError();
      }

      submission.grade({
        score: command.score,
        feedback: command.feedback,
        graderId: command.graderId,
        activityMaxScore: activity.maxScore,
        activityType: activity.type,
        activityTitle: activity.title,
      });

      await this._submissionsRepository.save(submission, transaction);

      return submission.getEvents();
    });

    this._eventBus.publish(events);
  }
}
