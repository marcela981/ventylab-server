/*
 * Funcionalidad: Mapeador de persistencia de páginas y bloques
 * Descripción: Convierte entre los modelos Page y PageSection de Prisma y las entidades de dominio Page y PageBlock
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentDifficulty, type Page as PageModel, type PageSection as PageSectionModel, type PageType, type Prisma } from "@prisma/client";

import { PageBlock } from "@/features/pages/domain/entities/page-block.entity";
import { Page } from "@/features/pages/domain/entities/page.entity";

export class PagesPersistenceMapper {
  public static toDomain(row: PageModel): Page {
    return Page.reconstitute({
      id: row.id,
      moduleId: row.moduleId,
      lessonId: row.lessonId ?? undefined,
      title: row.title,
      slug: row.slug,
      order: row.order,
      type: row.type,
      description: row.description ?? undefined,
      difficulty: row.difficulty,
      estimatedMinutes: row.estimatedMinutes ?? undefined,
      learningObjectives: row.learningObjectives,
      keyTakeaways: row.keyTakeaways,
      tags: row.tags,
      status: row.status,
      isActive: row.isActive,
      isPublished: row.isPublished,
      version: row.version,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      publishedAt: row.publishedAt ?? undefined,
      auditLogs: [],
    });
  }

  public static toPersistence(page: Page): Prisma.PageUncheckedCreateInput {
    return {
      id: page.id,
      moduleId: page.moduleId,
      lessonId: page.lessonId ?? null,
      title: page.title,
      slug: page.slug,
      order: page.order,
      type: page.type as PageType,
      description: page.description ?? null,
      difficulty: page.difficulty as ContentDifficulty,
      estimatedMinutes: page.estimatedMinutes ?? null,
      learningObjectives: [...page.learningObjectives],
      keyTakeaways: [...page.keyTakeaways],
      tags: [...page.tags],
      status: page.status,
      isActive: page.isActive,
      isPublished: page.isPublished,
      version: page.version,
      createdBy: page.createdBy,
      updatedBy: page.updatedBy ?? null,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      publishedAt: page.publishedAt ?? null,
    };
  }

  public static toBlockDomain(row: PageSectionModel): PageBlock {
    return PageBlock.reconstitute({
      id: row.id,
      pageId: row.pageId,
      order: row.order,
      type: row.type,
      title: row.title ?? undefined,
      content: typeof row.content === "object" && row.content !== null && !Array.isArray(row.content) ? row.content : {},
      mediaId: row.mediaId ?? undefined,
      estimatedTime: row.estimatedTime ?? undefined,
      createdBy: row.createdBy ?? undefined,
      updatedBy: row.updatedBy ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public static toBlockPersistence(block: PageBlock): Prisma.PageSectionUncheckedCreateInput {
    return {
      id: block.id,
      pageId: block.pageId,
      order: block.order,
      type: block.type,
      title: block.title ?? null,
      content: block.content as Prisma.InputJsonObject,
      mediaId: block.mediaId ?? null,
      estimatedTime: block.estimatedTime ?? null,
      isActive: true,
      createdBy: block.createdBy ?? null,
      updatedBy: block.updatedBy ?? null,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    };
  }
}
