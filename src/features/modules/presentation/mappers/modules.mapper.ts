/*
 * Funcionalidad: Mapeador de presentación ModulesMapper
 * Descripción: Convierte los modelos de lectura y entidades de la feature de módulos en DTOs de respuesta
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type ModuleLessonProgress,
  type ModuleProgressView,
  type ModuleResumeState,
} from "@/features/modules/domain/read-models/module-progress.read-model";
import {
  type ModuleDetail,
  type ModuleLessonItem,
  type ModuleListItem,
  type ModulePrerequisiteSummary,
  type ModuleSummary,
} from "@/features/modules/domain/read-models/module-views.read-model";
import {
  ModuleLessonProgressDTO,
  ModuleProgressDTO,
  ModuleProgressLessonDTO,
  ModuleProgressModuleDTO,
  ModuleProgressRecordDTO,
  ModuleProgressStatisticsDTO,
  ModuleResumeDTO,
} from "@/features/modules/presentation/dtos/module-progress.dto";
import {
  ModuleDependentDTO,
  ModuleDetailDTO,
  ModuleDTO,
  ModuleLessonDTO,
  ModuleListItemDTO,
  ModulePrerequisiteDTO,
} from "@/features/modules/presentation/dtos/module.dto";

export class ModulesMapper {
  public static toDTO(module: ModuleSummary): ModuleDTO {
    return new ModuleDTO({
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
      lastModifiedBy: module.lastModifiedBy ?? null,
      lastModifiedAt: module.lastModifiedAt ?? null,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
      lessonCount: module.lessonCount,
      levelColor: module.levelColor,
    });
  }

  public static toListItemDTO(module: ModuleListItem): ModuleListItemDTO {
    return new ModuleListItemDTO({
      ...ModulesMapper.toDTO(module),
      prerequisites: module.prerequisites.map((prerequisite: ModulePrerequisiteSummary) => ModulesMapper._toPrerequisiteDTO(prerequisite)),
    });
  }

  public static toDetailDTO(module: ModuleDetail): ModuleDetailDTO {
    return new ModuleDetailDTO({
      ...ModulesMapper.toDTO(module),
      prerequisites: module.prerequisites.map((prerequisite: ModulePrerequisiteSummary) => ModulesMapper._toPrerequisiteDTO(prerequisite)),
      dependentModules: module.dependentModules.map(
        (dependent: { id: string; title: string }) => new ModuleDependentDTO({ id: dependent.id, title: dependent.title }),
      ),
    });
  }

  public static toLessonDTO(lesson: ModuleLessonItem): ModuleLessonDTO {
    return new ModuleLessonDTO({
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
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      quizCount: lesson.quizCount,
      pageCount: lesson.pageCount,
    });
  }

  public static toProgressDTO(view: ModuleProgressView): ModuleProgressDTO {
    return new ModuleProgressDTO({
      progress: new ModuleProgressRecordDTO({
        id: view.progress.id,
        completedAt: view.progress.completedAt ?? null,
        timeSpent: view.progress.timeSpent,
      }),
      module: new ModuleProgressModuleDTO({ id: view.module.id, title: view.module.title, estimatedTime: view.module.estimatedTime ?? null }),
      statistics: new ModuleProgressStatisticsDTO({
        totalLessons: view.statistics.totalLessons,
        completedLessons: view.statistics.completedLessons,
        completionPercentage: view.statistics.completionPercentage,
        remainingLessons: view.statistics.remainingLessons,
      }),
      lessonProgress: view.lessonProgress.map(
        (item: ModuleLessonProgress) =>
          new ModuleLessonProgressDTO({
            lesson: new ModuleProgressLessonDTO({
              id: item.lesson.id,
              title: item.lesson.title,
              order: item.lesson.order,
              estimatedTime: item.lesson.estimatedTime ?? null,
            }),
            completed: item.completed,
            timeSpent: item.timeSpent,
            lastAccessed: item.lastAccessed ?? null,
          }),
      ),
    });
  }

  public static toResumeDTO(state: ModuleResumeState): ModuleResumeDTO {
    return new ModuleResumeDTO({
      resumeLessonId: state.currentLessonId,
      resumeLessonTitle: state.currentLessonTitle,
      resumeLessonProgress: state.moduleProgress,
      resumeLessonOrder: state.currentLessonOrder,
      moduleProgress: state.moduleProgress,
      totalLessons: state.totalLessons,
      completedLessons: state.completedLessons,
      nextLessonOrder: state.currentLessonOrder + 1,
      currentStepIndex: state.currentStepIndex,
      totalStepsInLesson: state.totalStepsInLesson,
      isModuleComplete: state.isModuleComplete,
      lastAccessedAt: state.lastAccessedAt ?? null,
    });
  }

  private static _toPrerequisiteDTO(prerequisite: ModulePrerequisiteSummary): ModulePrerequisiteDTO {
    return new ModulePrerequisiteDTO({
      id: prerequisite.id,
      title: prerequisite.title,
      description: prerequisite.description ?? null,
      difficulty: prerequisite.difficulty ?? null,
      category: prerequisite.category ?? null,
      estimatedTime: prerequisite.estimatedTime ?? null,
    });
  }
}
