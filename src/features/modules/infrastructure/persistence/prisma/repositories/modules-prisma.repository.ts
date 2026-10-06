/*
 * Funcionalidad: Repositorio Prisma ModulesPrismaRepository
 * Descripción: Implementa IModuleRepository sobre PrismaService y resolveClient para la feature de módulos
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
import { type Module, MODULE_ENTITY_COLLECTION, MODULE_ENTITY_TYPE } from "@/features/modules/domain/entities/module.entity";
import { type IModuleRepository } from "@/features/modules/domain/repositories/modules.repository";
import { type ModuleRow, ModulesMapper } from "@/features/modules/infrastructure/persistence/prisma/mappers/modules.mapper";

const PREREQUISITES_INCLUDE: { prerequisites: { select: { prerequisiteId: true } } } = {
  prerequisites: { select: { prerequisiteId: true } },
};

@Injectable()
export class ModulesPrismaRepository implements IModuleRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(id: string, transaction?: unknown): Promise<Module | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: ModuleRow | null = await client.module.findUnique({ where: { id }, include: PREREQUISITES_INCLUDE });

    return row ? ModulesMapper.toDomain(row) : undefined;
  }

  public async countExisting(ids: string[], transaction?: unknown): Promise<number> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.module.count({ where: { id: { in: ids } } });
  }

  public async existsWithTitle(title: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const count: number = await client.module.count({ where: { title: { equals: title, mode: "insensitive" } } });

    return count > 0;
  }

  public async getByOrder(order: number, excludeId?: string, transaction?: unknown): Promise<Module | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.ModuleWhereInput = { order };

    if (excludeId) where.id = { not: excludeId };

    const row: ModuleRow | null = await client.module.findFirst({ where, include: PREREQUISITES_INCLUDE });

    return row ? ModulesMapper.toDomain(row) : undefined;
  }

  public async getMaxOrderInLevel(levelId: string, transaction?: unknown): Promise<number | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const result: { _max: { order: number | null } } = await client.module.aggregate({ where: { levelId }, _max: { order: true } });

    return result._max.order ?? undefined;
  }

  public async getPrerequisiteEdges(transaction?: unknown): Promise<PrerequisiteEdge[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: { moduleId: string; prerequisiteId: string }[] = await client.modulePrerequisite.findMany({
      select: { moduleId: true, prerequisiteId: true },
    });

    return rows.map((row: { moduleId: string; prerequisiteId: string }) => ({ nodeId: row.moduleId, prerequisiteId: row.prerequisiteId }));
  }

  public async getOrderedItemsInLevel(levelId: string, transaction?: unknown): Promise<OrderedItem[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.module.findMany({ where: { levelId }, select: { id: true, order: true } });
  }

  public async applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void> {
    await applyReorder(resolveClient(this._prisma, transaction), "modules", entries);
  }

  public async save(module: Module, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.ModuleUncheckedCreateInput = ModulesMapper.toPersistence(module);
    const prerequisiteIds: string[] = [...module.prerequisiteIds];

    await client.module.upsert({
      where: { id: module.id },
      create: data,
      update: data,
    });

    await client.modulePrerequisite.deleteMany({
      where: { moduleId: module.id, prerequisiteId: { notIn: prerequisiteIds } },
    });

    if (prerequisiteIds.length > 0) {
      await client.modulePrerequisite.createMany({
        data: prerequisiteIds.map((prerequisiteId: string) => ({ id: generateId(), moduleId: module.id, prerequisiteId })),
        skipDuplicates: true,
      });
    }

    if (module.auditLogs.length > 0) {
      await this._auditLogRepository.save(MODULE_ENTITY_COLLECTION, MODULE_ENTITY_TYPE, module.id, module.auditLogs, transaction);
    }
  }
}
