/*
 * Funcionalidad: Caso de uso SetModulePrerequisitesUseCase
 * Descripción: Reemplaza en bloque los prerrequisitos de un módulo validando existencia, autorreferencia y ciclos con DFS sobre todas las aristas cargadas en una sola consulta; depende de IModuleRepository, ITransactionManager e IEventBus
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
import { type PrerequisiteEdge, wouldCreateCycle } from "@/features/curriculum/domain/services/prerequisite-graph";
import { SetModulePrerequisitesCommand } from "@/features/modules/application/commands/set-module-prerequisites.command";
import { type Module } from "@/features/modules/domain/entities/module.entity";
import {
  InvalidModulePrerequisitesError,
  ModuleCircularDependencyError,
  ModuleNotFoundError,
  ModuleSelfPrerequisiteError,
} from "@/features/modules/domain/modules.errors";
import { type IModuleRepository, MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";

/**
 * @throws {ModuleNotFoundError} If the module does not exist
 * @throws {ModuleSelfPrerequisiteError} If the list contains the module itself
 * @throws {InvalidModulePrerequisitesError} If any prerequisite module does not exist
 * @throws {ModuleCircularDependencyError} If the new prerequisites would create a dependency cycle
 */
@Injectable()
export class SetModulePrerequisitesUseCase {
  public constructor(
    @Inject(MODULES_REPOSITORY_TOKEN)
    private readonly _modulesRepository: IModuleRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: SetModulePrerequisitesCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const module: Module | undefined = await this._modulesRepository.getById(command.moduleId, transaction);

      if (!module) {
        throw new ModuleNotFoundError();
      }

      const prerequisiteIds: string[] = [...new Set(command.prerequisiteIds)];

      if (prerequisiteIds.includes(module.id)) {
        throw new ModuleSelfPrerequisiteError();
      }

      if (prerequisiteIds.length > 0 && (await this._modulesRepository.countExisting(prerequisiteIds, transaction)) !== prerequisiteIds.length) {
        throw new InvalidModulePrerequisitesError();
      }

      const edges: PrerequisiteEdge[] = await this._modulesRepository.getPrerequisiteEdges(transaction);

      if (wouldCreateCycle(edges, module.id, prerequisiteIds)) {
        throw new ModuleCircularDependencyError();
      }

      module.replacePrerequisites(prerequisiteIds, command.performedBy);

      await this._modulesRepository.save(module, transaction);

      this._eventBus.publish(module.getEvents());
    });
  }
}
