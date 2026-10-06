/*
 * Funcionalidad: Caso de uso CreateModuleUseCase
 * Descripción: Ejecuta la operación CreateModule de la feature de módulos; depende de IEventBus, ITransactionManager, ILevelRepository, IModuleRepository
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
import { LevelNotFoundError } from "@/features/levels/domain/levels.errors";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";
import { CreateModuleCommand } from "@/features/modules/application/commands/create-module.command";
import { Module } from "@/features/modules/domain/entities/module.entity";
import { InvalidModulePrerequisitesError, ModuleTitleAlreadyExistsError } from "@/features/modules/domain/modules.errors";
import { type IModuleRepository, MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";

/**
 * @throws {ModuleTitleAlreadyExistsError} If another module already has the title (case-insensitive)
 * @throws {InvalidModulePrerequisitesError} If any prerequisite module does not exist
 * @throws {LevelNotFoundError} If a level is given and does not exist
 */
@Injectable()
export class CreateModuleUseCase {
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

  public async execute(command: CreateModuleCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      if (await this._modulesRepository.existsWithTitle(command.title, transaction)) {
        throw new ModuleTitleAlreadyExistsError();
      }

      const prerequisiteIds: string[] = command.prerequisiteIds ?? [];

      if (prerequisiteIds.length > 0 && (await this._modulesRepository.countExisting(prerequisiteIds, transaction)) !== prerequisiteIds.length) {
        throw new InvalidModulePrerequisitesError();
      }

      if (command.levelId && !(await this._levelsRepository.getById(command.levelId, transaction))) {
        throw new LevelNotFoundError();
      }

      const module: Module = Module.create({
        levelId: command.levelId,
        title: command.title,
        description: command.description,
        category: command.category,
        difficulty: command.difficulty,
        estimatedTime: command.estimatedTime,
        thumbnail: command.thumbnail,
        order: command.order,
        prerequisiteIds,
        status: command.status,
        performedBy: command.performedBy,
      });

      await this._modulesRepository.save(module, transaction);

      this._eventBus.publish(module.getEvents());
    });
  }
}
