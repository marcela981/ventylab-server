/*
 * Funcionalidad: Mapper de presentación de progreso
 * Descripción: Convierte las vistas de progreso del dominio (lección, módulo, detalle, reanudación, resumen general, logros, hitos, habilidades y accesos) en los DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ModuleResumeState } from "@/features/modules/domain/read-models/module-progress.read-model";
import {
  type LessonProgressDetails,
  type LessonProgressView,
  type MilestoneItem,
  type MilestonesSummary,
  type ModuleProgressSummary,
  type OverviewLessonItem,
  type OverviewLevelItem,
  type OverviewModuleItem,
  type ProgressOverview,
  type SkillItem,
  type SkillsSummary,
  type UnlockedAchievementView,
  type UnlockedModules,
} from "@/features/progress/domain/read-models/progress-views.read-model";
import { AchievementDTO, AchievementsDTO, MilestoneDTO, MilestonesDTO, SkillDTO, SkillsDTO } from "@/features/progress/presentation/dtos/achievement.dto";
import {
  OverviewLessonDTO,
  OverviewLevelDTO,
  OverviewModuleDTO,
  OverviewStatsDTO,
  ProgressOverviewDTO,
} from "@/features/progress/presentation/dtos/progress-overview.dto";
import {
  LessonAccessDTO,
  LessonProgressDetailsDTO,
  LessonProgressDTO,
  ModuleAccessDTO,
  ModuleProgressSummaryDTO,
  ProgressResumeDTO,
  UnlockedModulesDTO,
} from "@/features/progress/presentation/dtos/progress.dto";

export class ProgressMapper {
  public static toLessonProgressDTO(view: LessonProgressView): LessonProgressDTO {
    return new LessonProgressDTO({
      lessonId: view.lessonId,
      completed: view.completed,
      timeSpent: view.timeSpent,
      lastAccessed: view.lastAccessed ?? null,
      completionPercentage: view.completionPercentage,
      currentStep: view.currentStep,
      totalSteps: view.totalSteps,
    });
  }

  public static toModuleProgressSummaryDTO(summary: ModuleProgressSummary): ModuleProgressSummaryDTO {
    return new ModuleProgressSummaryDTO({
      moduleId: summary.moduleId,
      totalLessons: summary.totalLessons,
      completedLessons: summary.completedLessons,
      completionPercentage: summary.completionPercentage,
      isModuleCompleted: summary.isModuleCompleted,
      timeSpent: summary.timeSpent,
      completedAt: summary.completedAt ?? null,
      lessons: summary.lessons.map((lesson: LessonProgressView) => ProgressMapper.toLessonProgressDTO(lesson)),
      source: summary.source,
    });
  }

  public static toLessonProgressDetailsDTO(details: LessonProgressDetails): LessonProgressDetailsDTO {
    return new LessonProgressDetailsDTO({
      lessonId: details.lessonId,
      currentStepIndex: details.currentStepIndex,
      totalSteps: details.totalSteps,
      completed: details.completed,
      timeSpent: details.timeSpent,
      lastAccessed: details.lastAccessed ?? null,
      progressPercentage: details.progressPercentage,
    });
  }

  public static toProgressResumeDTO(state: ModuleResumeState): ProgressResumeDTO {
    return new ProgressResumeDTO({
      moduleId: state.moduleId,
      moduleName: state.moduleName,
      currentLessonId: state.currentLessonId,
      currentLessonTitle: state.currentLessonTitle,
      currentLessonOrder: state.currentLessonOrder,
      currentStepIndex: state.currentStepIndex,
      totalStepsInLesson: state.totalStepsInLesson,
      moduleProgress: state.moduleProgress,
      totalLessons: state.totalLessons,
      completedLessons: state.completedLessons,
      isModuleComplete: state.isModuleComplete,
      lastAccessedAt: state.lastAccessedAt ?? null,
    });
  }

  public static toProgressOverviewDTO(overview: ProgressOverview): ProgressOverviewDTO {
    return new ProgressOverviewDTO({
      overview: new OverviewStatsDTO({ ...overview.stats }),
      modules: overview.modules.map(
        (module: OverviewModuleItem) =>
          new OverviewModuleDTO({
            moduleId: module.moduleId,
            title: module.title,
            levelId: module.levelId ?? null,
            description: module.description ?? null,
            difficulty: module.difficulty ?? null,
            estimatedTime: module.estimatedTime ?? null,
            order: module.order,
            lessonsTotal: module.lessonsTotal,
            lessonsCompleted: module.lessonsCompleted,
            percent: module.percent,
            isAvailable: module.isAvailable,
            completed: module.completed,
          }),
      ),
      lessons: overview.lessons.map(
        (lesson: OverviewLessonItem) =>
          new OverviewLessonDTO({
            lessonId: lesson.lessonId,
            moduleId: lesson.moduleId,
            completed: lesson.completed,
            progress: lesson.progress,
            xpEarned: lesson.xpEarned,
            lastVisitedAt: lesson.lastVisitedAt ?? null,
            updatedAt: lesson.updatedAt ?? null,
          }),
      ),
      levels: overview.levels.map((level: OverviewLevelItem) => new OverviewLevelDTO({ ...level })),
    });
  }

  public static toAchievementsDTO(achievements: UnlockedAchievementView[]): AchievementsDTO {
    return new AchievementsDTO({
      achievements: achievements.map(
        (achievement: UnlockedAchievementView) =>
          new AchievementDTO({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description ?? null,
            icon: achievement.icon ?? null,
            unlockedAt: achievement.unlockedAt,
            xpReward: achievement.xpReward,
          }),
      ),
      totalUnlocked: achievements.length,
    });
  }

  public static toMilestonesDTO(summary: MilestonesSummary): MilestonesDTO {
    return new MilestonesDTO({
      milestones: summary.milestones.map((milestone: MilestoneItem) => new MilestoneDTO({ ...milestone })),
      totalCompleted: summary.totalCompleted,
      totalAvailable: summary.totalAvailable,
      nextMilestone: summary.nextMilestone ? new MilestoneDTO({ ...summary.nextMilestone }) : null,
    });
  }

  public static toSkillsDTO(summary: SkillsSummary): SkillsDTO {
    return new SkillsDTO({
      skills: summary.skills.map((skill: SkillItem) => new SkillDTO({ ...skill })),
      categories: summary.categories.map((category: SkillItem) => new SkillDTO({ ...category })),
      overallLevel: summary.overallLevel,
    });
  }

  public static toUnlockedModulesDTO(unlocked: UnlockedModules): UnlockedModulesDTO {
    return new UnlockedModulesDTO({ unlockedModuleIds: unlocked.unlockedModuleIds, count: unlocked.count });
  }

  public static toModuleAccessDTO(moduleId: string, hasAccess: boolean): ModuleAccessDTO {
    return new ModuleAccessDTO({ moduleId, hasAccess });
  }

  public static toLessonAccessDTO(lessonId: string, hasAccess: boolean): LessonAccessDTO {
    return new LessonAccessDTO({ lessonId, hasAccess });
  }
}
