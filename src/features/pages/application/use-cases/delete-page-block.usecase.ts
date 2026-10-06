/*
 * Funcionalidad: Caso de uso DeletePageBlockUseCase
 * Descripción: Elimina un bloque de una página validando que pertenezca a ella; depende de IPageBlockRepository e ITransactionManager
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type PageBlock } from "@/features/pages/domain/entities/page-block.entity";
import { PageBlockNotFoundError } from "@/features/pages/domain/pages.errors";
import { type IPageBlockRepository, PAGE_BLOCKS_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/page-blocks.repository";

/**
 * @throws {PageBlockNotFoundError} If the block does not exist or belongs to another page
 */
@Injectable()
export class DeletePageBlockUseCase {
  public constructor(
    @Inject(PAGE_BLOCKS_REPOSITORY_TOKEN)
    private readonly _pageBlocksRepository: IPageBlockRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(pageId: string, blockId: string): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const block: PageBlock | undefined = await this._pageBlocksRepository.getById(blockId, transaction);

      if (!block || block.pageId !== pageId) {
        throw new PageBlockNotFoundError();
      }

      await this._pageBlocksRepository.delete(block.id, transaction);
    });
  }
}
