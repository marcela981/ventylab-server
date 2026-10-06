/*
 * Funcionalidad: Caso de uso RemoveLevelPrerequisiteUseCase
 * Descripción: Ejecuta la operación RemoveLevelPrerequisite de la feature de niveles; depende de IEventBus, ITransactionManager, ILevelRepository
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
import { LevelPrerequisiteCommand } from "@/features/levels/application/commands/level-prerequisite.command";
import { LevelPrerequisiteNotFoundError } from "@/features/levels/domain/levels.errors";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";

/**
 * @throws {LevelPrerequisiteNotFoundError} If the level does not exist or does not have the prerequisite
 */
@Injectable()
export class RemoveLevelPrerequisiteUseCase {
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

      if (!level || !prerequisite || !level.hasPrerequisite(prerequisite.id)) {
        throw new LevelPrerequisiteNotFoundError();
      }

      level.removePrerequisite({ id: prerequisite.id, title: prerequisite.title, performedBy: command.performedBy });

      await this._levelsRepository.save(level, transaction);

      this._eventBus.publish(level.getEvents());
    });
  }
}
