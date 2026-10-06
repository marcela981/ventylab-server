/*
 * Funcionalidad: Repositorio Prisma LevelsPrismaRepository
 * Descripción: Implementa ILevelRepository sobre PrismaService y resolveClient para la feature de niveles
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { generateId } from "@/common/domain/utils/generate-id";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type PrerequisiteEdge } from "@/features/curriculum/domain/services/prerequisite-graph";
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { applyReorder } from "@/features/curriculum/infrastructure/persistence/prisma/apply-reorder";
import { type Level, LEVEL_ENTITY_COLLECTION, LEVEL_ENTITY_TYPE } from "@/features/levels/domain/entities/level.entity";
import { type ILevelRepository } from "@/features/levels/domain/repositories/levels.repository";
import { type LevelRow, LevelsMapper } from "@/features/levels/infrastructure/persistence/prisma/mappers/levels.mapper";

const PREREQUISITES_INCLUDE: { prerequisites: { select: { prerequisiteLevelId: true } } } = {
  prerequisites: { select: { prerequisiteLevelId: true } },
};

@Injectable()
export class LevelsPrismaRepository implements ILevelRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(id: string, transaction?: unknown): Promise<Level | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: LevelRow | null = await client.level.findUnique({ where: { id }, include: PREREQUISITES_INCLUDE });

    return row ? LevelsMapper.toDomain(row) : undefined;
  }

  public async getByIds(ids: string[], transaction?: unknown): Promise<Level[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: LevelRow[] = await client.level.findMany({ where: { id: { in: ids } }, include: PREREQUISITES_INCLUDE });

    return rows.map((row: LevelRow) => LevelsMapper.toDomain(row));
  }

  public async existsWithTitle(title: string, excludeId?: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.LevelWhereInput = { title: { equals: title, mode: "insensitive" } };

    if (excludeId) where.id = { not: excludeId };

    const count: number = await client.level.count({ where });

    return count > 0;
  }

  public async getByOrder(order: number, excludeId?: string, transaction?: unknown): Promise<Level | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.LevelWhereInput = { order };

    if (excludeId) where.id = { not: excludeId };

    const row: LevelRow | null = await client.level.findFirst({ where, include: PREREQUISITES_INCLUDE });

    return row ? LevelsMapper.toDomain(row) : undefined;
  }

  public async getMaxOrder(transaction?: unknown): Promise<number | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const result: { _max: { order: number | null } } = await client.level.aggregate({ _max: { order: true } });

    return result._max.order ?? undefined;
  }

  public async getMaxOrderUnderParent(parentId?: string, transaction?: unknown): Promise<number | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const result: { _max: { order: number | null } } = await client.level.aggregate({
      where: { parentId: parentId ?? null },
      _max: { order: true },
    });

    return result._max.order ?? undefined;
  }

  public async getPrerequisiteEdges(transaction?: unknown): Promise<PrerequisiteEdge[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: { levelId: string; prerequisiteLevelId: string }[] = await client.levelPrerequisite.findMany({
      select: { levelId: true, prerequisiteLevelId: true },
    });

    return rows.map((row: { levelId: string; prerequisiteLevelId: string }) => ({ nodeId: row.levelId, prerequisiteId: row.prerequisiteLevelId }));
  }

  public async getOrderedItems(transaction?: unknown): Promise<OrderedItem[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.level.findMany({ select: { id: true, order: true } });
  }

  public async applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void> {
    await applyReorder(resolveClient(this._prisma, transaction), "levels", entries);
  }

  public async save(level: Level, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.LevelUncheckedCreateInput = LevelsMapper.toPersistence(level);
    const prerequisiteLevelIds: string[] = [...level.prerequisiteLevelIds];

    await client.level.upsert({
      where: { id: level.id },
      create: data,
      update: data,
    });

    await client.levelPrerequisite.deleteMany({
      where: { levelId: level.id, prerequisiteLevelId: { notIn: prerequisiteLevelIds } },
    });

    if (prerequisiteLevelIds.length > 0) {
      await client.levelPrerequisite.createMany({
        data: prerequisiteLevelIds.map((prerequisiteLevelId: string) => ({ id: generateId(), levelId: level.id, prerequisiteLevelId })),
        skipDuplicates: true,
      });
    }

    if (level.auditLogs.length > 0) {
      await this._auditLogRepository.save(LEVEL_ENTITY_COLLECTION, LEVEL_ENTITY_TYPE, level.id, level.auditLogs, transaction);
    }
  }
}
