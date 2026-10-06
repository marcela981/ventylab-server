/*
 * Funcionalidad: Repositorio Prisma PageQueriesPrismaRepository
 * Descripción: Implementa IPageQueriesRepository sobre PrismaService y resolveClient para la feature de páginas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type PageSection as PageSectionModel, type Prisma } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type ContentStatusChain } from "@/features/curriculum/domain/services/content-visibility";
import { visiblePageWhere } from "@/features/curriculum/infrastructure/persistence/prisma/published-content-filters";
import { type PageSummary, type PageView } from "@/features/pages/domain/read-models/page-views.read-model";
import { type IPageQueriesRepository } from "@/features/pages/domain/repositories/page-queries.repository";

type PageRow = Prisma.PageGetPayload<{
  include: { sections: true; module: { select: { id: true; title: true; levelId: true; isActive: true } } };
}>;

type PageStatusRow = Prisma.PageGetPayload<{
  select: {
    status: true;
    lesson: { select: { status: true } };
    module: { select: { status: true; level: { select: { status: true; section: { select: { status: true } } } } } };
  };
}>;

type PageSummaryRow = Prisma.PageGetPayload<{
  select: {
    id: true;
    lessonId: true;
    status: true;
    title: true;
    slug: true;
    order: true;
    type: true;
    difficulty: true;
    estimatedMinutes: true;
    learningObjectives: true;
    hasRequiredQuiz: true;
    legacyLessonId: true;
    legacyJsonId: true;
  };
}>;

const PAGE_INCLUDE: {
  sections: { where: { isActive: true }; orderBy: { order: "asc" } };
  module: { select: { id: true; title: true; levelId: true; isActive: true } };
} = {
  sections: { where: { isActive: true }, orderBy: { order: "asc" } },
  module: { select: { id: true, title: true, levelId: true, isActive: true } },
};

@Injectable()
export class PageQueriesPrismaRepository implements IPageQueriesRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getStatusChain(pageId: string): Promise<ContentStatusChain | undefined> {
    const row: PageStatusRow | null = await this._prisma.page.findUnique({
      where: { id: pageId },
      select: {
        status: true,
        lesson: { select: { status: true } },
        module: { select: { status: true, level: { select: { status: true, section: { select: { status: true } } } } } },
      },
    });

    return row ? [row.module.level?.section?.status, row.module.level?.status, row.module.status, row.lesson?.status, row.status] : undefined;
  }

  public async getById(pageId: string): Promise<PageView | undefined> {
    const row: PageRow | null = await this._prisma.page.findUnique({ where: { id: pageId }, include: PAGE_INCLUDE });

    return row ? this._toView(row) : undefined;
  }

  public async getVisibleByLegacyJsonId(legacyJsonId: string, canManage: boolean): Promise<PageView | undefined> {
    const row: PageRow | null = await this._prisma.page.findFirst({
      where: { AND: [{ legacyJsonId }, visiblePageWhere(canManage)] },
      include: PAGE_INCLUDE,
    });

    return row ? this._toView(row) : undefined;
  }

  public async getVisibleByLegacyLessonId(lessonId: string, canManage: boolean): Promise<PageView | undefined> {
    const row: PageRow | null = await this._prisma.page.findFirst({
      where: { AND: [{ OR: [{ legacyLessonId: lessonId }, { lessonId }] }, visiblePageWhere(canManage)] },
      orderBy: { order: "asc" },
      include: PAGE_INCLUDE,
    });

    return row ? this._toView(row) : undefined;
  }

  public async getVisibleByModule(moduleId: string, canManage: boolean): Promise<PageSummary[]> {
    return await this._getSummaries({ moduleId }, canManage);
  }

  public async getVisibleByLesson(lessonId: string, canManage: boolean): Promise<PageSummary[]> {
    return await this._getSummaries({ lessonId }, canManage);
  }

  private async _getSummaries(scope: Prisma.PageWhereInput, canManage: boolean): Promise<PageSummary[]> {
    const rows: PageSummaryRow[] = await this._prisma.page.findMany({
      where: { AND: [scope, visiblePageWhere(canManage)] },
      orderBy: { order: "asc" },
      select: {
        id: true,
        lessonId: true,
        status: true,
        title: true,
        slug: true,
        order: true,
        type: true,
        difficulty: true,
        estimatedMinutes: true,
        learningObjectives: true,
        hasRequiredQuiz: true,
        legacyLessonId: true,
        legacyJsonId: true,
      },
    });

    return rows.map((row: PageSummaryRow) => ({
      id: row.id,
      lessonId: row.lessonId ?? undefined,
      status: row.status,
      title: row.title,
      slug: row.slug,
      order: row.order,
      type: row.type,
      difficulty: row.difficulty,
      estimatedMinutes: row.estimatedMinutes ?? undefined,
      learningObjectives: row.learningObjectives,
      hasRequiredQuiz: row.hasRequiredQuiz,
      legacyLessonId: row.legacyLessonId ?? undefined,
      legacyJsonId: row.legacyJsonId ?? undefined,
    }));
  }

  private _toView(row: PageRow): PageView {
    return {
      id: row.id,
      moduleId: row.moduleId,
      lessonId: row.lessonId ?? undefined,
      title: row.title,
      slug: row.slug,
      order: row.order,
      type: row.type,
      description: row.description ?? undefined,
      difficulty: row.difficulty,
      bloomLevel: row.bloomLevel ?? undefined,
      estimatedMinutes: row.estimatedMinutes ?? undefined,
      learningObjectives: row.learningObjectives,
      prerequisites: row.prerequisites,
      keyTakeaways: row.keyTakeaways,
      tags: row.tags,
      hasRequiredQuiz: row.hasRequiredQuiz,
      minQuizScore: row.minQuizScore ?? undefined,
      aiConfig: row.aiConfig ?? undefined,
      resources: row.resources ?? undefined,
      version: row.version,
      isActive: row.isActive,
      isPublished: row.isPublished,
      status: row.status,
      legacyLessonId: row.legacyLessonId ?? undefined,
      legacyJsonId: row.legacyJsonId ?? undefined,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      publishedAt: row.publishedAt ?? undefined,
      sections: row.sections.map((section: PageSectionModel) => ({
        id: section.id,
        pageId: section.pageId,
        order: section.order,
        type: section.type,
        title: section.title ?? undefined,
        content: section.content,
        sectionId: section.sectionId ?? undefined,
        estimatedTime: section.estimatedTime ?? undefined,
        isActive: section.isActive,
        mediaId: section.mediaId ?? undefined,
        createdBy: section.createdBy ?? undefined,
        updatedBy: section.updatedBy ?? undefined,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      })),
      module: { id: row.module.id, title: row.module.title, levelId: row.module.levelId ?? undefined, isActive: row.module.isActive },
    };
  }
}
