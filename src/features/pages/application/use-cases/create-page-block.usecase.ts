/*
 * Funcionalidad: Caso de uso CreatePageBlockUseCase
 * Descripción: Agrega un bloque al final de una página tras validar y sanear su contenido por tipo y comprobar que la media referenciada exista, y audita CONTENT_CREATED en la misma transacción; depende de IPageRepository, IPageBlockRepository, IHtmlSanitizer, IAuditRecorder e ITransactionManager
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { AUDIT_ACTIONS } from "@/common/domain/audit/audit-action";
import { CreatePageBlockCommand } from "@/features/pages/application/commands/create-page-block.command";
import { HTML_SANITIZER_TOKEN, type IHtmlSanitizer } from "@/features/pages/application/ports/html-sanitizer.interface";
import { PAGE_BLOCK_AUDIT_TARGET, PageBlock } from "@/features/pages/domain/entities/page-block.entity";
import { type Page } from "@/features/pages/domain/entities/page.entity";
import { InvalidPageBlockError, PageMediaNotFoundError, PageNotFoundError } from "@/features/pages/domain/pages.errors";
import { type IPageBlockRepository, PAGE_BLOCKS_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/page-blocks.repository";
import { type IPageRepository, PAGES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/pages.repository";
import { type BlockValidationResult, normalizeBlock } from "@/features/pages/domain/services/page-block-content";

/**
 * @throws {PageNotFoundError} If the page does not exist
 * @throws {InvalidPageBlockError} If the block content does not match its type
 * @throws {PageMediaNotFoundError} If the referenced media does not exist
 */
@Injectable()
export class CreatePageBlockUseCase {
  public constructor(
    @Inject(PAGES_REPOSITORY_TOKEN)
    private readonly _pagesRepository: IPageRepository,
    @Inject(PAGE_BLOCKS_REPOSITORY_TOKEN)
    private readonly _pageBlocksRepository: IPageBlockRepository,
    @Inject(HTML_SANITIZER_TOKEN)
    private readonly _htmlSanitizer: IHtmlSanitizer,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
  ) {}

  public async execute(command: CreatePageBlockCommand): Promise<string> {
    const result: BlockValidationResult = normalizeBlock({ type: command.type, content: command.content, mediaId: command.mediaId }, this._htmlSanitizer);

    if (!result.valid) {
      throw new InvalidPageBlockError(result.reason);
    }

    return await this._transactionManager.run(async (transaction: unknown): Promise<string> => {
      const page: Page | undefined = await this._pagesRepository.getById(command.pageId, transaction);

      if (!page) {
        throw new PageNotFoundError();
      }

      if (result.mediaId && !(await this._pageBlocksRepository.mediaExists(result.mediaId, transaction))) {
        throw new PageMediaNotFoundError();
      }

      const order: number = ((await this._pageBlocksRepository.getMaxOrderInPage(page.id, transaction)) ?? -1) + 1;

      const block: PageBlock = PageBlock.create({
        pageId: page.id,
        order,
        type: command.type,
        title: command.title === undefined ? undefined : this._htmlSanitizer.stripTags(command.title),
        content: result.content,
        mediaId: result.mediaId,
        estimatedTime: command.estimatedTime,
        performedBy: command.performedBy,
      });

      await this._pageBlocksRepository.save(block, transaction);
      await this._auditRecorder.record(command.performedBy, AUDIT_ACTIONS.CONTENT_CREATED, PAGE_BLOCK_AUDIT_TARGET, block.id, {}, block.toAuditState(), transaction);

      return block.id;
    });
  }
}
