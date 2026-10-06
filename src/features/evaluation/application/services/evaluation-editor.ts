/*
 * Funcionalidad: Editor transaccional de evaluaciones
 * Descripción: Ejecuta cada edición de una evaluación en una transacción bajo el candado de la evaluación: carga el agregado, aplica la política de gestión, valida medios y referencias, aplica el cambio, bloquea los cambios estructurales si hay intentos entregados (contados en la misma transacción), exige que una evaluación READY siga siendo válida, guarda y publica los eventos tras confirmar
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
import { assertEvaluationReferencesExist } from "@/features/evaluation/application/services/evaluation-references";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import {
  EvaluationHasSubmittedAttemptsError,
  EvaluationManagementForbiddenError,
  EvaluationNotFoundError,
} from "@/features/evaluation/domain/evaluation.errors";
import { type EvaluationUsage } from "@/features/evaluation/domain/read-models/evaluation.read-model";
import {
  type EvaluationReferences,
  EVALUATIONS_REPOSITORY_TOKEN,
  type IEvaluationsRepository,
} from "@/features/evaluation/domain/repositories/evaluations.repository";
import {
  canManageEvaluation,
  type EvaluationActor,
  evaluationStructureLockKey,
} from "@/features/evaluation/domain/services/evaluation-management-policy";

export interface EvaluationEditContext {
  readonly transaction: unknown;
  getUsage(): Promise<EvaluationUsage>;
}

export interface EvaluationEdit<T> {
  readonly evaluationId: string;
  readonly actor: EvaluationActor;
  readonly mediaIds?: ReadonlyArray<string>;
  readonly references?: EvaluationReferences;
  apply(evaluation: Evaluation, context: EvaluationEditContext): T | Promise<T>;
}

@Injectable()
export class EvaluationEditor {
  public constructor(
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async edit<T>(edit: EvaluationEdit<T>): Promise<T> {
    const { result, events } = await this._transactionManager.run(async (transaction: unknown): Promise<{ result: T; events: DomainEvent[] }> => {
      await this._evaluationsRepository.acquireTransactionLock(evaluationStructureLockKey(edit.evaluationId), transaction);

      const evaluation: Evaluation = await this.loadManageable(edit.evaluationId, edit.actor, transaction);

      await assertEvaluationReferencesExist(this._evaluationsRepository, edit.mediaIds ?? [], edit.references ?? {}, transaction);

      const context: EvaluationEditContext = {
        transaction,
        getUsage: (): Promise<EvaluationUsage> => this._evaluationsRepository.getUsage(evaluation.id, transaction),
      };

      const applied: T = await edit.apply(evaluation, context);

      if (evaluation.hasStructuralChanges) {
        const usage: EvaluationUsage = await context.getUsage();

        if (usage.submittedAttempts > 0) {
          throw new EvaluationHasSubmittedAttemptsError();
        }
      }

      evaluation.assertConsistentWithStatus();

      await this._evaluationsRepository.save(evaluation, transaction);

      return { result: applied, events: evaluation.getEvents() };
    });

    this._eventBus.publish(events);

    return result;
  }

  public async loadManageable(evaluationId: string, actor: EvaluationActor, transaction: unknown): Promise<Evaluation> {
    const evaluation: Evaluation | undefined = await this._evaluationsRepository.getById(evaluationId, transaction);

    if (!evaluation) {
      throw new EvaluationNotFoundError();
    }

    if (!canManageEvaluation(actor, evaluation)) {
      throw new EvaluationManagementForbiddenError();
    }

    return evaluation;
  }
}
