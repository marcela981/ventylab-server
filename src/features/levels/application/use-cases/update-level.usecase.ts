/*
 * Funcionalidad: Caso de uso UpdateLevelUseCase
 * Descripción: Ejecuta la operación UpdateLevel de la feature de niveles; depende de IEventBus, ITransactionManager, ILevelRepository
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
import { UpdateLevelCommand } from "@/features/levels/application/commands/update-level.command";
import { type Level } from "@/features/levels/domain/entities/level.entity";
import { LevelNotFoundError, LevelOrderAlreadyTakenError, LevelTitleAlreadyExistsError } from "@/features/levels/domain/levels.errors";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";
import { type ISectionRepository, SECTIONS_REPOSITORY_TOKEN } from "@/features/sections/domain/repositories/sections.repository";
import { SectionNotFoundError } from "@/features/sections/domain/sections.errors";

/**
 * @throws {LevelNotFoundError} If the level does not exist
 * @throws {LevelTitleAlreadyExistsError} If another level already has the new title (case-insensitive)
 * @throws {LevelOrderAlreadyTakenError} If another level already has the new order
 * @throws {SectionNotFoundError} If a section is given and does not exist
 */
@Injectable()
export class UpdateLevelUseCase {
  public constructor(
    @Inject(LEVELS_REPOSITORY_TOKEN)
    private readonly _levelsRepository: ILevelRepository,
    @Inject(SECTIONS_REPOSITORY_TOKEN)
    private readonly _sectionsRepository: ISectionRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UpdateLevelCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const level: Level | undefined = await this._levelsRepository.getById(command.levelId, transaction);

      if (!level) {
        throw new LevelNotFoundError();
      }

      if (command.title && command.title !== level.title && (await this._levelsRepository.existsWithTitle(command.title, level.id, transaction))) {
        throw new LevelTitleAlreadyExistsError();
      }

      if (
        command.order !== undefined &&
        command.order !== level.order &&
        (await this._levelsRepository.getByOrder(command.order, level.id, transaction))
      ) {
        throw new LevelOrderAlreadyTakenError(command.order);
      }

      if (command.sectionId !== undefined && !(await this._sectionsRepository.getById(command.sectionId, transaction))) {
        throw new SectionNotFoundError();
      }

      level.update({
        title: command.title,
        track: command.track,
        description: command.description,
        order: command.order,
        isActive: command.isActive,
        status: command.status,
        sectionId: command.sectionId,
        performedBy: command.performedBy,
      });

      await this._levelsRepository.save(level, transaction);

      this._eventBus.publish(level.getEvents());
    });
  }
}
