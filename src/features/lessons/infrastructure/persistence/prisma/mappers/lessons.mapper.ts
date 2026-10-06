/*
 * Funcionalidad: Mapeador de persistencia LessonsMapper
 * Descripción: Convierte entre los modelos de Prisma y las entidades de dominio de la feature de lecciones
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Lesson as LessonModel, Prisma } from "@prisma/client";

import { Lesson } from "@/features/lessons/domain/entities/lesson.entity";
import { type LessonSummary } from "@/features/lessons/domain/read-models/lesson-views.read-model";
import { calculatePageCount } from "@/features/lessons/domain/services/lesson-content";

export class LessonsMapper {
  public static toDomain(row: LessonModel): Lesson {
    return Lesson.reconstitute({
      id: row.id,
      moduleId: row.moduleId,
      title: row.title,
      slug: row.slug ?? undefined,
      content: row.content ?? undefined,
      order: row.order,
      estimatedTime: row.estimatedTime ?? undefined,
      aiGenerated: row.aiGenerated,
      sourcePrompt: row.sourcePrompt ?? undefined,
      isActive: row.isActive,
      status: row.status,
      color: row.color ?? undefined,
      tags: row.tags,
      blocks: row.blocks ?? undefined,
      hasRequiredQuiz: row.hasRequiredQuiz,
      lastModifiedBy: row.lastModifiedBy ?? undefined,
      lastModifiedAt: row.lastModifiedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toPersistence(lesson: Lesson): Prisma.LessonUncheckedCreateInput {
    return {
      id: lesson.id,
      moduleId: lesson.moduleId,
      title: lesson.title,
      slug: lesson.slug ?? null,
      content: lesson.content ?? null,
      order: lesson.order,
      estimatedTime: lesson.estimatedTime ?? null,
      aiGenerated: lesson.aiGenerated,
      sourcePrompt: lesson.sourcePrompt ?? null,
      isActive: lesson.isActive,
      status: lesson.status,
      color: lesson.color ?? null,
      tags: [...lesson.tags],
      blocks: lesson.blocks === undefined ? Prisma.DbNull : (lesson.blocks as Prisma.InputJsonValue),
      hasRequiredQuiz: lesson.hasRequiredQuiz,
      lastModifiedBy: lesson.lastModifiedBy ?? null,
      lastModifiedAt: lesson.lastModifiedAt ?? null,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };
  }

  public static toSummary(row: LessonModel): LessonSummary {
    return {
      id: row.id,
      moduleId: row.moduleId,
      title: row.title,
      slug: row.slug ?? undefined,
      content: row.content ?? undefined,
      order: row.order,
      estimatedTime: row.estimatedTime ?? undefined,
      aiGenerated: row.aiGenerated,
      isActive: row.isActive,
      status: row.status,
      color: row.color ?? undefined,
      tags: row.tags,
      hasRequiredQuiz: row.hasRequiredQuiz,
      lastModifiedBy: row.lastModifiedBy ?? undefined,
      lastModifiedAt: row.lastModifiedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      pageCount: calculatePageCount(row.content),
    };
  }
}
