/*
 * Funcionalidad: Repositorio Prisma PageBlocksPrismaRepository
 * Descripción: Implementa IPageBlockRepository sobre PrismaService y resolveClient para los bloques (tabla page_sections); la comprobación de existencia de media es una lectura mínima de la tabla media, que pertenece a la feature de media
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type PageSection as PageSectionModel, type Prisma } from "@prisma/client";

import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { applyReorder } from "@/features/curriculum/infrastructure/persistence/prisma/apply-reorder";
import { type PageBlock } from "@/features/pages/domain/entities/page-block.entity";
import { type IPageBlockRepository } from "@/features/pages/domain/repositories/page-blocks.repository";
import { PagesPersistenceMapper } from "@/features/pages/infrastructure/persistence/prisma/mappers/pages.mapper";

@Injectable()
export class PageBlocksPrismaRepository implements IPageBlockRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getById(blockId: string, transaction?: unknown): Promise<PageBlock | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: PageSectionModel | null = await client.pageSection.findUnique({ where: { id: blockId } });

    return row ? PagesPersistenceMapper.toBlockDomain(row) : undefined;
  }

  public async getOrderedItemsInPage(pageId: string, transaction?: unknown): Promise<OrderedItem[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.pageSection.findMany({ where: { pageId }, select: { id: true, order: true } });
  }

  public async getMaxOrderInPage(pageId: string, transaction?: unknown): Promise<number | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const result: { _max: { order: number | null } } = await client.pageSection.aggregate({ where: { pageId }, _max: { order: true } });

    return result._max.order ?? undefined;
  }

  public async mediaExists(mediaId: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return (await client.media.count({ where: { id: mediaId } })) > 0;
  }

  public async applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void> {
    await applyReorder(resolveClient(this._prisma, transaction), "page_sections", entries);
  }

  public async save(block: PageBlock, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.PageSectionUncheckedCreateInput = PagesPersistenceMapper.toBlockPersistence(block);

    await client.pageSection.upsert({ where: { id: block.id }, create: data, update: data });
  }

  public async delete(blockId: string, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.pageSection.delete({ where: { id: blockId } });
  }
}
