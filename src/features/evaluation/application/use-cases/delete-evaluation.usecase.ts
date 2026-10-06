/*
 * Funcionalidad: Caso de uso DeleteEvaluationUseCase
 * Descripción: Borra físicamente una evaluación sin intentos ni asignaciones; si tiene alguno de ellos la archiva para conservar el historial; aplica la política de gestión bajo el candado de la evaluación
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
import { DeleteEvaluationCommand } from "@/features/evaluation/application/commands/delete-evaluation.command";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { EvaluationManagementForbiddenError, EvaluationNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import { type EvaluationUsage } from "@/features/evaluation/domain/read-models/evaluation.read-model";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { canManageEvaluation, evaluationStructureLockKey } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { ARCHIVED_EVALUATION_STATUS } from "@/features/evaluation/domain/value-objects/evaluation-status";

export type DeleteEvaluationOutcome = "deleted" | "archived";

/**
 * @throws {EvaluationNotFoundError} If the evaluation does not exist
 * @throws {EvaluationManagementForbiddenError} If the caller cannot manage the evaluation
 */
@Injectable()
export class DeleteEvaluationUseCase {
  public constructor(
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: DeleteEvaluationCommand): Promise<DeleteEvaluationOutcome> {
    const { outcome, events } = await this._transactionManager.run(
      async (transaction: unknown): Promise<{ outcome: DeleteEvaluationOutcome; events: DomainEvent[] }> => {
        await this._evaluationsRepository.acquireTransactionLock(evaluationStructureLockKey(command.evaluationId), transaction);

        const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(command.evaluationId, transaction);

        if (!evaluation) {
          throw new EvaluationNotFoundError();
        }

        if (!canManageEvaluation(command.actor, evaluation)) {
          throw new EvaluationManagementForbiddenError();
        }

        const usage: EvaluationUsage = await this._evaluationsRepository.getUsage(evaluation.id, transaction);

        if (usage.attempts > 0 || usage.assignments > 0) {
          evaluation.changeStatus(ARCHIVED_EVALUATION_STATUS, { hasSubmittedAttempts: usage.submittedAttempts > 0 }, command.actor.id);

          await this._evaluationsRepository.save(evaluation, transaction);

          return { outcome: "archived", events: evaluation.getEvents() };
        }

        evaluation.markDeleted(command.actor.id);

        await this._evaluationsRepository.delete(evaluation, transaction);

        return { outcome: "deleted", events: evaluation.getEvents() };
      },
    );

    this._eventBus.publish(events);

    return outcome;
  }
}
