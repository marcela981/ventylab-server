/*
 * Funcionalidad: Caso de uso ReorderPageBlocksUseCase
 * Descripción: Reordena por lotes todos los bloques de una página en una transacción con el plan de reordenamiento del dominio y una actualización SQL en dos fases que respeta la restricción única (pageId, order); depende de IPageRepository, IPageBlockRepository e ITransactionManager
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { buildReorderPlan, type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { type Page } from "@/features/pages/domain/entities/page.entity";
import { InvalidPageBlockReorderError, PageNotFoundError } from "@/features/pages/domain/pages.errors";
import { type IPageBlockRepository, PAGE_BLOCKS_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/page-blocks.repository";
import { type IPageRepository, PAGES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/pages.repository";

/**
 * @throws {PageNotFoundError} If the page does not exist
 * @throws {InvalidPageBlockReorderError} If the list is not exactly the blocks of the page, without duplicates
 */
@Injectable()
export class ReorderPageBlocksUseCase {
  public constructor(
    @Inject(PAGES_REPOSITORY_TOKEN)
    private readonly _pagesRepository: IPageRepository,
    @Inject(PAGE_BLOCKS_REPOSITORY_TOKEN)
    private readonly _pageBlocksRepository: IPageBlockRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(pageId: string, blockIds: string[]): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const page: Page | undefined = await this._pagesRepository.getById(pageId, transaction);

      if (!page) {
        throw new PageNotFoundError();
      }

      const current: OrderedItem[] = await this._pageBlocksRepository.getOrderedItemsInPage(page.id, transaction);
      const plan: ReorderEntry[] | undefined = buildReorderPlan(current, blockIds, true);

      if (!plan) {
        throw new InvalidPageBlockReorderError();
      }

      await this._pageBlocksRepository.applyOrder(plan, transaction);
    });
  }
}
