/*
 * Funcionalidad: Caso de uso CreateLevelNodeUseCase
 * Descripción: Ejecuta la operación CreateLevelNode de la feature de niveles; depende de IEventBus, ITransactionManager, ILevelRepository
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
import { CreateLevelNodeCommand } from "@/features/levels/application/commands/create-level-node.command";
import { Level } from "@/features/levels/domain/entities/level.entity";
import { LevelTitleAlreadyExistsError, ParentLevelNotFoundError } from "@/features/levels/domain/levels.errors";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";
import { DEFAULT_LEVEL_TRACK_VALUE } from "@/features/levels/domain/value-objects/level-track";

/**
 * @throws {ParentLevelNotFoundError} If a parent level is given and does not exist
 * @throws {LevelTitleAlreadyExistsError} If another level already has the title (case-insensitive)
 */
@Injectable()
export class CreateLevelNodeUseCase {
  public constructor(
    @Inject(LEVELS_REPOSITORY_TOKEN)
    private readonly _levelsRepository: ILevelRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: CreateLevelNodeCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      if (command.parentId && !(await this._levelsRepository.getById(command.parentId, transaction))) {
        throw new ParentLevelNotFoundError();
      }

      if (await this._levelsRepository.existsWithTitle(command.title, undefined, transaction)) {
        throw new LevelTitleAlreadyExistsError();
      }

      const order: number = command.order ?? ((await this._levelsRepository.getMaxOrderUnderParent(command.parentId, transaction)) ?? -1) + 1;

      const level: Level = Level.createNode({
        title: command.title,
        track: command.track ?? DEFAULT_LEVEL_TRACK_VALUE,
        description: command.description,
        color: command.color,
        tags: command.tags ?? [],
        order,
        parentId: command.parentId,
        performedBy: command.performedBy,
      });

      await this._levelsRepository.save(level, transaction);

      this._eventBus.publish(level.getEvents());
    });
  }
}
