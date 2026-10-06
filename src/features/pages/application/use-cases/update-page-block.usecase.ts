/*
 * Funcionalidad: Caso de uso UpdatePageBlockUseCase
 * Descripción: Reemplaza el tipo, título, contenido o media de un bloque de página revalidando y saneando el resultado completo y comprobando que la media referenciada exista; depende de IPageBlockRepository, IHtmlSanitizer e ITransactionManager
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { UpdatePageBlockCommand } from "@/features/pages/application/commands/update-page-block.command";
import { HTML_SANITIZER_TOKEN, type IHtmlSanitizer } from "@/features/pages/application/ports/html-sanitizer.interface";
import { type PageBlock } from "@/features/pages/domain/entities/page-block.entity";
import { InvalidPageBlockError, PageBlockNotFoundError, PageMediaNotFoundError } from "@/features/pages/domain/pages.errors";
import { type IPageBlockRepository, PAGE_BLOCKS_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/page-blocks.repository";
import { type BlockValidationResult, normalizeBlock } from "@/features/pages/domain/services/page-block-content";
import { type PageBlockTypeValue } from "@/features/pages/domain/value-objects/page-block-type";

/**
 * @throws {PageBlockNotFoundError} If the block does not exist or belongs to another page
 * @throws {InvalidPageBlockError} If the resulting block content does not match its type
 * @throws {PageMediaNotFoundError} If the referenced media does not exist
 */
@Injectable()
export class UpdatePageBlockUseCase {
  public constructor(
    @Inject(PAGE_BLOCKS_REPOSITORY_TOKEN)
    private readonly _pageBlocksRepository: IPageBlockRepository,
    @Inject(HTML_SANITIZER_TOKEN)
    private readonly _htmlSanitizer: IHtmlSanitizer,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: UpdatePageBlockCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const block: PageBlock | undefined = await this._pageBlocksRepository.getById(command.blockId, transaction);

      if (!block || block.pageId !== command.pageId) {
        throw new PageBlockNotFoundError();
      }

      const type: PageBlockTypeValue = command.type ?? block.type;
      const mediaId: string | undefined = command.mediaId === undefined ? block.mediaId : (command.mediaId ?? undefined);
      const result: BlockValidationResult = normalizeBlock({ type, content: command.content ?? block.content, mediaId }, this._htmlSanitizer);

      if (!result.valid) {
        throw new InvalidPageBlockError(result.reason);
      }

      if (result.mediaId && result.mediaId !== block.mediaId && !(await this._pageBlocksRepository.mediaExists(result.mediaId, transaction))) {
        throw new PageMediaNotFoundError();
      }

      block.replaceContent({
        type,
        title: command.title === undefined ? block.title : this._htmlSanitizer.stripTags(command.title),
        content: result.content,
        mediaId: result.mediaId,
        estimatedTime: command.estimatedTime ?? block.estimatedTime,
        performedBy: command.performedBy,
      });

      await this._pageBlocksRepository.save(block, transaction);
    });
  }
}
