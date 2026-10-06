/*
 * Funcionalidad: Caso de uso ResetSubmissionUseCase
 * Descripción: Reinicia el intento de un estudiante eliminando su entrega, de modo que pueda volver a iniciarla; deja registro en auditoría
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
import { ResetSubmissionCommand } from "@/features/activities/application/commands/reset-submission.command";
import { ActivitySubmissionNotFoundError } from "@/features/activities/domain/activities.errors";
import { type ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import {
  ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN,
  type IActivitySubmissionsRepository,
} from "@/features/activities/domain/repositories/activity-submissions.repository";

/**
 * @throws {ActivitySubmissionNotFoundError} If the submission does not exist
 */
@Injectable()
export class ResetSubmissionUseCase {
  public constructor(
    @Inject(ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN)
    private readonly _submissionsRepository: IActivitySubmissionsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: ResetSubmissionCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const submission: ActivitySubmission | undefined = await this._submissionsRepository.getById(command.submissionId, transaction);

      if (!submission) {
        throw new ActivitySubmissionNotFoundError();
      }

      submission.reset(command.performedBy);

      await this._submissionsRepository.delete(submission, transaction);

      return submission.getEvents();
    });

    this._eventBus.publish(events);
  }
}
