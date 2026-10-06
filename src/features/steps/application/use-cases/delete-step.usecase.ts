/*
 * Funcionalidad: Caso de uso DeleteStepUseCase
 * Descripción: Ejecuta la operación DeleteStep de la feature de pasos (tarjetas); depende de IEventBus, ITransactionManager, IStepRepository
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
import { DeleteStepCommand } from "@/features/steps/application/commands/delete-step.command";
import { type Step } from "@/features/steps/domain/entities/step.entity";
import { type IStepRepository, STEPS_REPOSITORY_TOKEN } from "@/features/steps/domain/repositories/steps.repository";
import { StepNotFoundError } from "@/features/steps/domain/steps.errors";

/**
 * @throws {StepNotFoundError} If the step does not exist
 */
@Injectable()
export class DeleteStepUseCase {
  public constructor(
    @Inject(STEPS_REPOSITORY_TOKEN)
    private readonly _stepsRepository: IStepRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: DeleteStepCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const step: Step | undefined = await this._stepsRepository.getById(command.stepId, transaction);

      if (!step) {
        throw new StepNotFoundError();
      }

      step.deactivate(command.performedBy);

      await this._stepsRepository.save(step, transaction);

      this._eventBus.publish(step.getEvents());
    });
  }
}
