/*
 * Funcionalidad: Caso de uso AddLevelPrerequisiteUseCase
 * Descripción: Ejecuta la operación AddLevelPrerequisite de la feature de niveles; depende de IEventBus, ITransactionManager, ILevelRepository
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
import { LevelPrerequisiteCommand } from "@/features/levels/application/commands/level-prerequisite.command";
import {
  LevelCircularDependencyError,
  LevelNotFoundError,
  LevelPrerequisiteAlreadyExistsError,
  LevelSelfPrerequisiteError,
  PrerequisiteLevelNotFoundError,
} from "@/features/levels/domain/levels.errors";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";

/**
 * @throws {LevelNotFoundError} If the level does not exist
 * @throws {PrerequisiteLevelNotFoundError} If the prerequisite level does not exist
 * @throws {LevelSelfPrerequisiteError} If the level and the prerequisite are the same
 * @throws {LevelCircularDependencyError} If the prerequisite would create a dependency cycle
 * @throws {LevelPrerequisiteAlreadyExistsError} If the level already has the prerequisite
 */
@Injectable()
export class AddLevelPrerequisiteUseCase {
  public constructor(
    @Inject(LEVELS_REPOSITORY_TOKEN)
    private readonly _levelsRepository: ILevelRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: LevelPrerequisiteCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const [level, prerequisite] = await Promise.all([
        this._levelsRepository.getById(command.levelId, transaction),
        this._levelsRepository.getById(command.prerequisiteLevelId, transaction),
      ]);

      if (!level) {
        throw new LevelNotFoundError();
      }

      if (!prerequisite) {
        throw new PrerequisiteLevelNotFoundError();
      }

      if (level.id === prerequisite.id) {
        throw new LevelSelfPrerequisiteError();
      }

      if (level.hasPrerequisite(prerequisite.id)) {
        throw new LevelPrerequisiteAlreadyExistsError();
      }

      const edges: PrerequisiteEdge[] = await this._levelsRepository.getPrerequisiteEdges(transaction);

      if (wouldCreateCycle(edges, level.id, [...level.prerequisiteLevelIds, prerequisite.id])) {
        throw new LevelCircularDependencyError();
      }

      level.addPrerequisite({ id: prerequisite.id, title: prerequisite.title, performedBy: command.performedBy });

      await this._levelsRepository.save(level, transaction);

      this._eventBus.publish(level.getEvents());
    });
  }
}
