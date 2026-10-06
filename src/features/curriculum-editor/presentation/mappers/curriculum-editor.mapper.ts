/*
 * Funcionalidad: Mapeador del editor del currículo
 * Descripción: Convierte el modelo de lectura del árbol del currículo en los DTOs de respuesta de niveles, módulos y lecciones
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type CurriculumTreeLesson,
  type CurriculumTreeLevel,
  type CurriculumTreeModule,
} from "@/features/curriculum-editor/domain/read-models/curriculum-tree.read-model";
import {
  CurriculumTreeLessonDTO,
  CurriculumTreeLevelDTO,
  CurriculumTreeModuleDTO,
} from "@/features/curriculum-editor/presentation/dtos/curriculum-tree.dto";

export class CurriculumEditorMapper {
  public static toLevelDTO(level: CurriculumTreeLevel): CurriculumTreeLevelDTO {
    return new CurriculumTreeLevelDTO({
      id: level.id,
      title: level.title,
      track: level.track,
      description: level.description ?? null,
      order: level.order,
      isActive: level.isActive,
      status: level.status,
      color: level.color ?? null,
      tags: level.tags,
      parentId: level.parentId ?? null,
      createdAt: level.createdAt,
      updatedAt: level.updatedAt,
      modules: level.modules.map((module: CurriculumTreeModule) => CurriculumEditorMapper._toModuleDTO(module)),
      children: level.children.map((child: CurriculumTreeLevel) => CurriculumEditorMapper.toLevelDTO(child)),
    });
  }

  private static _toModuleDTO(module: CurriculumTreeModule): CurriculumTreeModuleDTO {
    return new CurriculumTreeModuleDTO({
      id: module.id,
      levelId: module.levelId ?? null,
      title: module.title,
      description: module.description ?? null,
      category: module.category ?? null,
      difficulty: module.difficulty ?? null,
      estimatedTime: module.estimatedTime ?? null,
      thumbnail: module.thumbnail ?? null,
      order: module.order,
      isActive: module.isActive,
      status: module.status,
      color: module.color ?? null,
      tags: module.tags,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
      lessons: module.lessons.map((lesson: CurriculumTreeLesson) => CurriculumEditorMapper._toLessonDTO(lesson)),
    });
  }

  private static _toLessonDTO(lesson: CurriculumTreeLesson): CurriculumTreeLessonDTO {
    return new CurriculumTreeLessonDTO({
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug ?? null,
      order: lesson.order,
      color: lesson.color ?? null,
      tags: lesson.tags,
      isActive: lesson.isActive,
      status: lesson.status,
      estimatedTime: lesson.estimatedTime ?? null,
      blocks: lesson.blocks ?? null,
    });
  }
}
