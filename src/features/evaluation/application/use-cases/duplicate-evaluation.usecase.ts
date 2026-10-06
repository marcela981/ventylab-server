/*
 * Funcionalidad: Caso de uso DuplicateEvaluationUseCase
 * Descripción: Duplica en profundidad una evaluación (escenarios, preguntas y opciones con ids nuevos) como borrador del llamador, sin copiar asignaciones ni intentos; devuelve el id de la copia
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
import { DuplicateEvaluationCommand } from "@/features/evaluation/application/commands/duplicate-evaluation.command";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { EvaluationNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";

/**
 * @throws {EvaluationNotFoundError} If the source evaluation does not exist
 */
@Injectable()
export class DuplicateEvaluationUseCase {
  public constructor(
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: DuplicateEvaluationCommand): Promise<string> {
    const { id, events } = await this._transactionManager.run(async (transaction: unknown): Promise<{ id: string; events: DomainEvent[] }> => {
      const source: Evaluation | undefined = await this._evaluationsRepository.getById(command.evaluationId, transaction);

      if (!source) {
        throw new EvaluationNotFoundError();
      }

      const copy: Evaluation = source.duplicate(command.actor.id);

      await this._evaluationsRepository.save(copy, transaction);

      return { id: copy.id, events: copy.getEvents() };
    });

    this._eventBus.publish(events);

    return id;
  }
}
