/*
 * Funcionalidad: Caso de uso CreateModuleNodeUseCase
 * Descripción: Ejecuta la operación CreateModuleNode de la feature de módulos; depende de IEventBus, ITransactionManager, ILevelRepository, IModuleRepository
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
import { LevelNotFoundError } from "@/features/levels/domain/levels.errors";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";
import { CreateModuleNodeCommand } from "@/features/modules/application/commands/create-module-node.command";
import { Module } from "@/features/modules/domain/entities/module.entity";
import { ModuleNodeLevelRequiredError } from "@/features/modules/domain/modules.errors";
import { type IModuleRepository, MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";

/**
 * @throws {ModuleNodeLevelRequiredError} If no level ID is given
 * @throws {LevelNotFoundError} If the level does not exist
 */
@Injectable()
export class CreateModuleNodeUseCase {
  public constructor(
    @Inject(MODULES_REPOSITORY_TOKEN)
    private readonly _modulesRepository: IModuleRepository,
    @Inject(LEVELS_REPOSITORY_TOKEN)
    private readonly _levelsRepository: ILevelRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: CreateModuleNodeCommand): Promise<void> {
    const levelId: string | undefined = command.levelId;

    if (!levelId) {
      throw new ModuleNodeLevelRequiredError();
    }

    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      if (!(await this._levelsRepository.getById(levelId, transaction))) {
        throw new LevelNotFoundError();
      }

      const order: number = command.order ?? ((await this._modulesRepository.getMaxOrderInLevel(levelId, transaction)) ?? -1) + 1;

      const module: Module = Module.createNode({
        levelId,
        title: command.title,
        description: command.description,
        color: command.color,
        tags: command.tags ?? [],
        order,
        performedBy: command.performedBy,
      });

      await this._modulesRepository.save(module, transaction);

      this._eventBus.publish(module.getEvents());
    });
  }
}
