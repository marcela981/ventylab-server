/*
 * Funcionalidad: Repositorio Prisma LevelQueriesPrismaRepository
 * Descripción: Implementa ILevelQueriesRepository sobre PrismaService y resolveClient para la feature de niveles; el progreso por módulo del currículo de niveles usa la regla de completitud por páginas (loadLessonCompletionFacts)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Level as LevelModel, type Prisma } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type LessonCompletionFact, type LessonWeightedProgress } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type ContentStatusChain } from "@/features/curriculum/domain/services/content-visibility";
import { summarizeLessons } from "@/features/curriculum/domain/services/lesson-completion-rules";
import { loadLessonCompletionFacts } from "@/features/curriculum/infrastructure/persistence/prisma/lesson-completion-facts";
import {
  publishedLevelWhere,
  publishedModuleWhere,
  visibleLevelWhere,
  visibleModuleWhere,
} from "@/features/curriculum/infrastructure/persistence/prisma/published-content-filters";
import { type LevelCurriculumSource, type LevelCurriculumSourceLevel } from "@/features/levels/domain/read-models/level-curriculum.read-model";
import {
  type LevelCompletionStatus,
  type LevelUnlockSource,
  type RoadmapLevelSource,
  type RoadmapProgressSource,
} from "@/features/levels/domain/read-models/level-roadmap.read-model";
import {
  type LevelDetail,
  type LevelModuleItem,
  type LevelPrerequisiteItem,
  type LevelPrerequisitesView,
  type LevelSummary,
} from "@/features/levels/domain/read-models/level-views.read-model";
import { type GetLevelsQuery, type ILevelQueriesRepository } from "@/features/levels/domain/repositories/level-queries.repository";
import { getColorForDifficulty } from "@/features/levels/domain/services/difficulty-colors";

type LevelDetailRow = Prisma.LevelGetPayload<{
  include: {
    modules: {
      select: {
        id: true;
        title: true;
        description: true;
        difficulty: true;
        estimatedTime: true;
        order: true;
        thumbnail: true;
        status: true;
        _count: { select: { lessons: true } };
      };
    };
    _count: { select: { modules: true } };
  };
}>;

type LevelModuleRow = Prisma.ModuleGetPayload<{
  include: {
    _count: { select: { lessons: true } };
    prerequisites: { include: { prerequisite: { select: { id: true; title: true } } } };
  };
}>;

type LevelPrerequisitesRow = Prisma.LevelGetPayload<{
  include: {
    prerequisites: { include: { prerequisiteLevel: { select: { id: true; title: true; order: true; isActive: true } } } };
    dependentLevels: { include: { level: { select: { id: true; title: true; order: true; isActive: true } } } };
  };
}>;

type CurriculumLevelRow = Prisma.LevelGetPayload<{
  include: {
    modules: {
      select: {
        id: true;
        title: true;
        description: true;
        difficulty: true;
        estimatedTime: true;
        order: true;
        category: true;
        _count: { select: { lessons: true } };
      };
    };
  };
}>;

type UnlockSourceRow = Prisma.LevelGetPayload<{
  select: {
    createdAt: true;
    prerequisites: { select: { prerequisiteLevel: { select: { id: true; title: true; isActive: true; status: true } } } };
  };
}>;

type RoadmapLevelRow = Prisma.LevelGetPayload<{ include: { _count: { select: { modules: true } } } }>;

@Injectable()
export class LevelQueriesPrismaRepository implements ILevelQueriesRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getSummaries(query: GetLevelsQuery): Promise<Paginated<LevelSummary>> {
    const { page, limit, includeInactive, canManage } = query;

    const where: Prisma.LevelWhereInput = canManage ? (includeInactive ? {} : { isActive: true }) : publishedLevelWhere();

    const [rows, total] = await Promise.all([
      this._prisma.level.findMany({
        where,
        orderBy: { order: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { modules: true } },
          modules: { take: 1, orderBy: { order: "asc" }, select: { difficulty: true } },
        },
      }),
      this._prisma.level.count({ where }),
    ]);

    return new Paginated({
      items: rows.map((row: LevelModel & { _count: { modules: number }; modules: { difficulty: string | null }[] }) =>
        this._toSummary(row, row._count.modules, getColorForDifficulty(row.modules[0]?.difficulty ?? undefined)),
      ),
      total,
      page,
      limit,
    });
  }

  public async getStatusChain(levelId: string): Promise<ContentStatusChain | undefined> {
    const row: { status: LevelModel["status"]; section: { status: LevelModel["status"] } | null } | null = await this._prisma.level.findUnique({
      where: { id: levelId },
      select: { status: true, section: { select: { status: true } } },
    });

    return row ? [row.section?.status, row.status] : undefined;
  }

  public async getDetail(levelId: string, canManage: boolean): Promise<LevelDetail | undefined> {
    const row: LevelDetailRow | null = await this._prisma.level.findUnique({
      where: { id: levelId },
      include: {
        modules: {
          where: canManage ? {} : publishedModuleWhere(),
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            estimatedTime: true,
            order: true,
            thumbnail: true,
            status: true,
            _count: { select: { lessons: true } },
          },
        },
        _count: { select: { modules: true } },
      },
    });

    if (!row) {
      return undefined;
    }

    return {
      ...this._toSummary(row, row._count.modules, getColorForDifficulty(row.modules[0]?.difficulty ?? undefined)),
      modules: row.modules.map((module: LevelDetailRow["modules"][number]) => ({
        id: module.id,
        title: module.title,
        description: module.description ?? undefined,
        difficulty: module.difficulty ?? undefined,
        estimatedTime: module.estimatedTime ?? undefined,
        order: module.order,
        thumbnail: module.thumbnail ?? undefined,
        status: module.status,
        lessonCount: module._count.lessons,
      })),
    };
  }

  public async getModules(levelId: string, includeInactive: boolean, canManage: boolean): Promise<LevelModuleItem[]> {
    const where: Prisma.ModuleWhereInput = canManage ? (includeInactive ? { levelId } : { levelId, isActive: true }) : { AND: [{ levelId }, publishedModuleWhere()] };

    const rows: LevelModuleRow[] = await this._prisma.module.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        _count: { select: { lessons: true } },
        prerequisites: { include: { prerequisite: { select: { id: true, title: true } } } },
      },
    });

    return rows.map((row: (typeof rows)[number]) => ({
      id: row.id,
      levelId: row.levelId ?? undefined,
      title: row.title,
      description: row.description ?? undefined,
      category: row.category ?? undefined,
      difficulty: row.difficulty ?? undefined,
      estimatedTime: row.estimatedTime ?? undefined,
      thumbnail: row.thumbnail ?? undefined,
      order: row.order,
      isActive: row.isActive,
      status: row.status,
      color: row.color ?? undefined,
      tags: row.tags,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lessonCount: row._count.lessons,
      prerequisites: row.prerequisites.map((prerequisite: (typeof row.prerequisites)[number]) => ({
        id: prerequisite.prerequisite.id,
        title: prerequisite.prerequisite.title,
      })),
      levelColor: getColorForDifficulty(row.difficulty ?? undefined),
    }));
  }

  public async getPrerequisitesView(levelId: string): Promise<LevelPrerequisitesView | undefined> {
    const row: LevelPrerequisitesRow | null = await this._prisma.level.findUnique({
      where: { id: levelId },
      include: {
        prerequisites: { include: { prerequisiteLevel: { select: { id: true, title: true, order: true, isActive: true } } } },
        dependentLevels: { include: { level: { select: { id: true, title: true, order: true, isActive: true } } } },
      },
    });

    if (!row) {
      return undefined;
    }

    return {
      levelId: row.id,
      levelTitle: row.title,
      prerequisites: row.prerequisites.map(
        (prerequisite: (typeof row.prerequisites)[number]): LevelPrerequisiteItem => ({
          id: prerequisite.id,
          levelId: prerequisite.prerequisiteLevel.id,
          levelTitle: prerequisite.prerequisiteLevel.title,
          order: prerequisite.prerequisiteLevel.order,
          isActive: prerequisite.prerequisiteLevel.isActive,
        }),
      ),
      dependentLevels: row.dependentLevels.map(
        (dependent: (typeof row.dependentLevels)[number]): LevelPrerequisiteItem => ({
          id: dependent.id,
          levelId: dependent.level.id,
          levelTitle: dependent.level.title,
          order: dependent.level.order,
          isActive: dependent.level.isActive,
        }),
      ),
    };
  }

  public async getCurriculumSource(canManage: boolean, userId?: string, track?: string): Promise<LevelCurriculumSource> {
    const visibility: Prisma.LevelWhereInput = canManage ? { isActive: true } : visibleLevelWhere(false);

    const rows: CurriculumLevelRow[] = await this._prisma.level.findMany({
      where: track ? { AND: [visibility, { track }] } : visibility,
      orderBy: { order: "asc" },
      include: {
        modules: {
          where: canManage ? { isActive: true } : visibleModuleWhere(false),
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            estimatedTime: true,
            order: true,
            category: true,
            _count: { select: { lessons: { where: canManage ? { isActive: true } : { status: "PUBLISHED" } } } },
          },
        },
      },
    });

    const levels: LevelCurriculumSourceLevel[] = rows.map((row: (typeof rows)[number]) => ({
      id: row.id,
      track: row.track,
      title: row.title,
      description: row.description ?? undefined,
      order: row.order,
      modules: row.modules.map((module: (typeof row.modules)[number]) => ({
        id: module.id,
        title: module.title,
        description: module.description ?? undefined,
        difficulty: module.difficulty ?? undefined,
        estimatedTime: module.estimatedTime ?? undefined,
        order: module.order,
        category: module.category ?? undefined,
        lessonCount: module._count.lessons,
      })),
    }));

    const levelIds: string[] = levels.map((level: LevelCurriculumSourceLevel) => level.id);
    const moduleIds: string[] = levels.flatMap((level: LevelCurriculumSourceLevel) => level.modules.map((module: { id: string }) => module.id));

    const [facts, prerequisiteRows] = await Promise.all([
      userId && moduleIds.length > 0 ? loadLessonCompletionFacts(this._prisma, userId, { moduleId: { in: moduleIds } }) : Promise.resolve([]),
      this._prisma.levelPrerequisite.findMany({
        where: { levelId: { in: levelIds } },
        select: { levelId: true, prerequisiteLevelId: true },
      }),
    ]);

    return {
      levels,
      moduleProgress: this._toModuleProgress(moduleIds, facts),
      prerequisites: prerequisiteRows,
    };
  }

  public async getActiveDependentLevelTitles(levelId: string, transaction?: unknown): Promise<string[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: { level: { title: string } }[] = await client.levelPrerequisite.findMany({
      where: { prerequisiteLevelId: levelId, level: { isActive: true } },
      select: { level: { select: { title: true } } },
    });

    return rows.map((row: { level: { title: string } }) => row.level.title);
  }

  public async getCompletion(userId: string, levelId: string): Promise<LevelCompletionStatus> {
    const level: { modules: { id: string }[] } | null = await this._prisma.level.findUnique({
      where: { id: levelId },
      select: { modules: { where: publishedModuleWhere(), select: { id: true } } },
    });

    if (!level || level.modules.length === 0) {
      return { isCompleted: false, completionPercentage: 0, completedModules: 0, totalModules: 0 };
    }

    const progressRows: { completedAt: Date | null; startedAt: Date }[] = await this._prisma.userProgress.findMany({
      where: { userId, moduleId: { in: level.modules.map((module: { id: string }) => module.id) } },
      select: { completedAt: true, startedAt: true },
    });

    const completedDates: Date[] = progressRows
      .map((progress: { completedAt: Date | null }) => progress.completedAt)
      .filter((completedAt: Date | null): completedAt is Date => completedAt !== null);

    const totalModules: number = level.modules.length;
    const completedModules: number = completedDates.length;
    const isCompleted: boolean = completedModules === totalModules;

    return {
      isCompleted,
      completionPercentage: Math.floor((completedModules / totalModules) * 100),
      completedAt: isCompleted && completedDates.length > 0 ? new Date(Math.max(...completedDates.map((date: Date) => date.getTime()))) : undefined,
      unlockedAt:
        progressRows.length > 0
          ? new Date(Math.min(...progressRows.map((progress: { startedAt: Date }) => progress.startedAt.getTime())))
          : undefined,
      completedModules,
      totalModules,
    };
  }

  public async getUnlockSource(levelId: string): Promise<LevelUnlockSource | undefined> {
    const row: UnlockSourceRow | null = await this._prisma.level.findUnique({
      where: { id: levelId },
      select: {
        createdAt: true,
        prerequisites: { select: { prerequisiteLevel: { select: { id: true, title: true, isActive: true, status: true } } } },
      },
    });

    if (!row) {
      return undefined;
    }

    return {
      createdAt: row.createdAt,
      prerequisites: row.prerequisites.map((prerequisite: (typeof row.prerequisites)[number]) => ({
        levelId: prerequisite.prerequisiteLevel.id,
        title: prerequisite.prerequisiteLevel.title,
        isActive: prerequisite.prerequisiteLevel.isActive && prerequisite.prerequisiteLevel.status === "PUBLISHED",
      })),
    };
  }

  public async getRoadmapLevels(track: string): Promise<RoadmapLevelSource[]> {
    const rows: RoadmapLevelRow[] = await this._prisma.level.findMany({
      where: { AND: [publishedLevelWhere(), { track }] },
      orderBy: { order: "asc" },
      include: { _count: { select: { modules: { where: { status: "PUBLISHED" } } } } },
    });

    return rows.map((row: (typeof rows)[number]) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      order: row.order,
      isActive: row.isActive,
      moduleCount: row._count.modules,
    }));
  }

  public async getRoadmapProgress(userId: string, levelIds: string[]): Promise<RoadmapProgressSource> {
    if (levelIds.length === 0) {
      return { modules: [], moduleProgress: [], prerequisites: [], levelCreatedAt: [] };
    }

    const [modules, levels, prerequisites] = await Promise.all([
      this._prisma.module.findMany({ where: { AND: [{ levelId: { in: levelIds } }, publishedModuleWhere()] }, select: { id: true, levelId: true } }),
      this._prisma.level.findMany({ where: { id: { in: levelIds } }, select: { id: true, createdAt: true } }),
      this._prisma.levelPrerequisite.findMany({
        where: { levelId: { in: levelIds }, prerequisiteLevel: publishedLevelWhere() },
        select: { levelId: true, prerequisiteLevelId: true, prerequisiteLevel: { select: { title: true, createdAt: true } } },
      }),
    ]);

    const moduleIds: string[] = modules.map((module: { id: string }) => module.id);
    const prerequisiteModuleRows: { id: string; levelId: string | null }[] = await this._prisma.module.findMany({
      where: {
        AND: [{ levelId: { in: prerequisites.map((prerequisite: { prerequisiteLevelId: string }) => prerequisite.prerequisiteLevelId) } }, publishedModuleWhere()],
      },
      select: { id: true, levelId: true },
    });
    const allModuleIds: string[] = [...new Set([...moduleIds, ...prerequisiteModuleRows.map((module: { id: string }) => module.id)])];

    const progressRows: { moduleId: string; completedAt: Date | null; startedAt: Date }[] =
      allModuleIds.length > 0
        ? await this._prisma.userProgress.findMany({
          where: { userId, moduleId: { in: allModuleIds } },
          select: { moduleId: true, completedAt: true, startedAt: true },
        })
        : [];

    return {
      modules: [...modules, ...prerequisiteModuleRows]
        .filter((module: { levelId: string | null }) => module.levelId !== null)
        .map((module: { id: string; levelId: string | null }) => ({ id: module.id, levelId: module.levelId ?? "" })),
      moduleProgress: progressRows.map((progress: { moduleId: string; completedAt: Date | null; startedAt: Date }) => ({
        moduleId: progress.moduleId,
        completedAt: progress.completedAt ?? undefined,
        startedAt: progress.startedAt,
      })),
      prerequisites: prerequisites.map(
        (prerequisite: { levelId: string; prerequisiteLevelId: string; prerequisiteLevel: { title: string; createdAt: Date } }) => ({
          levelId: prerequisite.levelId,
          prerequisiteLevelId: prerequisite.prerequisiteLevelId,
          title: prerequisite.prerequisiteLevel.title,
          createdAt: prerequisite.prerequisiteLevel.createdAt,
        }),
      ),
      levelCreatedAt: levels.map((level: { id: string; createdAt: Date }) => ({ levelId: level.id, createdAt: level.createdAt })),
    };
  }

  private _toSummary(row: LevelModel, moduleCount: number, color: string): LevelSummary {
    return {
      id: row.id,
      title: row.title,
      track: row.track,
      description: row.description ?? undefined,
      order: row.order,
      isActive: row.isActive,
      status: row.status,
      sectionId: row.sectionId ?? undefined,
      color,
      tags: row.tags,
      parentId: row.parentId ?? undefined,
      lastModifiedBy: row.lastModifiedBy ?? undefined,
      lastModifiedAt: row.lastModifiedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      moduleCount,
    };
  }

  private _toModuleProgress(moduleIds: string[], facts: LessonCompletionFact[]): LevelCurriculumSource["moduleProgress"] {
    return moduleIds.map((moduleId: string) => {
      const summary: LessonWeightedProgress = summarizeLessons(facts.filter((fact: LessonCompletionFact) => fact.moduleId === moduleId));

      return {
        moduleId,
        completedLessons: summary.completedLessons,
        totalLessons: summary.totalLessons,
        progressPercentage: summary.percentage,
        isCompleted: summary.completed,
      };
    });
  }
}
