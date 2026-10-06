/*
 * Funcionalidad: Caso de uso UpdateSectionUseCase
 * Descripción: Actualiza el slug, título, descripción o estado de una sección validando que el slug siga siendo único; depende de ISectionRepository, ITransactionManager e IEventBus
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
import { UpdateSectionCommand } from "@/features/sections/application/commands/update-section.command";
import { type Section } from "@/features/sections/domain/entities/section.entity";
import { type ISectionRepository, SECTIONS_REPOSITORY_TOKEN } from "@/features/sections/domain/repositories/sections.repository";
import { SectionNotFoundError, SectionSlugAlreadyExistsError } from "@/features/sections/domain/sections.errors";

/**
 * @throws {SectionNotFoundError} If the section does not exist
 * @throws {SectionSlugAlreadyExistsError} If another section already has the new slug
 */
@Injectable()
export class UpdateSectionUseCase {
  public constructor(
    @Inject(SECTIONS_REPOSITORY_TOKEN)
    private readonly _sectionsRepository: ISectionRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UpdateSectionCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const section: Section | undefined = await this._sectionsRepository.getById(command.sectionId, transaction);

      if (!section) {
        throw new SectionNotFoundError();
      }

      if (command.slug && command.slug !== section.slug && (await this._sectionsRepository.existsWithSlug(command.slug, section.id, transaction))) {
        throw new SectionSlugAlreadyExistsError();
      }

      section.update({
        slug: command.slug,
        title: command.title,
        description: command.description,
        status: command.status,
        performedBy: command.performedBy,
      });

      await this._sectionsRepository.save(section, transaction);

      this._eventBus.publish(section.getEvents());
    });
  }
}
