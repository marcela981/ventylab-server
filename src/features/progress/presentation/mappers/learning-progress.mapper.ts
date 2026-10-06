/*
 * Funcionalidad: Mapper de progreso por páginas
 * Descripción: Convierte los modelos de lectura del progreso ponderado por lecciones y el resultado de una vista de página en sus DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type LearningProgressReport,
  type LessonLearningProgress,
  type LevelLearningProgress,
  type ModuleLearningProgress,
  type PageViewResult,
  type SectionLearningProgress,
} from "@/features/progress/domain/read-models/learning-progress.read-model";
import {
  LearningProgressSummaryDTO,
  LessonPageProgressDTO,
  LevelLearningProgressDTO,
  LevelProgressItemDTO,
  ModuleLearningProgressDTO,
  ModuleProgressItemDTO,
  PageViewResultDTO,
  SectionLearningProgressDTO,
  SectionProgressItemDTO,
} from "@/features/progress/presentation/dtos/learning-progress.dto";

export class LearningProgressMapper {
  public static toPageViewResultDTO(result: PageViewResult): PageViewResultDTO {
    return new PageViewResultDTO({
      pageId: result.pageId,
      lessonId: result.lessonId ?? null,
      firstViewedAt: result.firstViewedAt,
      lastVisitedAt: result.lastVisitedAt,
      lessonCompleted: result.lessonCompleted,
      lessonJustCompleted: result.lessonJustCompleted,
      viewedPages: result.viewedPages,
      totalPages: result.totalPages,
    });
  }

  public static toModuleProgressItemDTO(progress: ModuleLearningProgress): ModuleProgressItemDTO {
    return new ModuleProgressItemDTO({
      moduleId: progress.moduleId,
      levelId: progress.levelId ?? null,
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
      percentage: progress.percentage,
      completed: progress.completed,
    });
  }

  public static toModuleLearningProgressDTO(progress: ModuleLearningProgress): ModuleLearningProgressDTO {
    return new ModuleLearningProgressDTO({
      ...LearningProgressMapper.toModuleProgressItemDTO(progress),
      lessons: progress.lessons.map(
        (lesson: LessonLearningProgress) =>
          new LessonPageProgressDTO({
            lessonId: lesson.lessonId,
            viewedPages: lesson.viewedPages,
            totalPages: lesson.totalPages,
            completedByPages: lesson.completedByPages,
            completed: lesson.completed,
          }),
      ),
    });
  }

  public static toLevelProgressItemDTO(progress: LevelLearningProgress): LevelProgressItemDTO {
    return new LevelProgressItemDTO({
      levelId: progress.levelId,
      sectionId: progress.sectionId ?? null,
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
      percentage: progress.percentage,
      completed: progress.completed,
      completedModules: progress.completedModules,
      totalModules: progress.totalModules,
    });
  }

  public static toLevelLearningProgressDTO(progress: LevelLearningProgress): LevelLearningProgressDTO {
    return new LevelLearningProgressDTO({
      ...LearningProgressMapper.toLevelProgressItemDTO(progress),
      modules: progress.modules.map((module: ModuleLearningProgress) => LearningProgressMapper.toModuleProgressItemDTO(module)),
    });
  }

  public static toSectionProgressItemDTO(progress: SectionLearningProgress): SectionProgressItemDTO {
    return new SectionProgressItemDTO({
      sectionId: progress.sectionId,
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
      percentage: progress.percentage,
      completed: progress.completed,
      completedLevels: progress.completedLevels,
      totalLevels: progress.totalLevels,
    });
  }

  public static toSectionLearningProgressDTO(progress: SectionLearningProgress): SectionLearningProgressDTO {
    return new SectionLearningProgressDTO({
      ...LearningProgressMapper.toSectionProgressItemDTO(progress),
      levels: progress.levels.map((level: LevelLearningProgress) => LearningProgressMapper.toLevelProgressItemDTO(level)),
    });
  }

  public static toLearningProgressSummaryDTO(report: LearningProgressReport): LearningProgressSummaryDTO {
    return new LearningProgressSummaryDTO({
      completedLessons: report.overall.completedLessons,
      totalLessons: report.overall.totalLessons,
      percentage: report.overall.percentage,
      completed: report.overall.completed,
      sections: report.sections.map((section: SectionLearningProgress) => LearningProgressMapper.toSectionProgressItemDTO(section)),
      levels: report.levels.map((level: LevelLearningProgress) => LearningProgressMapper.toLevelProgressItemDTO(level)),
      modules: report.modules.map((module: ModuleLearningProgress) => LearningProgressMapper.toModuleProgressItemDTO(module)),
    });
  }
}
