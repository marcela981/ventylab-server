/*
 * Funcionalidad: Repositorio Prisma ModuleQueriesPrismaRepository
 * Descripción: Implementa IModuleQueriesRepository sobre PrismaService y resolveClient para la feature de módulos; el conteo de quizzes por lección cuenta las evaluaciones QUIZ del alcance de quizzes (la tabla quizzes queda congelada)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Module as ModuleModel, type Prisma } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type ContentStatusChain } from "@/features/curriculum/domain/services/content-visibility";
import { publishedModuleWhere } from "@/features/curriculum/infrastructure/persistence/prisma/published-content-filters";
import { calculatePageCount } from "@/features/lessons/domain/services/lesson-content";
import { getColorForDifficulty } from "@/features/levels/domain/services/difficulty-colors";
import {
  type ModuleDetail,
  type ModuleFullBlock,
  type ModuleFullContent,
  type ModuleFullLesson,
  type ModuleFullPage,
  type ModuleLessonItem,
  type ModuleListItem,
  type ModulePrerequisiteSummary,
  type ModuleSummary,
} from "@/features/modules/domain/read-models/module-views.read-model";
import { type GetModulesQuery, type IModuleQueriesRepository } from "@/features/modules/domain/repositories/module-queries.repository";
import { QUIZ_EVALUATION_SCOPE } from "@/features/quizzes/infrastructure/persistence/prisma/repositories/quizzes-prisma.repository";

type ModuleListRow = Prisma.ModuleGetPayload<{
  include: {
    _count: { select: { lessons: true } };
    prerequisites: { include: { prerequisite: { select: { id: true; title: true; difficulty: true } } } };
  };
}>;

type ModuleDetailRow = Prisma.ModuleGetPayload<{
  include: {
    _count: { select: { lessons: true } };
    prerequisites: {
      include: {
        prerequisite: { select: { id: true; title: true; description: true; difficulty: true; category: true; estimatedTime: true } };
      };
    };
    dependentModules: { include: { module: { select: { id: true; title: true } } } };
  };
}>;

type ModuleLessonRow = Prisma.LessonGetPayload<{ include: { _count: { select: { evaluations: true } } } }>;

const FULL_BLOCK_SELECT: {
  id: true;
  order: true;
  type: true;
  title: true;
  content: true;
  estimatedTime: true;
  mediaId: true;
} = { id: true, order: true, type: true, title: true, content: true, estimatedTime: true, mediaId: true };

const FULL_PAGE_SELECT: {
  id: true;
  lessonId: true;
  title: true;
  slug: true;
  order: true;
  type: true;
  status: true;
  estimatedMinutes: true;
} = { id: true, lessonId: true, title: true, slug: true, order: true, type: true, status: true, estimatedMinutes: true };

type FullBlockRow = Prisma.PageSectionGetPayload<{ select: typeof FULL_BLOCK_SELECT }>;

type FullPageRow = Prisma.PageGetPayload<{ select: typeof FULL_PAGE_SELECT & { sections: { select: typeof FULL_BLOCK_SELECT } } }>;

type FullModuleRow = Prisma.ModuleGetPayload<{
  select: {
    id: true;
    levelId: true;
    title: true;
    description: true;
    difficulty: true;
    estimatedTime: true;
    thumbnail: true;
    order: true;
    status: true;
    level: { select: { status: true; section: { select: { status: true } } } };
    lessons: {
      select: {
        id: true;
        title: true;
        slug: true;
        order: true;
        status: true;
        estimatedTime: true;
        pages: { select: typeof FULL_PAGE_SELECT & { sections: { select: typeof FULL_BLOCK_SELECT } } };
      };
    };
    pages: { select: typeof FULL_PAGE_SELECT & { sections: { select: typeof FULL_BLOCK_SELECT } } };
  };
}>;

type PrerequisiteRow = {
  id: string;
  title: string;
  description?: string | null;
  difficulty: string | null;
  category?: string | null;
  estimatedTime?: number | null;
};

@Injectable()
export class ModuleQueriesPrismaRepository implements IModuleQueriesRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getList(query: GetModulesQuery): Promise<Paginated<ModuleListItem>> {
    const { page, limit, category, difficulty, canManage } = query;

    const filters: Prisma.ModuleWhereInput = canManage ? { isActive: true } : {};

    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;

    const where: Prisma.ModuleWhereInput = canManage ? filters : { AND: [filters, publishedModuleWhere()] };

    const [rows, total] = await Promise.all([
      this._prisma.module.findMany({
        where,
        orderBy: { order: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { lessons: true } },
          prerequisites: { include: { prerequisite: { select: { id: true, title: true, difficulty: true } } } },
        },
      }),
      this._prisma.module.count({ where }),
    ]);

    return new Paginated({
      items: rows.map(
        (row: ModuleListRow): ModuleListItem => ({
          ...this._toSummary(row, row._count.lessons),
          prerequisites: row.prerequisites.map((prerequisite: ModuleListRow["prerequisites"][number]) =>
            this._toPrerequisite(prerequisite.prerequisite),
          ),
        }),
      ),
      total,
      page,
      limit,
    });
  }

  public async getStatusChain(moduleId: string): Promise<ContentStatusChain | undefined> {
    const row: { status: ModuleModel["status"]; level: { status: ModuleModel["status"]; section: { status: ModuleModel["status"] } | null } | null } | null =
      await this._prisma.module.findUnique({
        where: { id: moduleId },
        select: { status: true, level: { select: { status: true, section: { select: { status: true } } } } },
      });

    return row ? [row.level?.section?.status, row.level?.status, row.status] : undefined;
  }

  public async getDetail(moduleId: string): Promise<ModuleDetail | undefined> {
    const row: ModuleDetailRow | null = await this._prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        _count: { select: { lessons: true } },
        prerequisites: {
          include: {
            prerequisite: { select: { id: true, title: true, description: true, difficulty: true, category: true, estimatedTime: true } },
          },
        },
        dependentModules: { include: { module: { select: { id: true, title: true } } } },
      },
    });

    if (!row) {
      return undefined;
    }

    return {
      ...this._toSummary(row, row._count.lessons),
      prerequisites: row.prerequisites.map((prerequisite: ModuleDetailRow["prerequisites"][number]) => this._toPrerequisite(prerequisite.prerequisite)),
      dependentModules: row.dependentModules.map((dependent: ModuleDetailRow["dependentModules"][number]) => ({
        id: dependent.module.id,
        title: dependent.module.title,
      })),
    };
  }

  public async countLessons(moduleId: string, canManage: boolean): Promise<number> {
    return await this._prisma.lesson.count({ where: canManage ? { moduleId } : { moduleId, status: "PUBLISHED" } });
  }

  public async getLessons(moduleId: string, canManage: boolean): Promise<ModuleLessonItem[]> {
    const rows: ModuleLessonRow[] = await this._prisma.lesson.findMany({
      where: canManage ? { moduleId } : { moduleId, status: "PUBLISHED" },
      orderBy: { order: "asc" },
      include: { _count: { select: { evaluations: { where: QUIZ_EVALUATION_SCOPE } } } },
    });

    return rows.map(
      (lesson: ModuleLessonRow): ModuleLessonItem => ({
        id: lesson.id,
        moduleId: lesson.moduleId,
        title: lesson.title,
        slug: lesson.slug ?? undefined,
        content: lesson.content ?? undefined,
        order: lesson.order,
        estimatedTime: lesson.estimatedTime ?? undefined,
        aiGenerated: lesson.aiGenerated,
        isActive: lesson.isActive,
        status: lesson.status,
        color: lesson.color ?? undefined,
        tags: lesson.tags,
        hasRequiredQuiz: lesson.hasRequiredQuiz,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
        quizCount: lesson._count.evaluations,
        pageCount: calculatePageCount(lesson.content),
      }),
    );
  }

  public async getFullContent(moduleId: string, canManage: boolean): Promise<ModuleFullContent | undefined> {
    const pageWhere: Prisma.PageWhereInput = canManage ? {} : { status: "PUBLISHED" };
    const pageSelect: typeof FULL_PAGE_SELECT & {
      sections: { where: Prisma.PageSectionWhereInput; orderBy: { order: "asc" }; select: typeof FULL_BLOCK_SELECT };
    } = { ...FULL_PAGE_SELECT, sections: { where: { isActive: true }, orderBy: { order: "asc" }, select: FULL_BLOCK_SELECT } };

    const row: FullModuleRow | null = await this._prisma.module.findUnique({
      where: { id: moduleId },
      select: {
        id: true,
        levelId: true,
        title: true,
        description: true,
        difficulty: true,
        estimatedTime: true,
        thumbnail: true,
        order: true,
        status: true,
        level: { select: { status: true, section: { select: { status: true } } } },
        lessons: {
          where: canManage ? {} : { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            slug: true,
            order: true,
            status: true,
            estimatedTime: true,
            pages: { where: pageWhere, orderBy: { order: "asc" }, select: pageSelect },
          },
        },
        pages: { where: { ...pageWhere, lessonId: null }, orderBy: { order: "asc" }, select: pageSelect },
      },
    });

    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      levelId: row.levelId ?? undefined,
      title: row.title,
      description: row.description ?? undefined,
      difficulty: row.difficulty ?? undefined,
      estimatedTime: row.estimatedTime ?? undefined,
      thumbnail: row.thumbnail ?? undefined,
      order: row.order,
      status: row.status,
      statusChain: [row.level?.section?.status, row.level?.status, row.status],
      lessons: row.lessons.map(
        (lesson: FullModuleRow["lessons"][number]): ModuleFullLesson => ({
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug ?? undefined,
          order: lesson.order,
          status: lesson.status,
          estimatedTime: lesson.estimatedTime ?? undefined,
          pages: lesson.pages.map((page: FullPageRow) => this._toFullPage(page)),
        }),
      ),
      unassignedPages: row.pages.map((page: FullPageRow) => this._toFullPage(page)),
    };
  }

  private _toFullPage(page: FullPageRow): ModuleFullPage {
    return {
      id: page.id,
      lessonId: page.lessonId ?? undefined,
      title: page.title,
      slug: page.slug,
      order: page.order,
      type: page.type,
      status: page.status,
      estimatedMinutes: page.estimatedMinutes ?? undefined,
      blocks: page.sections.map(
        (block: FullBlockRow): ModuleFullBlock => ({
          id: block.id,
          order: block.order,
          type: block.type,
          title: block.title ?? undefined,
          content: block.content,
          estimatedTime: block.estimatedTime ?? undefined,
          mediaId: block.mediaId ?? undefined,
        }),
      ),
    };
  }

  private _toSummary(row: ModuleModel, lessonCount: number): ModuleSummary {
    return {
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
      lastModifiedBy: row.lastModifiedBy ?? undefined,
      lastModifiedAt: row.lastModifiedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lessonCount,
      levelColor: getColorForDifficulty(row.difficulty ?? undefined),
    };
  }

  private _toPrerequisite(prerequisite: PrerequisiteRow): ModulePrerequisiteSummary {
    return {
      id: prerequisite.id,
      title: prerequisite.title,
      description: prerequisite.description ?? undefined,
      difficulty: prerequisite.difficulty ?? undefined,
      category: prerequisite.category ?? undefined,
      estimatedTime: prerequisite.estimatedTime ?? undefined,
    };
  }
}
