/*
 * Funcionalidad: Caso de uso UpdateLevelNodeUseCase
 * Descripción: Ejecuta la operación UpdateLevelNode de la feature de niveles; depende de IEventBus, ITransactionManager, ILevelRepository
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
import { UpdateLevelNodeCommand } from "@/features/levels/application/commands/update-level-node.command";
import { type Level } from "@/features/levels/domain/entities/level.entity";
import { LevelNotFoundError, LevelTitleAlreadyExistsError } from "@/features/levels/domain/levels.errors";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";

/**
 * @throws {LevelNotFoundError} If the level does not exist
 * @throws {LevelTitleAlreadyExistsError} If another level already has the new title (case-insensitive)
 */
@Injectable()
export class UpdateLevelNodeUseCase {
  public constructor(
    @Inject(LEVELS_REPOSITORY_TOKEN)
    private readonly _levelsRepository: ILevelRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UpdateLevelNodeCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const level: Level | undefined = await this._levelsRepository.getById(command.levelId, transaction);

      if (!level) {
        throw new LevelNotFoundError();
      }

      if (command.title && command.title !== level.title && (await this._levelsRepository.existsWithTitle(command.title, level.id, transaction))) {
        throw new LevelTitleAlreadyExistsError();
      }

      level.updateNode({
        title: command.title,
        description: command.description,
        color: command.color,
        tags: command.tags,
        order: command.order,
        isActive: command.isActive,
        performedBy: command.performedBy,
      });

      await this._levelsRepository.save(level, transaction);

      this._eventBus.publish(level.getEvents());
    });
  }
}
