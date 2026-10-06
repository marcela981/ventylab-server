/*
 * Funcionalidad: Mapeador de presentación PagesMapper
 * Descripción: Convierte los modelos de lectura y entidades de la feature de páginas en DTOs de respuesta
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonContentSourceResult } from "@/features/pages/application/results/lesson-content-source.result";
import { type PageSectionView, type PageSummary, type PageView } from "@/features/pages/domain/read-models/page-views.read-model";
import {
  LessonContentSourceDTO,
  PageDTO,
  PageLookupDTO,
  PageModuleDTO,
  PageSectionDTO,
  PageSummaryDTO,
} from "@/features/pages/presentation/dtos/page.dto";

export class PagesMapper {
  public static toDTO(page: PageView): PageDTO {
    return new PageDTO({
      id: page.id,
      moduleId: page.moduleId,
      lessonId: page.lessonId ?? null,
      title: page.title,
      slug: page.slug,
      order: page.order,
      type: page.type,
      description: page.description ?? null,
      difficulty: page.difficulty,
      bloomLevel: page.bloomLevel ?? null,
      estimatedMinutes: page.estimatedMinutes ?? null,
      learningObjectives: page.learningObjectives,
      prerequisites: page.prerequisites,
      keyTakeaways: page.keyTakeaways,
      tags: page.tags,
      hasRequiredQuiz: page.hasRequiredQuiz,
      minQuizScore: page.minQuizScore ?? null,
      aiConfig: page.aiConfig ?? null,
      resources: page.resources ?? null,
      version: page.version,
      isActive: page.isActive,
      isPublished: page.isPublished,
      status: page.status,
      legacyLessonId: page.legacyLessonId ?? null,
      legacyJsonId: page.legacyJsonId ?? null,
      createdBy: page.createdBy,
      updatedBy: page.updatedBy ?? null,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      publishedAt: page.publishedAt ?? null,
      sections: page.sections.map(
        (section: PageSectionView) =>
          new PageSectionDTO({
            id: section.id,
            pageId: section.pageId,
            order: section.order,
            type: section.type,
            title: section.title ?? null,
            content: section.content,
            sectionId: section.sectionId ?? null,
            estimatedTime: section.estimatedTime ?? null,
            isActive: section.isActive,
            mediaId: section.mediaId ?? null,
            mediaUrl: section.mediaUrl ?? null,
            createdBy: section.createdBy ?? null,
            updatedBy: section.updatedBy ?? null,
            createdAt: section.createdAt,
            updatedAt: section.updatedAt,
          }),
      ),
      module: new PageModuleDTO({
        id: page.module.id,
        title: page.module.title,
        levelId: page.module.levelId ?? null,
        isActive: page.module.isActive,
      }),
    });
  }

  public static toSummaryDTO(page: PageSummary): PageSummaryDTO {
    return new PageSummaryDTO({
      id: page.id,
      lessonId: page.lessonId ?? null,
      status: page.status,
      title: page.title,
      slug: page.slug,
      order: page.order,
      type: page.type,
      difficulty: page.difficulty,
      estimatedMinutes: page.estimatedMinutes ?? null,
      learningObjectives: page.learningObjectives,
      hasRequiredQuiz: page.hasRequiredQuiz,
      legacyLessonId: page.legacyLessonId ?? null,
      legacyJsonId: page.legacyJsonId ?? null,
    });
  }

  public static toLookupDTO(legacyJsonId: string, page: PageView | undefined): PageLookupDTO {
    return new PageLookupDTO({ migrated: page !== undefined, legacyJsonId, page: page ? PagesMapper.toDTO(page) : null });
  }

  public static toContentSourceDTO(result: LessonContentSourceResult): LessonContentSourceDTO {
    return new LessonContentSourceDTO({
      source: result.source,
      lessonId: result.lessonId,
      page: result.page ? PagesMapper.toDTO(result.page) : null,
    });
  }
}
