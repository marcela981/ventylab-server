/*
 * Funcionalidad: Mapeador de presentación ModuleFullMapper
 * Descripción: Convierte el contenido completo de un módulo (lecciones, páginas y bloques con URLs de media) en ModuleFullDTO
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type ModuleFullBlock,
  type ModuleFullContent,
  type ModuleFullLesson,
  type ModuleFullPage,
} from "@/features/modules/domain/read-models/module-views.read-model";
import { ModuleFullBlockDTO, ModuleFullDTO, ModuleFullLessonDTO, ModuleFullPageDTO } from "@/features/modules/presentation/dtos/module-full.dto";

export class ModuleFullMapper {
  public static toDTO(content: ModuleFullContent): ModuleFullDTO {
    return new ModuleFullDTO({
      id: content.id,
      levelId: content.levelId ?? null,
      title: content.title,
      description: content.description ?? null,
      difficulty: content.difficulty ?? null,
      estimatedTime: content.estimatedTime ?? null,
      thumbnail: content.thumbnail ?? null,
      order: content.order,
      status: content.status,
      lessons: content.lessons.map(
        (lesson: ModuleFullLesson) =>
          new ModuleFullLessonDTO({
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug ?? null,
            order: lesson.order,
            status: lesson.status,
            estimatedTime: lesson.estimatedTime ?? null,
            pages: lesson.pages.map((page: ModuleFullPage) => ModuleFullMapper._toPageDTO(page)),
          }),
      ),
      unassignedPages: content.unassignedPages.map((page: ModuleFullPage) => ModuleFullMapper._toPageDTO(page)),
    });
  }

  private static _toPageDTO(page: ModuleFullPage): ModuleFullPageDTO {
    return new ModuleFullPageDTO({
      id: page.id,
      lessonId: page.lessonId ?? null,
      title: page.title,
      slug: page.slug,
      order: page.order,
      type: page.type,
      status: page.status,
      estimatedMinutes: page.estimatedMinutes ?? null,
      blocks: page.blocks.map(
        (block: ModuleFullBlock) =>
          new ModuleFullBlockDTO({
            id: block.id,
            order: block.order,
            type: block.type,
            title: block.title ?? null,
            content: block.content,
            estimatedTime: block.estimatedTime ?? null,
            mediaId: block.mediaId ?? null,
            mediaUrl: block.mediaUrl ?? null,
          }),
      ),
    });
  }
}
