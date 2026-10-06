/*
 * Funcionalidad: Mapper de persistencia de progreso
 * Descripción: Convierte filas Prisma de UserProgress, LessonCompletion y Achievement en los registros y entidades del dominio de progreso
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type Achievement as AchievementModel,
  type LessonCompletion as LessonCompletionModel,
  type Prisma,
  type UserProgress as UserProgressModel,
} from "@prisma/client";

import { Achievement } from "@/features/progress/domain/entities/achievement.entity";
import { type LessonCompletionSnapshot, type ModuleProgressSnapshot } from "@/features/progress/domain/read-models/progress-records.read-model";

export class ProgressMapper {
  public static toLessonCompletionSnapshot(row: LessonCompletionModel): LessonCompletionSnapshot {
    return {
      lessonId: row.lessonId,
      currentStepIndex: row.currentStepIndex,
      totalSteps: row.totalSteps,
      timeSpent: row.timeSpent,
      lastAccessed: row.lastAccessed ?? undefined,
      isCompleted: row.isCompleted,
      completedAt: row.completedAt ?? undefined,
      bestQuizScore: row.bestQuizScore ?? undefined,
      updatedAt: row.updatedAt,
    };
  }

  public static toModuleProgressSnapshot(row: UserProgressModel): ModuleProgressSnapshot {
    return {
      moduleId: row.moduleId,
      status: row.status,
      isModuleCompleted: row.isModuleCompleted,
      completedLessonsCount: row.completedLessonsCount,
      totalLessons: row.totalLessons,
      progressPercentage: row.progressPercentage,
      timeSpent: row.timeSpent,
      lastAccessedAt: row.lastAccessedAt,
      completedAt: row.completedAt ?? undefined,
    };
  }

  public static toAchievement(row: AchievementModel): Achievement {
    return Achievement.reconstitute({
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description ?? undefined,
      icon: row.icon ?? undefined,
      unlockedAt: row.unlockedAt,
      auditLogs: [],
    });
  }

  public static toAchievementPersistence(achievement: Achievement): Prisma.AchievementUncheckedCreateInput {
    return {
      id: achievement.id,
      userId: achievement.userId,
      title: achievement.title,
      description: achievement.description ?? null,
      icon: achievement.icon ?? null,
      unlockedAt: achievement.unlockedAt,
    };
  }
}
