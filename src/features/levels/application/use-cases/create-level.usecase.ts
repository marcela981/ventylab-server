/*
 * Funcionalidad: Caso de uso CreateLevelUseCase
 * Descripción: Ejecuta la operación CreateLevel de la feature de niveles; depende de IEventBus, ITransactionManager, ILevelRepository
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
import { CreateLevelCommand } from "@/features/levels/application/commands/create-level.command";
import { Level } from "@/features/levels/domain/entities/level.entity";
import { LevelOrderAlreadyTakenError, LevelTitleAlreadyExistsError } from "@/features/levels/domain/levels.errors";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";
import { DEFAULT_LEVEL_TRACK_VALUE } from "@/features/levels/domain/value-objects/level-track";
import { type Section } from "@/features/sections/domain/entities/section.entity";
import { type ISectionRepository, SECTIONS_REPOSITORY_TOKEN } from "@/features/sections/domain/repositories/sections.repository";
import { SectionNotFoundError } from "@/features/sections/domain/sections.errors";

/**
 * @throws {LevelTitleAlreadyExistsError} If another level already has the title (case-insensitive)
 * @throws {LevelOrderAlreadyTakenError} If another level already has the requested order
 * @throws {SectionNotFoundError} If a section is given and does not exist
 */
@Injectable()
export class CreateLevelUseCase {
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

  public async execute(command: CreateLevelCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      if (await this._levelsRepository.existsWithTitle(command.title, undefined, transaction)) {
        throw new LevelTitleAlreadyExistsError();
      }

      if (command.order !== undefined && (await this._levelsRepository.getByOrder(command.order, undefined, transaction))) {
        throw new LevelOrderAlreadyTakenError(command.order);
      }

      await this._assertSectionExists(command.sectionId, transaction);

      const order: number = command.order ?? ((await this._levelsRepository.getMaxOrder(transaction)) ?? -1) + 1;

      const level: Level = Level.create({
        title: command.title,
        track: command.track ?? DEFAULT_LEVEL_TRACK_VALUE,
        description: command.description,
        order,
        status: command.status,
        sectionId: command.sectionId,
        performedBy: command.performedBy,
      });

      await this._levelsRepository.save(level, transaction);

      this._eventBus.publish(level.getEvents());
    });
  }

  private async _assertSectionExists(sectionId: string | undefined, transaction: unknown): Promise<void> {
    if (sectionId === undefined) {
      return;
    }

    const section: Section | undefined = await this._sectionsRepository.getById(sectionId, transaction);

    if (!section) {
      throw new SectionNotFoundError();
    }
  }
}
