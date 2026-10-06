/*
 * Funcionalidad: Caso de uso UpdatePageUseCase
 * Descripción: Actualiza los metadatos o el estado de una página; antes de aplicar el cambio guarda una instantánea de la versión actual (título, tipo y bloques) en PageRevision e incrementa la versión; depende de IPageRepository e ITransactionManager
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { UpdatePageCommand } from "@/features/pages/application/commands/update-page.command";
import { type Page } from "@/features/pages/domain/entities/page.entity";
import { PageNotFoundError, PageSlugAlreadyExistsError } from "@/features/pages/domain/pages.errors";
import { type IPageRepository, PAGES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/pages.repository";

/**
 * @throws {PageNotFoundError} If the page does not exist
 * @throws {PageSlugAlreadyExistsError} If another page of the module already has the new slug
 */
@Injectable()
export class UpdatePageUseCase {
  public constructor(
    @Inject(PAGES_REPOSITORY_TOKEN)
    private readonly _pagesRepository: IPageRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: UpdatePageCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const page: Page | undefined = await this._pagesRepository.getById(command.pageId, transaction);

      if (!page) {
        throw new PageNotFoundError();
      }

      const slug: string | undefined = command.fields.slug;

      if (slug && slug !== page.slug && (await this._pagesRepository.existsWithSlugInModule(page.moduleId, slug, page.id, transaction))) {
        throw new PageSlugAlreadyExistsError();
      }

      await this._pagesRepository.saveRevision(page, command.performedBy, command.changeLog, transaction);

      page.update(command.fields, command.performedBy);

      await this._pagesRepository.save(page, transaction);
    });
  }
}
