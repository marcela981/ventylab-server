/*
 * Funcionalidad: Repositorio Prisma LearningProgressPrismaRepository
 * Descripción: Implementa ILearningProgressRepository sobre PrismaService y resolveClient: estructura publicada por alcance (lecturas acotadas de secciones, niveles y módulos), hechos de completitud con loadLessonCompletionFacts, upsert idempotente de PageProgress por (userId, pageId) y completitud de LessonCompletion
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { generateId } from "@/common/domain/utils/generate-id";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type ContentStatusChain } from "@/features/curriculum/domain/services/content-visibility";
import { type ContentStatusValue, PUBLISHED_CONTENT_STATUS } from "@/features/curriculum/domain/value-objects/content-status";
import { loadLessonCompletionFacts } from "@/features/curriculum/infrastructure/persistence/prisma/lesson-completion-facts";
import { publishedLevelWhere, publishedModuleWhere } from "@/features/curriculum/infrastructure/persistence/prisma/published-content-filters";
import {
  type PageViewSnapshot,
  type PageViewTarget,
  type PageViewWrite,
  type ProgressScope,
  type ProgressSource,
  type ProgressStructure,
  type ProgressStructureLevel,
} from "@/features/progress/domain/read-models/learning-progress.read-model";
import { type ILearningProgressRepository } from "@/features/progress/domain/repositories/learning-progress.repository";

interface StructureLevelRow {
  id: string;
  sectionId: string | null;
  modules: { id: string }[];
}

interface PageTargetRow {
  id: string;
  moduleId: string;
  lessonId: string | null;
  status: ContentStatusValue;
  lesson: { status: ContentStatusValue } | null;
  module: { status: ContentStatusValue; level: { status: ContentStatusValue; section: { status: ContentStatusValue } | null } | null };
}

interface PageViewRow {
  pageId: string;
  completed: boolean;
  completedAt: Date | null;
  lastVisitedAt: Date | null;
}

const PUBLISHED_MODULE_IDS_SELECT: { where: Prisma.ModuleWhereInput; orderBy: { order: "asc" }; select: { id: true } } = {
  where: publishedModuleWhere(),
  orderBy: { order: "asc" },
  select: { id: true },
};

const PAGE_VIEW_SELECT: { pageId: true; completed: true; completedAt: true; lastVisitedAt: true } = {
  pageId: true,
  completed: true,
  completedAt: true,
  lastVisitedAt: true,
};

@Injectable()
export class LearningProgressPrismaRepository implements ILearningProgressRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getProgressSource(userId: string, scope: ProgressScope): Promise<ProgressSource | undefined> {
    const [structure, facts]: [ProgressStructure | undefined, LessonCompletionFact[]] = await Promise.all([
      this._getStructure(scope),
      loadLessonCompletionFacts(this._prisma, userId, this._lessonScope(scope)),
    ]);

    return structure ? { structure, facts } : undefined;
  }

  public async getPageViewTarget(pageId: string): Promise<{ target: PageViewTarget; chain: ContentStatusChain } | undefined> {
    const row: PageTargetRow | null = await this._prisma.page.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        moduleId: true,
        lessonId: true,
        status: true,
        lesson: { select: { status: true } },
        module: { select: { status: true, level: { select: { status: true, section: { select: { status: true } } } } } },
      },
    });

    if (!row) {
      return undefined;
    }

    const chain: ContentStatusChain = [row.module.level?.section?.status, row.module.level?.status, row.module.status, row.lesson?.status, row.status];

    return { target: { pageId: row.id, moduleId: row.moduleId, lessonId: row.lessonId ?? undefined }, chain };
  }

  public async getPageView(userId: string, pageId: string, transaction?: unknown): Promise<PageViewSnapshot | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: PageViewRow | null = await client.pageProgress.findUnique({
      where: { userId_pageId: { userId, pageId } },
      select: PAGE_VIEW_SELECT,
    });

    return row ? this._toPageView(row) : undefined;
  }

  public async savePageView(userId: string, pageId: string, write: PageViewWrite, transaction?: unknown): Promise<PageViewSnapshot> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: PageViewRow = await client.pageProgress.upsert({
      where: { userId_pageId: { userId, pageId } },
      create: {
        id: generateId(),
        userId,
        pageId,
        completed: true,
        lastVisitedAt: write.lastVisitedAt,
        completedAt: write.completedAt ?? write.lastVisitedAt,
      },
      update: {
        completed: true,
        lastVisitedAt: write.lastVisitedAt,
        ...(write.completedAt ? { completedAt: write.completedAt } : {}),
      },
      select: PAGE_VIEW_SELECT,
    });

    return this._toPageView(row);
  }

  public async getLessonFacts(userId: string, lessonIds: string[], transaction?: unknown): Promise<LessonCompletionFact[]> {
    if (lessonIds.length === 0) {
      return [];
    }

    return await loadLessonCompletionFacts(resolveClient(this._prisma, transaction), userId, { id: { in: lessonIds } });
  }

  public async markLessonCompleted(userId: string, lessonId: string, completedAt: Date, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { id: generateId(), userId, lessonId, isCompleted: true, completedAt, lastAccessed: completedAt },
      update: { isCompleted: true, completedAt, lastAccessed: completedAt },
    });
  }

  private _lessonScope(scope: ProgressScope): Prisma.LessonWhereInput {
    const id: string = scope.id ?? "";

    switch (scope.type) {
      case "module":
        return { moduleId: id };
      case "level":
        return { module: { levelId: id } };
      case "section":
        return { module: { level: { sectionId: id } } };
      default:
        return {};
    }
  }

  private async _getStructure(scope: ProgressScope): Promise<ProgressStructure | undefined> {
    const id: string = scope.id ?? "";

    switch (scope.type) {
      case "module":
        return await this._getModuleStructure(id);
      case "level":
        return await this._getLevelStructure(id);
      case "section":
        return await this._getSectionStructure(id);
      default:
        return await this._getFullStructure();
    }
  }

  private async _getModuleStructure(moduleId: string): Promise<ProgressStructure | undefined> {
    const row: { id: string; levelId: string | null } | null = await this._prisma.module.findFirst({
      where: { AND: [{ id: moduleId }, publishedModuleWhere()] },
      select: { id: true, levelId: true },
    });

    return row ? { sections: [], levels: [], modules: [{ id: row.id, levelId: row.levelId ?? undefined }] } : undefined;
  }

  private async _getLevelStructure(levelId: string): Promise<ProgressStructure | undefined> {
    const row: StructureLevelRow | null = await this._prisma.level.findFirst({
      where: { AND: [{ id: levelId }, publishedLevelWhere()] },
      select: { id: true, sectionId: true, modules: PUBLISHED_MODULE_IDS_SELECT },
    });

    if (!row) {
      return undefined;
    }

    const level: ProgressStructureLevel = this._toStructureLevel(row);

    return { sections: [], levels: [level], modules: this._modulesOf([level]) };
  }

  private async _getSectionStructure(sectionId: string): Promise<ProgressStructure | undefined> {
    const row: { id: string; levels: StructureLevelRow[] } | null = await this._prisma.section.findFirst({
      where: { id: sectionId, status: PUBLISHED_CONTENT_STATUS },
      select: {
        id: true,
        levels: { where: publishedLevelWhere(), orderBy: { order: "asc" }, select: { id: true, sectionId: true, modules: PUBLISHED_MODULE_IDS_SELECT } },
      },
    });

    if (!row) {
      return undefined;
    }

    const levels: ProgressStructureLevel[] = row.levels.map((level: StructureLevelRow) => this._toStructureLevel(level));

    return {
      sections: [{ id: row.id, levelIds: levels.map((level: ProgressStructureLevel) => level.id) }],
      levels,
      modules: this._modulesOf(levels),
    };
  }

  private async _getFullStructure(): Promise<ProgressStructure> {
    const [sections, levels, modules] = await Promise.all([
      this._prisma.section.findMany({
        where: { status: PUBLISHED_CONTENT_STATUS },
        orderBy: { order: "asc" },
        select: { id: true, levels: { where: publishedLevelWhere(), orderBy: { order: "asc" }, select: { id: true } } },
      }),
      this._prisma.level.findMany({
        where: publishedLevelWhere(),
        orderBy: { order: "asc" },
        select: { id: true, sectionId: true, modules: PUBLISHED_MODULE_IDS_SELECT },
      }),
      this._prisma.module.findMany({
        where: publishedModuleWhere(),
        orderBy: [{ level: { order: "asc" } }, { order: "asc" }],
        select: { id: true, levelId: true },
      }),
    ]);

    return {
      sections: sections.map((section: { id: string; levels: { id: string }[] }) => ({
        id: section.id,
        levelIds: section.levels.map((level: { id: string }) => level.id),
      })),
      levels: levels.map((level: StructureLevelRow) => this._toStructureLevel(level)),
      modules: modules.map((module: { id: string; levelId: string | null }) => ({ id: module.id, levelId: module.levelId ?? undefined })),
    };
  }

  private _toStructureLevel(row: StructureLevelRow): ProgressStructureLevel {
    return {
      id: row.id,
      sectionId: row.sectionId ?? undefined,
      moduleIds: row.modules.map((module: { id: string }) => module.id),
    };
  }

  private _modulesOf(levels: ProgressStructureLevel[]): { id: string; levelId: string }[] {
    return levels.flatMap((level: ProgressStructureLevel) => level.moduleIds.map((moduleId: string) => ({ id: moduleId, levelId: level.id })));
  }

  private _toPageView(row: PageViewRow): PageViewSnapshot {
    return {
      pageId: row.pageId,
      completed: row.completed,
      firstViewedAt: row.completedAt ?? undefined,
      lastVisitedAt: row.lastVisitedAt ?? undefined,
    };
  }
}
