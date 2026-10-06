/*
 * Funcionalidad: Caso de uso RemoveModulePrerequisiteUseCase
 * Descripción: Ejecuta la operación RemoveModulePrerequisite de la feature de módulos; depende de IEventBus, ITransactionManager, IModuleRepository
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
import { ModulePrerequisiteCommand } from "@/features/modules/application/commands/module-prerequisite.command";
import { type Module } from "@/features/modules/domain/entities/module.entity";
import { ModulePrerequisiteNotFoundError } from "@/features/modules/domain/modules.errors";
import { type IModuleRepository, MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";

/**
 * @throws {ModulePrerequisiteNotFoundError} If the module does not exist or does not have the prerequisite
 */
@Injectable()
export class RemoveModulePrerequisiteUseCase {
  public constructor(
    @Inject(MODULES_REPOSITORY_TOKEN)
    private readonly _modulesRepository: IModuleRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: ModulePrerequisiteCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const module: Module | undefined = await this._modulesRepository.getById(command.moduleId, transaction);

      if (!module || !module.hasPrerequisite(command.prerequisiteId)) {
        throw new ModulePrerequisiteNotFoundError();
      }

      module.removePrerequisite(command.prerequisiteId, command.performedBy);

      await this._modulesRepository.save(module, transaction);

      this._eventBus.publish(module.getEvents());
    });
  }
}
