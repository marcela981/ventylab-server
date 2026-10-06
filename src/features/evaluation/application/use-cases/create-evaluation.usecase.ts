/*
 * Funcionalidad: Caso de uso CreateEvaluationUseCase
 * Descripción: Crea una evaluación en borrador del llamador tras sanear la descripción enriquecida y verificar que el módulo, nivel y lección citados existen; devuelve su id
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
import { CreateEvaluationCommand } from "@/features/evaluation/application/commands/create-evaluation.command";
import { assertEvaluationReferencesExist } from "@/features/evaluation/application/services/evaluation-references";
import { Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { EVALUATIONS_REPOSITORY_TOKEN, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";
import { toEvaluationDescription } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";

/**
 * @throws {InvalidEvaluationRichTextError} If the description is not a valid rich text document
 * @throws {EvaluationReferenceNotFoundError} If the module, level or lesson does not exist
 */
@Injectable()
export class CreateEvaluationUseCase {
  public constructor(
    @Inject(EVALUATIONS_REPOSITORY_TOKEN)
    private readonly _evaluationsRepository: IEvaluationsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: CreateEvaluationCommand): Promise<string> {
    const description: string | undefined = command.description === undefined ? undefined : toEvaluationDescription(command.description);

    const { id, events } = await this._transactionManager.run(async (transaction: unknown): Promise<{ id: string; events: DomainEvent[] }> => {
      await assertEvaluationReferencesExist(
        this._evaluationsRepository,
        [],
        { moduleId: command.moduleId, levelId: command.levelId, lessonId: command.lessonId },
        transaction,
      );

      const evaluation: Evaluation = Evaluation.create({
        type: command.type,
        title: command.title,
        description,
        moduleId: command.moduleId,
        levelId: command.levelId,
        lessonId: command.lessonId,
        durationMinutes: command.durationMinutes,
        maxAttempts: command.maxAttempts,
        shuffleQuestions: command.shuffleQuestions,
        showResultsImmediately: command.showResultsImmediately,
        createdById: command.actor.id,
      });

      await this._evaluationsRepository.save(evaluation, transaction);

      return { id: evaluation.id, events: evaluation.getEvents() };
    });

    this._eventBus.publish(events);

    return id;
  }
}
