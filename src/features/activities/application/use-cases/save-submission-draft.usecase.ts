/*
 * Funcionalidad: Caso de uso SaveSubmissionDraftUseCase
 * Descripción: Guarda el contenido de la entrega propia de un estudiante mientras siga en borrador
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
import { SaveSubmissionDraftCommand } from "@/features/activities/application/commands/save-submission-draft.command";
import { ActivitySubmissionNotFoundError, ActivitySubmissionNotOwnedError, StudentRoleRequiredError } from "@/features/activities/domain/activities.errors";
import { type ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import {
  ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN,
  type IActivitySubmissionsRepository,
} from "@/features/activities/domain/repositories/activity-submissions.repository";
import { isStudentRole } from "@/features/activities/domain/services/activity-access-policy";

/**
 * @throws {StudentRoleRequiredError} If the requester is not a student
 * @throws {ActivitySubmissionNotFoundError} If the submission does not exist
 * @throws {ActivitySubmissionNotOwnedError} If the submission belongs to another student
 * @throws {ActivitySubmissionAlreadyCompletedError} If the submission is no longer a draft
 */
@Injectable()
export class SaveSubmissionDraftUseCase {
  public constructor(
    @Inject(ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN)
    private readonly _submissionsRepository: IActivitySubmissionsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: SaveSubmissionDraftCommand): Promise<void> {
    if (!isStudentRole(command.requesterRole)) {
      throw new StudentRoleRequiredError();
    }

    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const submission: ActivitySubmission | undefined = await this._submissionsRepository.getById(command.submissionId, transaction);

      if (!submission) {
        throw new ActivitySubmissionNotFoundError();
      }

      if (!submission.isOwnedBy(command.userId)) {
        throw new ActivitySubmissionNotOwnedError();
      }

      submission.saveDraft(command.content, command.userId);

      await this._submissionsRepository.save(submission, transaction);

      return submission.getEvents();
    });

    this._eventBus.publish(events);
  }
}
