/*
 * Funcionalidad: Caso de uso UpdateStepUseCase
 * Descripción: Ejecuta la operación UpdateStep de la feature de pasos (tarjetas); depende de IEventBus, ITransactionManager, IStepRepository
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
import { UpdateStepCommand } from "@/features/steps/application/commands/update-step.command";
import { type Step } from "@/features/steps/domain/entities/step.entity";
import { type IStepRepository, STEPS_REPOSITORY_TOKEN } from "@/features/steps/domain/repositories/steps.repository";
import { StepNotFoundError, StepOrderAlreadyTakenError } from "@/features/steps/domain/steps.errors";

/**
 * @throws {StepNotFoundError} If the step does not exist
 * @throws {StepOrderAlreadyTakenError} If another step of the lesson already has the new order
 */
@Injectable()
export class UpdateStepUseCase {
  public constructor(
    @Inject(STEPS_REPOSITORY_TOKEN)
    private readonly _stepsRepository: IStepRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UpdateStepCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const step: Step | undefined = await this._stepsRepository.getById(command.stepId, transaction);

      if (!step) {
        throw new StepNotFoundError();
      }

      if (
        command.order !== undefined &&
        command.order !== step.order &&
        (await this._stepsRepository.getByOrderInLesson(step.lessonId, command.order, step.id, transaction))
      ) {
        throw new StepOrderAlreadyTakenError(command.order);
      }

      step.update({
        title: command.title,
        content: command.content,
        contentType: command.contentType,
        order: command.order,
        isActive: command.isActive,
        performedBy: command.performedBy,
      });

      await this._stepsRepository.save(step, transaction);

      this._eventBus.publish(step.getEvents());
    });
  }
}
