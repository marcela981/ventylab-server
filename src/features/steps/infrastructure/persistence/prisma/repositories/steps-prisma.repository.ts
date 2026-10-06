/*
 * Funcionalidad: Repositorio Prisma StepsPrismaRepository
 * Descripción: Implementa IStepRepository sobre PrismaService y resolveClient para la feature de pasos (tarjetas)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Prisma, type Step as StepModel } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { applyReorder } from "@/features/curriculum/infrastructure/persistence/prisma/apply-reorder";
import { type Step, STEP_ENTITY_COLLECTION, STEP_ENTITY_TYPE } from "@/features/steps/domain/entities/step.entity";
import { type IStepRepository } from "@/features/steps/domain/repositories/steps.repository";
import { StepsMapper } from "@/features/steps/infrastructure/persistence/prisma/mappers/steps.mapper";

@Injectable()
export class StepsPrismaRepository implements IStepRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(id: string, transaction?: unknown): Promise<Step | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: StepModel | null = await client.step.findUnique({ where: { id } });

    return row ? StepsMapper.toDomain(row) : undefined;
  }

  public async getOrderedItemsInLesson(lessonId: string, transaction?: unknown): Promise<OrderedItem[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.step.findMany({ where: { lessonId }, select: { id: true, order: true } });
  }

  public async applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void> {
    await applyReorder(resolveClient(this._prisma, transaction), "steps", entries);
  }

  public async getByOrderInLesson(lessonId: string, order: number, excludeId?: string, transaction?: unknown): Promise<Step | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.StepWhereInput = { lessonId, order };

    if (excludeId) where.id = { not: excludeId };

    const row: StepModel | null = await client.step.findFirst({ where });

    return row ? StepsMapper.toDomain(row) : undefined;
  }

  public async getMaxOrderInLesson(lessonId: string, transaction?: unknown): Promise<number | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const result: { _max: { order: number | null } } = await client.step.aggregate({ where: { lessonId }, _max: { order: true } });

    return result._max.order ?? undefined;
  }

  public async save(step: Step, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.StepUncheckedCreateInput = StepsMapper.toPersistence(step);

    await client.step.upsert({
      where: { id: step.id },
      create: data,
      update: data,
    });

    if (step.auditLogs.length > 0) {
      await this._auditLogRepository.save(STEP_ENTITY_COLLECTION, STEP_ENTITY_TYPE, step.id, step.auditLogs, transaction);
    }
  }
}
