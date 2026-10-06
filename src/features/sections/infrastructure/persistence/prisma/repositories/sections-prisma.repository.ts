/*
 * Funcionalidad: Repositorio Prisma SectionsPrismaRepository
 * Descripción: Implementa ISectionRepository sobre PrismaService y resolveClient; el reordenamiento usa la actualización SQL en dos fases compartida del currículo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Prisma, type Section as SectionModel } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { applyReorder } from "@/features/curriculum/infrastructure/persistence/prisma/apply-reorder";
import { type Section, SECTION_ENTITY_COLLECTION, SECTION_ENTITY_TYPE } from "@/features/sections/domain/entities/section.entity";
import { type ISectionRepository } from "@/features/sections/domain/repositories/sections.repository";
import { SectionsMapper } from "@/features/sections/infrastructure/persistence/prisma/mappers/sections.mapper";

@Injectable()
export class SectionsPrismaRepository implements ISectionRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(id: string, transaction?: unknown): Promise<Section | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: SectionModel | null = await client.section.findUnique({ where: { id } });

    return row ? SectionsMapper.toDomain(row) : undefined;
  }

  public async existsWithSlug(slug: string, excludeId?: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.SectionWhereInput = { slug };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return (await client.section.count({ where })) > 0;
  }

  public async getMaxOrder(transaction?: unknown): Promise<number | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const result: { _max: { order: number | null } } = await client.section.aggregate({ _max: { order: true } });

    return result._max.order ?? undefined;
  }

  public async getOrderedItems(transaction?: unknown): Promise<OrderedItem[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.section.findMany({ select: { id: true, order: true } });
  }

  public async applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void> {
    await applyReorder(resolveClient(this._prisma, transaction), "sections", entries);
  }

  public async save(section: Section, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.SectionUncheckedCreateInput = SectionsMapper.toPersistence(section);

    await client.section.upsert({ where: { id: section.id }, create: data, update: data });

    if (section.auditLogs.length > 0) {
      await this._auditLogRepository.save(SECTION_ENTITY_COLLECTION, SECTION_ENTITY_TYPE, section.id, section.auditLogs, transaction);
    }
  }
}
