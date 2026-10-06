/*
 * Funcionalidad: Repositorio Prisma LessonsPrismaRepository
 * Descripción: Implementa ILessonRepository sobre PrismaService y resolveClient para la feature de lecciones
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Lesson as LessonModel, type Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { applyReorder } from "@/features/curriculum/infrastructure/persistence/prisma/apply-reorder";
import { type Lesson, LESSON_ENTITY_COLLECTION, LESSON_ENTITY_TYPE } from "@/features/lessons/domain/entities/lesson.entity";
import { type ILessonRepository } from "@/features/lessons/domain/repositories/lessons.repository";
import { LessonsMapper } from "@/features/lessons/infrastructure/persistence/prisma/mappers/lessons.mapper";

@Injectable()
export class LessonsPrismaRepository implements ILessonRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(id: string, transaction?: unknown): Promise<Lesson | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: LessonModel | null = await client.lesson.findUnique({ where: { id } });

    return row ? LessonsMapper.toDomain(row) : undefined;
  }

  public async getByOrderInModule(moduleId: string, order: number, excludeId?: string, transaction?: unknown): Promise<Lesson | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.LessonWhereInput = { moduleId, order };

    if (excludeId) where.id = { not: excludeId };

    const row: LessonModel | null = await client.lesson.findFirst({ where });

    return row ? LessonsMapper.toDomain(row) : undefined;
  }

  public async getOrderedItemsInModule(moduleId: string, transaction?: unknown): Promise<OrderedItem[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.lesson.findMany({ where: { moduleId }, select: { id: true, order: true } });
  }

  public async applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void> {
    await applyReorder(resolveClient(this._prisma, transaction), "lessons", entries);
  }

  public async save(lesson: Lesson, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.LessonUncheckedCreateInput = LessonsMapper.toPersistence(lesson);

    await client.lesson.upsert({
      where: { id: lesson.id },
      create: data,
      update: data,
    });

    if (lesson.auditLogs.length > 0) {
      await this._auditLogRepository.save(LESSON_ENTITY_COLLECTION, LESSON_ENTITY_TYPE, lesson.id, lesson.auditLogs, transaction);
    }
  }
}
