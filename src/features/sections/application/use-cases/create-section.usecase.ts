/*
 * Funcionalidad: Caso de uso CreateSectionUseCase
 * Descripción: Crea una sección con slug único; el orden por defecto es la siguiente posición y el estado por defecto es DRAFT; depende de ISectionRepository, ITransactionManager e IEventBus
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
import { CreateSectionCommand } from "@/features/sections/application/commands/create-section.command";
import { Section } from "@/features/sections/domain/entities/section.entity";
import { type ISectionRepository, SECTIONS_REPOSITORY_TOKEN } from "@/features/sections/domain/repositories/sections.repository";
import { SectionSlugAlreadyExistsError } from "@/features/sections/domain/sections.errors";

/**
 * @throws {SectionSlugAlreadyExistsError} If another section already has the slug
 */
@Injectable()
export class CreateSectionUseCase {
  public constructor(
    @Inject(SECTIONS_REPOSITORY_TOKEN)
    private readonly _sectionsRepository: ISectionRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: CreateSectionCommand): Promise<string> {
    return await this._transactionManager.run(async (transaction: unknown): Promise<string> => {
      if (await this._sectionsRepository.existsWithSlug(command.slug, undefined, transaction)) {
        throw new SectionSlugAlreadyExistsError();
      }

      const order: number = command.order ?? ((await this._sectionsRepository.getMaxOrder(transaction)) ?? -1) + 1;

      const section: Section = Section.create({
        slug: command.slug,
        title: command.title,
        description: command.description,
        order,
        status: command.status,
        performedBy: command.performedBy,
      });

      await this._sectionsRepository.save(section, transaction);

      this._eventBus.publish(section.getEvents());

      return section.id;
    });
  }
}
