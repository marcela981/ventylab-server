import { prisma } from '../../config/prisma';
import type { Progress } from '@prisma/client';
import { computeModuleProgress, isModuleComplete } from '../../utils/computeModuleProgress';

export interface ModuleProgressResult {
  success: boolean;
  progress?: Progress;
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
      where: {
        moduleId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const lessonIds = lessons.map((lesson) => lesson.id);

    // Get all lesson progress records for this module
    const progressRecords = lessonIds.length > 0
      ? await prisma.progress.findMany({
          where: {
            userId,
            lessonId: { in: lessonIds },
          },
          select: {
            lessonId: true,
            progress: true,
            completionPercentage: true,
          },
        })
      : [];

    // Build lesson list with progress values for computeModuleProgress
    // Map each lesson to its progress (0-100), defaulting to 0 if no record
    const progressMap = new Map(
      progressRecords.map((record) => [record.lessonId, record])
    );

    const lessonsWithProgress = lessons.map((lesson) => {
      const record = progressMap.get(lesson.id);
      // Use completionPercentage (0-100) as the progress value
      // Fall back to progress field if completionPercentage is not set
      const progressValue = record?.completionPercentage ?? record?.progress ?? 0;
      return {
        id: lesson.id,
        progress: progressValue,
      };
    });

    // Use computeModuleProgress as the single source of truth
    const { completedLessonsCount, totalLessonsCount, progressPercentage } =
      computeModuleProgress(lessonsWithProgress);

    // Module is complete when all lessons have progress === 100
    const moduleComplete = isModuleComplete(lessonsWithProgress);

    // Defensive check: clamp progressPercentage to 0-100
    const clampedProgress = Math.max(0, Math.min(100, progressPercentage));

    if (isDev) {
      console.log('[moduleProgress] calculateAndSaveModuleProgress', {
        userId,
        moduleId,
        totalLessonsCount,
        completedLessonsCount,
        progressPercentage: clampedProgress,
        moduleComplete,
      });
    }

    // Use upsert with unique constraint to ensure only ONE module progress record per user+module
    const updatedProgress = await prisma.progress.upsert({
      where: {
        progress_user_module_unique: { userId, moduleId },
      },
      update: {
        progress: clampedProgress,
        completionPercentage: clampedProgress,
        completed: moduleComplete,
        lastAccess: new Date(),
      },
      create: {
        userId,
        moduleId,
        lessonId: null, // Module-level progress has no lessonId
        progress: clampedProgress,
        completionPercentage: clampedProgress,
        completed: moduleComplete,
        lastAccess: new Date(),
      },
    });

    return {
      success: true,
      progress: updatedProgress,
    };
  } catch (error) {
    console.error('Error al calcular progreso del módulo:', error);
    return {
      success: false,
      error: 'Error al calcular progreso del módulo',
    };
  }
}

export async function getModuleProgressStats(
  userId: string,
  moduleId: string
): Promise<ModuleStats> {
  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        moduleId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        order: true,
      },
      orderBy: { order: 'asc' },
    });

    const lessonIds = lessons.map((lesson) => lesson.id);

    // Get all lesson progress records for this module
    // Only filter by lessonId (not moduleId) since moduleId in Progress table is for module-level records
    const progressRecords = lessonIds.length > 0
      ? await prisma.progress.findMany({
          where: {
            userId,
            lessonId: { in: lessonIds },
          },
          select: {
            lessonId: true,
            progress: true,
            completionPercentage: true,
          },
        })
      : [];

    const progressMap = new Map(
      progressRecords.map((record) => [record.lessonId, record])
    );

    // Build lesson list with progress values for computeModuleProgress
    const lessonsWithProgress = lessons.map((lesson) => {
      const record = progressMap.get(lesson.id);
      // Use completionPercentage (0-100), fall back to progress field
      const progressValue = record?.completionPercentage ?? record?.progress ?? 0;
      return {
        id: lesson.id,
        progress: progressValue,
      };
    });

    // Use computeModuleProgress as the single source of truth
    const { completedLessonsCount, totalLessonsCount, progressPercentage } =
      computeModuleProgress(lessonsWithProgress);

    // Find last accessed lesson by querying lesson progress records (not module progress)
    // Filter by lessonId in lessonIds array, not by moduleId
    const lastAccessedRecord = lessonIds.length > 0
      ? await prisma.progress.findFirst({
          where: {
            userId,
            lessonId: { in: lessonIds },
          },
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: [
            { lastAccess: 'desc' },
            { updatedAt: 'desc' },
          ],
        })
      : null;

    const lastAccessedLesson = lastAccessedRecord?.lesson
      ? {
          id: lastAccessedRecord.lesson.id,
          title: lastAccessedRecord.lesson.title,
          progress: lastAccessedRecord.progress,
        }
      : null;

    // Find next lesson where progress !== 100 (not completed)
    const nextIncompleteLesson = lessons.find((lesson) => {
      const record = progressMap.get(lesson.id);
      const progressValue = record?.completionPercentage ?? record?.progress ?? 0;
      return progressValue !== 100;
    }) ?? null;

    if (isDev) {
      console.log('[moduleProgress] getModuleProgressStats', {
        userId,
        moduleId,
        totalLessonsCount,
        completedLessonsCount,
        progressPercentage,
      });
    }

    return {
      totalLessons: totalLessonsCount,
      completedLessons: completedLessonsCount,
      moduleProgress: progressPercentage,
      lastAccessedLesson,
      nextIncompleteLesson: nextIncompleteLesson
        ? {
            id: nextIncompleteLesson.id,
            title: nextIncompleteLesson.title,
            order: nextIncompleteLesson.order,
          }
        : null,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas del módulo:', error);
    throw new Error('Error al obtener estadísticas del módulo');
  }
}
