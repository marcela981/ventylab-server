/**
 * MODULE PROGRESS SERVICE (FASE 3 - Migrated)
 * =============================================
 *
 * Uses UserProgress + LessonCompletion (unified system).
 * Legacy: LearningProgress + LessonProgress removed.
 */

import { prisma } from '../../shared/infrastructure/database';
import { ProgressStatus } from '@prisma/client';
import { computeModuleProgress, isModuleComplete } from '../../shared/utils/computeModuleProgress';

export interface ModuleProgressResult {
  success: boolean;
  progress?: {
    id: string;
    userId: string;
    moduleId: string;
    completedAt: Date | null;
    timeSpent: number;
  };
  error?: string;
}

export interface ModuleStats {
  totalLessons: number;
  completedLessons: number;
  moduleProgress: number;
  lastAccessedLesson: {
    id: string;
    title: string;
    progress: number;
  } | null;
  nextIncompleteLesson: {
    id: string;
    title: string;
    order: number;
  } | null;
}

const isDev = process.env.NODE_ENV === 'development';

export async function calculateAndSaveModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgressResult> {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { moduleId, isActive: true },
      select: { id: true },
    });

    const lessonIds = lessons.map(l => l.id);

    // Get completions from unified system
    const completions = await prisma.lessonCompletion.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, isCompleted: true },
    });
    const completionMap = new Map(completions.map(c => [c.lessonId, c]));

    const lessonsWithProgress = lessons.map(lesson => ({
      id: lesson.id,
      progress: completionMap.get(lesson.id)?.isCompleted ? 100 : 0,
    }));

    const { completedLessonsCount, totalLessonsCount, progressPercentage } =
      computeModuleProgress(lessonsWithProgress);

    const moduleComplete = isModuleComplete(lessonsWithProgress);
    const clampedProgress = Math.max(0, Math.min(100, progressPercentage));

    if (isDev) {
      console.log('[moduleProgress] calculateAndSaveModuleProgress', {
        userId, moduleId, totalLessonsCount, completedLessonsCount,
        progressPercentage: clampedProgress, moduleComplete,
      });
    }

    const status: ProgressStatus = moduleComplete
      ? ProgressStatus.COMPLETED
      : clampedProgress > 0
        ? ProgressStatus.IN_PROGRESS
        : ProgressStatus.NOT_STARTED;

    const updatedProgress = await prisma.userProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: {
        status,
        isModuleCompleted: moduleComplete,
        completedLessonsCount,
        totalLessons: totalLessonsCount,
        progressPercentage: clampedProgress,
        completedAt: moduleComplete ? new Date() : undefined,
      },
      create: {
        userId,
        moduleId,
        status,
        isModuleCompleted: moduleComplete,
        completedLessonsCount,
        totalLessons: totalLessonsCount,
        progressPercentage: clampedProgress,
        completedAt: moduleComplete ? new Date() : undefined,
      },
    });

    return {
      success: true,
      progress: {
        id: updatedProgress.id,
        userId: updatedProgress.userId,
        moduleId: updatedProgress.moduleId,
        completedAt: updatedProgress.completedAt,
        timeSpent: updatedProgress.timeSpent,
      },
    };
  } catch (error) {
    console.error('Error al calcular progreso del módulo:', error);
    return { success: false, error: 'Error al calcular progreso del módulo' };
  }
}

export async function getModuleProgressStats(
  userId: string,
  moduleId: string
): Promise<ModuleStats> {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { moduleId, isActive: true },
      select: { id: true, title: true, order: true },
      orderBy: { order: 'asc' },
    });

    const lessonIds = lessons.map(l => l.id);

    const completions = await prisma.lessonCompletion.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, isCompleted: true, lastAccessed: true },
    });
    const completionMap = new Map(completions.map(c => [c.lessonId, c]));

    const lessonsWithProgress = lessons.map(lesson => ({
      id: lesson.id,
      progress: completionMap.get(lesson.id)?.isCompleted ? 100 : 0,
    }));

    const { completedLessonsCount, totalLessonsCount, progressPercentage } =
      computeModuleProgress(lessonsWithProgress);

    // Last accessed lesson: find completion with most recent lastAccessed
    const lastAccessedCompletion = completions
      .filter(c => c.lastAccessed)
      .sort((a, b) => (b.lastAccessed!.getTime()) - (a.lastAccessed!.getTime()))[0];

    const lastAccessedLesson = lastAccessedCompletion
      ? (() => {
          const lesson = lessons.find(l => l.id === lastAccessedCompletion.lessonId);
          return lesson
            ? { id: lesson.id, title: lesson.title, progress: lastAccessedCompletion.isCompleted ? 100 : 0 }
            : null;
        })()
      : null;

    const nextIncompleteLesson = lessons.find(lesson => !completionMap.get(lesson.id)?.isCompleted) ?? null;

    if (isDev) {
      console.log('[moduleProgress] getModuleProgressStats', {
        userId, moduleId, totalLessonsCount, completedLessonsCount, progressPercentage,
      });
    }

    return {
      totalLessons: totalLessonsCount,
      completedLessons: completedLessonsCount,
      moduleProgress: progressPercentage,
      lastAccessedLesson,
      nextIncompleteLesson: nextIncompleteLesson
        ? { id: nextIncompleteLesson.id, title: nextIncompleteLesson.title, order: nextIncompleteLesson.order }
        : null,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas del módulo:', error);
    throw new Error('Error al obtener estadísticas del módulo');
  }
}
