/*
 * Funcionalidad: Repositorio Prisma de consultas de contenido para progreso
 * Descripción: Implementa IProgressQueriesRepository con consultas de solo lectura sobre Lesson, Page, Step y Module (resolución de identificadores, lección publicada anterior y módulos publicados del resumen general); depende de PrismaService
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { publishedLessonWhere, publishedModuleWhere } from "@/features/curriculum/infrastructure/persistence/prisma/published-content-filters";
import {
  type LessonGate,
  type LessonReference,
  type ModuleLessonSource,
  type OverviewModuleSource,
} from "@/features/progress/domain/read-models/progress-records.read-model";
import { type IProgressQueriesRepository } from "@/features/progress/domain/repositories/progress-queries.repository";

interface OverviewModuleRow {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  estimatedTime: number | null;
  order: number;
  levelId: string | null;
  level: { id: string; title: string; order: number } | null;
  lessons: { id: string }[];
}

@Injectable()
export class ProgressQueriesPrismaRepository implements IProgressQueriesRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async resolveLessonReference(lessonReference: string, moduleIdHint?: string): Promise<LessonReference | undefined> {
    const lesson: { id: string; moduleId: string } | null = await this._prisma.lesson.findUnique({
      where: { id: lessonReference },
      select: { id: true, moduleId: true },
    });

    if (lesson) {
      return { moduleId: lesson.moduleId, lessonId: lesson.id };
    }

    const pageByJson: { moduleId: string; legacyLessonId: string | null } | null = await this._prisma.page.findFirst({
      where: { legacyJsonId: lessonReference, isActive: true },
      select: { moduleId: true, legacyLessonId: true },
    });

    if (pageByJson?.legacyLessonId) {
      return { moduleId: pageByJson.moduleId, lessonId: pageByJson.legacyLessonId };
    }

    const pageByLesson: { moduleId: string } | null = await this._prisma.page.findFirst({
      where: { legacyLessonId: lessonReference, isActive: true },
      select: { moduleId: true },
    });

    if (pageByLesson) {
      return { moduleId: pageByLesson.moduleId, lessonId: lessonReference };
    }

    if (moduleIdHint && (await this.isActiveModule(moduleIdHint))) {
      return { moduleId: moduleIdHint, lessonId: lessonReference };
    }

    const firstLesson: { id: string; moduleId: string } | null = await this._prisma.lesson.findFirst({
      where: { moduleId: lessonReference, isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, moduleId: true },
    });

    return firstLesson ? { moduleId: firstLesson.moduleId, lessonId: firstLesson.id } : undefined;
  }

  public async isActiveModule(moduleId: string): Promise<boolean> {
    const count: number = await this._prisma.module.count({ where: { id: moduleId, isActive: true } });

    return count > 0;
  }

  public async moduleExists(moduleId: string): Promise<boolean> {
    const count: number = await this._prisma.module.count({ where: { id: moduleId } });

    return count > 0;
  }

  public async getActiveLessonIds(moduleId: string, transaction?: unknown): Promise<string[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: { id: string }[] = await client.lesson.findMany({
      where: { moduleId, isActive: true },
      orderBy: { order: "asc" },
      select: { id: true },
    });

    return rows.map((row: { id: string }) => row.id);
  }

  public async getActiveLessonsByModules(moduleIds: string[]): Promise<ModuleLessonSource[]> {
    return await this._prisma.lesson.findMany({
      where: { moduleId: { in: moduleIds }, isActive: true },
      select: { id: true, moduleId: true },
    });
  }

  public async getLessonGate(lessonId: string): Promise<LessonGate | undefined> {
    const row: {
      id: string;
      moduleId: string;
      order: number;
      module: { isActive: boolean };
    } | null = await this._prisma.lesson.findFirst({
      where: { id: lessonId, isActive: true },
      select: {
        id: true,
        moduleId: true,
        order: true,
        module: { select: { isActive: true } },
      },
    });

    if (!row) {
      return undefined;
    }

    return {
      lessonId: row.id,
      moduleId: row.moduleId,
      order: row.order,
      moduleIsActive: row.module.isActive,
    };
  }

  public async getPreviousActiveLessonId(moduleId: string, order: number): Promise<string | undefined> {
    const row: { id: string } | null = await this._prisma.lesson.findFirst({
      where: { AND: [{ moduleId, order: { lt: order } }, publishedLessonWhere()] },
      orderBy: { order: "desc" },
      select: { id: true },
    });

    return row?.id;
  }

  public async countActiveSteps(lessonId: string): Promise<number | undefined> {
    const row: { _count: { steps: number } } | null = await this._prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { _count: { select: { steps: { where: { isActive: true } } } } },
    });

    return row?._count.steps;
  }

  public async getOverviewModules(track: string): Promise<OverviewModuleSource[]> {
    const rows: OverviewModuleRow[] = await this._prisma.module.findMany({
      where: { AND: [publishedModuleWhere(), { OR: [{ levelId: null }, { level: { track } }] }] },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        estimatedTime: true,
        order: true,
        levelId: true,
        level: { select: { id: true, title: true, order: true } },
        lessons: { where: publishedLessonWhere(), orderBy: { order: "asc" }, select: { id: true } },
      },
      orderBy: [{ level: { order: "asc" } }, { order: "asc" }],
    });

    return rows.map((row: OverviewModuleRow) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      difficulty: row.difficulty ?? undefined,
      estimatedTime: row.estimatedTime ?? undefined,
      order: row.order,
      levelId: row.levelId ?? undefined,
      level: row.level ?? undefined,
      lessonIds: row.lessons.map((lesson: { id: string }) => lesson.id),
    }));
  }
}
