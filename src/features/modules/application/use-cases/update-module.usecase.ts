/*
 * Funcionalidad: Caso de uso UpdateModuleUseCase
 * Descripción: Ejecuta la operación UpdateModule de la feature de módulos; depende de IEventBus, ITransactionManager, IModuleRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { UpdateModuleCommand } from "@/features/modules/application/commands/update-module.command";
import { type Module } from "@/features/modules/domain/entities/module.entity";
import { ModuleNotFoundError, ModuleOrderAlreadyTakenError } from "@/features/modules/domain/modules.errors";
import { type IModuleRepository, MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";

/**
 * @throws {ModuleNotFoundError} If the module does not exist
 * @throws {ModuleOrderAlreadyTakenError} If another module already has the new order
 */
@Injectable()
export class UpdateModuleUseCase {
  public constructor(
    @Inject(MODULES_REPOSITORY_TOKEN)
    private readonly _modulesRepository: IModuleRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UpdateModuleCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const module: Module | undefined = await this._modulesRepository.getById(command.moduleId, transaction);

      if (!module) {
        throw new ModuleNotFoundError();
      }

      if (
        command.order !== undefined &&
        command.order !== module.order &&
        (await this._modulesRepository.getByOrder(command.order, module.id, transaction))
      ) {
        throw new ModuleOrderAlreadyTakenError(command.order);
      }

      module.update({
        fields: {
          title: command.title,
          description: command.description,
          category: command.category,
          difficulty: command.difficulty,
          estimatedTime: command.estimatedTime,
          thumbnail: command.thumbnail,
          order: command.order,
          isActive: command.isActive,
          status: command.status,
        },
        performedBy: command.performedBy,
      });

      await this._modulesRepository.save(module, transaction);

      this._eventBus.publish(module.getEvents());
    });
  }
}
