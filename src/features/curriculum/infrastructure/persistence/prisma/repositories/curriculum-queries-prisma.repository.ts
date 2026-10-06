/*
 * Funcionalidad: Repositorio Prisma CurriculumQueriesPrismaRepository
 * Descripción: Implementa ICurriculumQueriesRepository sobre PrismaService y resolveClient para la feature de currículo; los módulos completados del desbloqueo se derivan de la regla de completitud por páginas (loadLessonCompletionFacts)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Module as ModuleModel, type Prisma } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type CurriculumTreeSource,
  type CurriculumTreeSourceLevel,
  type CurriculumUnlockSource,
} from "@/features/curriculum/domain/read-models/curriculum-tree.read-model";
import {
  type CurriculumDbModule,
  type CurriculumModuleProgressRecord,
  type CurriculumNextModule,
} from "@/features/curriculum/domain/read-models/curriculum-views.read-model";
import { type ICurriculumQueriesRepository } from "@/features/curriculum/domain/repositories/curriculum-queries.repository";
import { completedModuleIdsOf } from "@/features/curriculum/domain/services/lesson-completion-rules";
import { type PrerequisiteEdge } from "@/features/curriculum/domain/services/prerequisite-graph";
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";
import { loadLessonCompletionFacts } from "@/features/curriculum/infrastructure/persistence/prisma/lesson-completion-facts";
import {
  publishedModuleWhere,
  visibleLevelWhere,
  visibleModuleWhere,
} from "@/features/curriculum/infrastructure/persistence/prisma/published-content-filters";

type CurriculumModuleRow = Prisma.ModuleGetPayload<{ include: { _count: { select: { lessons: true } } } }>;

type TreeLevelRow = Prisma.LevelGetPayload<{
  select: {
    id: true;
    sectionId: true;
    title: true;
    description: true;
    track: true;
    order: true;
    status: true;
    modules: { select: { id: true; title: true; description: true; order: true; status: true; _count: { select: { lessons: true } } } };
  };
}>;

@Injectable()
export class CurriculumQueriesPrismaRepository implements ICurriculumQueriesRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getActiveModulesByIds(moduleIds: string[]): Promise<CurriculumDbModule[]> {
    const rows: CurriculumModuleRow[] = await this._prisma.module.findMany({
      where: { AND: [{ id: { in: moduleIds } }, publishedModuleWhere()] },
      include: { _count: { select: { lessons: true } } },
    });

    return rows.map((row: CurriculumModuleRow) => this._toDbModule(row));
  }

  public async getActiveModulesByDifficulty(difficulty: string): Promise<CurriculumDbModule[]> {
    const rows: CurriculumModuleRow[] = await this._prisma.module.findMany({
      where: { AND: [{ difficulty }, publishedModuleWhere()] },
      orderBy: { order: "asc" },
      include: { _count: { select: { lessons: true } } },
    });

    return rows.map((row: CurriculumModuleRow) => this._toDbModule(row));
  }

  public async getModuleProgress(userId: string, moduleIds: string[]): Promise<CurriculumModuleProgressRecord[]> {
    if (moduleIds.length === 0) {
      return [];
    }

    const rows: { moduleId: string; completedAt: Date | null; timeSpent: number }[] = await this._prisma.userProgress.findMany({
      where: { userId, moduleId: { in: moduleIds } },
      select: { moduleId: true, completedAt: true, timeSpent: true },
    });

    return rows.map((row: { moduleId: string; completedAt: Date | null; timeSpent: number }) => ({
      moduleId: row.moduleId,
      completedAt: row.completedAt ?? undefined,
      timeSpent: row.timeSpent,
    }));
  }

  public async isModuleCompleted(userId: string, moduleId: string): Promise<boolean> {
    const row: { completedAt: Date | null } | null = await this._prisma.userProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
      select: { completedAt: true },
    });

    return row?.completedAt !== null && row?.completedAt !== undefined;
  }

  public async getModulePrerequisiteIds(moduleId: string): Promise<string[] | undefined> {
    const row: { prerequisites: { prerequisiteId: string }[] } | null = await this._prisma.module.findUnique({
      where: { id: moduleId },
      select: { prerequisites: { select: { prerequisiteId: true } } },
    });

    return row?.prerequisites.map((prerequisite: { prerequisiteId: string }) => prerequisite.prerequisiteId);
  }

  public async countCompletedModules(userId: string, moduleIds: string[]): Promise<number> {
    return await this._prisma.userProgress.count({ where: { userId, moduleId: { in: moduleIds }, completedAt: { not: null } } });
  }

  public async getNextActiveModuleInSameDifficulty(moduleId: string): Promise<CurriculumNextModule | undefined> {
    const current: { difficulty: string | null; order: number } | null = await this._prisma.module.findUnique({
      where: { id: moduleId },
      select: { difficulty: true, order: true },
    });

    if (!current) {
      return undefined;
    }

    const next: ModuleModel | null = await this._prisma.module.findFirst({
      where: { AND: [{ difficulty: current.difficulty, order: { gt: current.order } }, publishedModuleWhere()] },
      orderBy: { order: "asc" },
    });

    return next ? { id: next.id, order: next.order, title: next.title, description: next.description ?? undefined } : undefined;
  }

  public async getUnlockSource(userId?: string): Promise<CurriculumUnlockSource> {
    const [levels, modules, levelEdges, moduleEdges, completed] = await Promise.all([
      this._prisma.level.findMany({
        where: visibleLevelWhere(false),
        select: { id: true, title: true, modules: { where: publishedModuleWhere(), select: { id: true } } },
      }),
      this._prisma.module.findMany({ where: publishedModuleWhere(), select: { id: true, title: true, levelId: true } }),
      this._prisma.levelPrerequisite.findMany({
        where: { prerequisiteLevel: visibleLevelWhere(false) },
        select: { levelId: true, prerequisiteLevelId: true },
      }),
      this._prisma.modulePrerequisite.findMany({
        where: { prerequisite: publishedModuleWhere() },
        select: { moduleId: true, prerequisiteId: true },
      }),
      userId ? loadLessonCompletionFacts(this._prisma, userId, {}) : Promise.resolve([]),
    ]);

    return {
      levels: levels.map((level: { id: string; title: string; modules: { id: string }[] }) => ({
        id: level.id,
        title: level.title,
        moduleIds: level.modules.map((module: { id: string }) => module.id),
      })),
      modules: modules.map((module: { id: string; title: string; levelId: string | null }) => ({
        id: module.id,
        title: module.title,
        levelId: module.levelId ?? undefined,
      })),
      levelEdges: levelEdges.map(
        (edge: { levelId: string; prerequisiteLevelId: string }): PrerequisiteEdge => ({ nodeId: edge.levelId, prerequisiteId: edge.prerequisiteLevelId }),
      ),
      moduleEdges: moduleEdges.map(
        (edge: { moduleId: string; prerequisiteId: string }): PrerequisiteEdge => ({ nodeId: edge.moduleId, prerequisiteId: edge.prerequisiteId }),
      ),
      completedModuleIds: completedModuleIdsOf(completed),
    };
  }

  public async getTreeSource(canManage: boolean): Promise<CurriculumTreeSource> {
    const [sections, levels] = await Promise.all([
      this._prisma.section.findMany({
        where: canManage ? {} : { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: { id: true, slug: true, title: true, description: true, order: true, status: true },
      }),
      this._prisma.level.findMany({
        where: visibleLevelWhere(canManage),
        orderBy: { order: "asc" },
        select: {
          id: true,
          sectionId: true,
          title: true,
          description: true,
          track: true,
          order: true,
          status: true,
          modules: {
            where: visibleModuleWhere(canManage),
            orderBy: { order: "asc" },
            select: { id: true, title: true, description: true, order: true, status: true, _count: { select: { lessons: true } } },
          },
        },
      }),
    ]);

    return {
      sections: sections.map(
        (section: { id: string; slug: string; title: string; description: string | null; order: number; status: ContentStatusValue }) => ({
          id: section.id,
          slug: section.slug,
          title: section.title,
          description: section.description ?? undefined,
          order: section.order,
          status: section.status,
        }),
      ),
      levels: levels.map(
        (level: TreeLevelRow): CurriculumTreeSourceLevel => ({
          id: level.id,
          sectionId: level.sectionId ?? undefined,
          title: level.title,
          description: level.description ?? undefined,
          track: level.track,
          order: level.order,
          status: level.status,
          modules: level.modules.map((module: TreeLevelRow["modules"][number]) => ({
            id: module.id,
            title: module.title,
            description: module.description ?? undefined,
            order: module.order,
            status: module.status,
            lessonCount: module._count.lessons,
          })),
        }),
      ),
    };
  }

  private _toDbModule(row: CurriculumModuleRow): CurriculumDbModule {
    return {
      id: row.id,
      levelId: row.levelId ?? undefined,
      title: row.title,
      description: row.description ?? undefined,
      difficulty: row.difficulty ?? undefined,
      estimatedTime: row.estimatedTime ?? undefined,
      order: row.order,
      isActive: row.isActive,
      lessonCount: row._count.lessons,
    };
  }
}
