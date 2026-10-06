/*
 * Funcionalidad: Mapeador de presentación LessonsMapper
 * Descripción: Convierte los modelos de lectura y entidades de la feature de lecciones en DTOs de respuesta
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type LessonContentView,
  type LessonDetail,
  type LessonNeighbor,
  type LessonQuizItem,
  type LessonStepItem,
  type LessonSummary,
} from "@/features/lessons/domain/read-models/lesson-views.read-model";
import {
  LessonContentDTO,
  LessonDetailDTO,
  LessonDTO,
  LessonModuleDTO,
  LessonNeighborDTO,
  LessonNeighborModuleDTO,
  LessonQuizDTO,
  LessonStepDTO,
} from "@/features/lessons/presentation/dtos/lesson.dto";

export class LessonsMapper {
  public static toDTO(lesson: LessonSummary): LessonDTO {
    return new LessonDTO({
      id: lesson.id,
      moduleId: lesson.moduleId,
      title: lesson.title,
      slug: lesson.slug ?? null,
      content: lesson.content ?? null,
      order: lesson.order,
      estimatedTime: lesson.estimatedTime ?? null,
      aiGenerated: lesson.aiGenerated,
      isActive: lesson.isActive,
      status: lesson.status,
      color: lesson.color ?? null,
      tags: lesson.tags,
      hasRequiredQuiz: lesson.hasRequiredQuiz,
      lastModifiedBy: lesson.lastModifiedBy ?? null,
      lastModifiedAt: lesson.lastModifiedAt ?? null,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      pageCount: lesson.pageCount,
    });
  }

  public static toDetailDTO(lesson: LessonDetail): LessonDetailDTO {
    return new LessonDetailDTO({
      ...LessonsMapper.toDTO(lesson),
      sourcePrompt: lesson.sourcePrompt ?? null,
      blocks: lesson.blocks ?? null,
      module: new LessonModuleDTO({
        id: lesson.module.id,
        levelId: lesson.module.levelId ?? null,
        title: lesson.module.title,
        difficulty: lesson.module.difficulty ?? null,
        order: lesson.module.order,
        isActive: lesson.module.isActive,
      }),
      quizzes: lesson.quizzes.map(
        (quiz: LessonQuizItem) =>
          new LessonQuizDTO({
            id: quiz.id,
            title: quiz.title,
            description: quiz.description ?? null,
            questions: quiz.questions,
            passingScore: quiz.passingScore,
            timeLimit: quiz.timeLimit ?? null,
            order: quiz.order,
            isActive: quiz.isActive,
          }),
      ),
    });
  }

  public static toNeighborDTO(lesson: LessonNeighbor): LessonNeighborDTO {
    return new LessonNeighborDTO({
      ...LessonsMapper.toDTO(lesson),
      module: new LessonNeighborModuleDTO({ id: lesson.module.id, title: lesson.module.title }),
    });
  }

  public static toStepDTO(step: LessonStepItem): LessonStepDTO {
    return new LessonStepDTO({
      id: step.id,
      lessonId: step.lessonId,
      title: step.title ?? null,
      content: step.content,
      contentType: step.contentType,
      order: step.order,
      isActive: step.isActive,
      lastModifiedBy: step.lastModifiedBy ?? null,
      lastModifiedAt: step.lastModifiedAt ?? null,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt,
    });
  }

  public static toContentDTO(content: LessonContentView): LessonContentDTO {
    return new LessonContentDTO({
      id: content.id,
      title: content.title,
      slug: content.slug ?? null,
      color: content.color ?? null,
      tags: content.tags,
      blocks: content.blocks ?? null,
      estimatedTime: content.estimatedTime ?? null,
      isActive: content.isActive,
      moduleId: content.moduleId,
      updatedAt: content.updatedAt,
    });
  }
}
