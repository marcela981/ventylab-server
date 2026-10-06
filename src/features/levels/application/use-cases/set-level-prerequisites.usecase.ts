/*
 * Funcionalidad: Caso de uso SetLevelPrerequisitesUseCase
 * Descripción: Reemplaza en bloque los prerrequisitos de un nivel validando existencia, autorreferencia y ciclos con DFS sobre todas las aristas cargadas en una sola consulta; depende de IEventBus, ITransactionManager, ILevelRepository
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
import { SetLevelPrerequisitesCommand } from "@/features/levels/application/commands/set-level-prerequisites.command";
import { type Level } from "@/features/levels/domain/entities/level.entity";
import {
  LevelCircularDependencyError,
  LevelNotFoundError,
  LevelSelfPrerequisiteError,
  PrerequisiteLevelNotFoundError,
} from "@/features/levels/domain/levels.errors";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";

/**
 * @throws {LevelNotFoundError} If the level does not exist
 * @throws {LevelSelfPrerequisiteError} If the list contains the level itself
 * @throws {PrerequisiteLevelNotFoundError} If any prerequisite level does not exist
 * @throws {LevelCircularDependencyError} If the new prerequisites would create a dependency cycle
 */
@Injectable()
export class SetLevelPrerequisitesUseCase {
  public constructor(
    @Inject(LEVELS_REPOSITORY_TOKEN)
    private readonly _levelsRepository: ILevelRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: SetLevelPrerequisitesCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const level: Level | undefined = await this._levelsRepository.getById(command.levelId, transaction);

      if (!level) {
        throw new LevelNotFoundError();
      }

      const prerequisiteIds: string[] = [...new Set(command.prerequisiteLevelIds)];

      if (prerequisiteIds.includes(level.id)) {
        throw new LevelSelfPrerequisiteError();
      }

      const prerequisites: Level[] = prerequisiteIds.length > 0 ? await this._levelsRepository.getByIds(prerequisiteIds, transaction) : [];

      if (prerequisites.length !== prerequisiteIds.length) {
        throw new PrerequisiteLevelNotFoundError();
      }

      const edges: PrerequisiteEdge[] = await this._levelsRepository.getPrerequisiteEdges(transaction);

      if (wouldCreateCycle(edges, level.id, prerequisiteIds)) {
        throw new LevelCircularDependencyError();
      }

      level.replacePrerequisites(prerequisiteIds, command.performedBy);

      await this._levelsRepository.save(level, transaction);

      this._eventBus.publish(level.getEvents());
    });
  }
}
