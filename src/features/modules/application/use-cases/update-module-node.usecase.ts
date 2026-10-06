/*
 * Funcionalidad: Caso de uso UpdateModuleNodeUseCase
 * Descripción: Ejecuta la operación UpdateModuleNode de la feature de módulos; depende de IEventBus, ITransactionManager, IModuleRepository
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
import { UpdateModuleNodeCommand } from "@/features/modules/application/commands/update-module-node.command";
import { type Module } from "@/features/modules/domain/entities/module.entity";
import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import { type IModuleRepository, MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";

/**
 * @throws {ModuleNotFoundError} If the module does not exist
 */
@Injectable()
export class UpdateModuleNodeUseCase {
  public constructor(
    @Inject(MODULES_REPOSITORY_TOKEN)
    private readonly _modulesRepository: IModuleRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UpdateModuleNodeCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const module: Module | undefined = await this._modulesRepository.getById(command.moduleId, transaction);

      if (!module) {
        throw new ModuleNotFoundError();
      }

      module.updateNode({
        title: command.title,
        description: command.description,
        color: command.color,
        tags: command.tags,
        order: command.order,
        isActive: command.isActive,
        performedBy: command.performedBy,
      });

      await this._modulesRepository.save(module, transaction);

      this._eventBus.publish(module.getEvents());
    });
  }
}
