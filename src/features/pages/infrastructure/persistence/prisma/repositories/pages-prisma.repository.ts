/*
 * Funcionalidad: Repositorio Prisma PagesPrismaRepository
 * Descripción: Implementa IPageRepository sobre PrismaService y resolveClient: CRUD de páginas, instantáneas de versión en PageRevision y reordenamiento por lotes con la actualización SQL en dos fases compartida del currículo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Page as PageModel, type PageType, type Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { generateId } from "@/common/domain/utils/generate-id";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { applyReorder } from "@/features/curriculum/infrastructure/persistence/prisma/apply-reorder";
import { type Page, PAGE_ENTITY_COLLECTION, PAGE_ENTITY_TYPE } from "@/features/pages/domain/entities/page.entity";
import { type IPageRepository } from "@/features/pages/domain/repositories/pages.repository";
import { PagesPersistenceMapper } from "@/features/pages/infrastructure/persistence/prisma/mappers/pages.mapper";

@Injectable()
export class PagesPrismaRepository implements IPageRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(id: string, transaction?: unknown): Promise<Page | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: PageModel | null = await client.page.findUnique({ where: { id } });

    return row ? PagesPersistenceMapper.toDomain(row) : undefined;
  }

  public async existsWithSlugInModule(moduleId: string, slug: string, excludeId?: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.PageWhereInput = { moduleId, slug };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return (await client.page.count({ where })) > 0;
  }

  public async getMaxOrderInModule(moduleId: string, transaction?: unknown): Promise<number | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const result: { _max: { order: number | null } } = await client.page.aggregate({ where: { moduleId }, _max: { order: true } });

    return result._max.order ?? undefined;
  }

  public async getOrderedItemsInLesson(lessonId: string, transaction?: unknown): Promise<OrderedItem[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.page.findMany({ where: { lessonId }, select: { id: true, order: true } });
  }

  public async applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void> {
    await applyReorder(resolveClient(this._prisma, transaction), "pages", entries);
  }

  public async saveRevision(page: Page, changedBy: string, changeLog?: string, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const sections: { id: string; order: number; type: string; title: string | null; content: Prisma.JsonValue; mediaId: string | null }[] =
      await client.pageSection.findMany({
        where: { pageId: page.id, isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, order: true, type: true, title: true, content: true, mediaId: true },
      });

    await client.pageRevision.createMany({
      data: [
        {
          id: generateId(),
          pageId: page.id,
          version: page.version,
          title: page.title,
          type: page.type as PageType,
          sectionsSnapshot: sections,
          changeLog: changeLog ?? null,
          changedBy,
        },
      ],
      skipDuplicates: true,
    });
  }

  public async save(page: Page, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.PageUncheckedCreateInput = PagesPersistenceMapper.toPersistence(page);

    await client.page.upsert({ where: { id: page.id }, create: data, update: data });

    if (page.auditLogs.length > 0) {
      await this._auditLogRepository.save(PAGE_ENTITY_COLLECTION, PAGE_ENTITY_TYPE, page.id, page.auditLogs, transaction);
    }
  }
}
