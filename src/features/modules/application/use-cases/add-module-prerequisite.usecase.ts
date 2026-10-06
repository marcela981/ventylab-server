/*
 * Funcionalidad: Caso de uso AddModulePrerequisiteUseCase
 * Descripción: Ejecuta la operación AddModulePrerequisite de la feature de módulos; depende de IEventBus, ITransactionManager, IModuleRepository
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
import { type PrerequisiteEdge, wouldCreateCycle } from "@/features/curriculum/domain/services/prerequisite-graph";
import { ModulePrerequisiteCommand } from "@/features/modules/application/commands/module-prerequisite.command";
import {
  ModuleCircularDependencyError,
  ModuleNotFoundError,
  ModulePrerequisiteAlreadyExistsError,
  ModuleSelfPrerequisiteError,
  PrerequisiteModuleNotFoundError,
} from "@/features/modules/domain/modules.errors";
import { type IModuleRepository, MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";

/**
 * @throws {ModuleNotFoundError} If the module does not exist
 * @throws {PrerequisiteModuleNotFoundError} If the prerequisite module does not exist
 * @throws {ModuleSelfPrerequisiteError} If the module and the prerequisite are the same
 * @throws {ModuleCircularDependencyError} If the prerequisite would create a dependency cycle
 * @throws {ModulePrerequisiteAlreadyExistsError} If the module already has the prerequisite
 */
@Injectable()
export class AddModulePrerequisiteUseCase {
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
      const [module, prerequisite] = await Promise.all([
        this._modulesRepository.getById(command.moduleId, transaction),
        this._modulesRepository.getById(command.prerequisiteId, transaction),
      ]);

      if (!module) {
        throw new ModuleNotFoundError();
      }

      if (!prerequisite) {
        throw new PrerequisiteModuleNotFoundError();
      }

      if (module.id === prerequisite.id) {
        throw new ModuleSelfPrerequisiteError();
      }

      if (module.hasPrerequisite(prerequisite.id)) {
        throw new ModulePrerequisiteAlreadyExistsError();
      }

      const edges: PrerequisiteEdge[] = await this._modulesRepository.getPrerequisiteEdges(transaction);

      if (wouldCreateCycle(edges, module.id, [...module.prerequisiteIds, prerequisite.id])) {
        throw new ModuleCircularDependencyError();
      }

      module.addPrerequisite(prerequisite.id, command.performedBy);

      await this._modulesRepository.save(module, transaction);

      this._eventBus.publish(module.getEvents());
    });
  }
}
