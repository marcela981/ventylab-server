/*
 * Funcionalidad: Repositorio Prisma ChangeLogPrismaRepository
 * Descripción: Implementa IChangeLogRepository sobre PrismaService y resolveClient para la feature de historial de cambios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type ChangeLogEntry } from "@/features/changelog/domain/entities/change-log-entry.entity";
import { type GetChangeLogQuery, type IChangeLogRepository } from "@/features/changelog/domain/repositories/changelog.repository";
import { ChangeLogStats } from "@/features/changelog/domain/value-objects/change-log-stats";
import { ChangeLogMapper, type ChangeLogRow } from "@/features/changelog/infrastructure/persistence/prisma/mappers/changelog.mapper";

const AUTHOR_INCLUDE: { user: { select: { id: true; name: true; email: true; role: true } } } = {
  user: { select: { id: true, name: true, email: true, role: true } },
};

@Injectable()
export class ChangeLogPrismaRepository implements IChangeLogRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getAll(query: GetChangeLogQuery, transaction?: unknown): Promise<Paginated<ChangeLogEntry>> {
    const { page, limit, entityType, entityId, action, changedBy, createdAtFrom, createdAtTo } = query;

    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.ChangeLogWhereInput = {};

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (changedBy) where.changedBy = changedBy;

    if (createdAtFrom || createdAtTo) {
      where.changedAt = { gte: createdAtFrom, lte: createdAtTo };
    }

    const [rows, total] = await Promise.all([
      client.changeLog.findMany({
        where,
        orderBy: { changedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: AUTHOR_INCLUDE,
      }),
      client.changeLog.count({ where }),
    ]);

    return new Paginated({
      items: rows.map((row: ChangeLogRow) => ChangeLogMapper.toDomain(row)),
      total,
      page,
      limit,
    });
  }

  public async getRecent(limit: number, changedBy?: string, transaction?: unknown): Promise<ChangeLogEntry[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: ChangeLogRow[] = await client.changeLog.findMany({
      where: changedBy ? { changedBy } : {},
      take: limit,
      orderBy: { changedAt: "desc" },
      include: AUTHOR_INCLUDE,
    });

    return rows.map((row: ChangeLogRow) => ChangeLogMapper.toDomain(row));
  }

  public async getEntityHistory(entityType: string, entityId: string, changedBy?: string, transaction?: unknown): Promise<ChangeLogEntry[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.ChangeLogWhereInput = { entityType, entityId };

    if (changedBy) where.changedBy = changedBy;

    const rows: ChangeLogRow[] = await client.changeLog.findMany({
      where,
      orderBy: { changedAt: "desc" },
      include: AUTHOR_INCLUDE,
    });

    return rows.map((row: ChangeLogRow) => ChangeLogMapper.toDomain(row));
  }

  public async getStats(fromDate: Date, toDate: Date, changedBy?: string, transaction?: unknown): Promise<ChangeLogStats> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.ChangeLogWhereInput = { changedAt: { gte: fromDate, lte: toDate } };

    if (changedBy) where.changedBy = changedBy;

    const [totalChanges, byEntityType, byAction] = await Promise.all([
      client.changeLog.count({ where }),
      client.changeLog.groupBy({ by: ["entityType"], where, _count: { _all: true } }),
      client.changeLog.groupBy({ by: ["action"], where, _count: { _all: true } }),
    ]);

    return new ChangeLogStats({
      totalChanges,
      byEntityType: Object.fromEntries(byEntityType.map((item: { entityType: string; _count: { _all: number } }) => [item.entityType, item._count._all])),
      byAction: Object.fromEntries(byAction.map((item: { action: string; _count: { _all: number } }) => [item.action, item._count._all])),
    });
  }

  public async save(entry: ChangeLogEntry, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.changeLog.create({ data: ChangeLogMapper.toPersistence(entry) });
  }
}
