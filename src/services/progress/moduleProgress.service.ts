import { prisma } from '../../config/prisma';
import type { Progress } from '@prisma/client';

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

    const totalLessons = lessons.length;
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
            completed: true, // Use explicit completion flag
          },
        })
      : [];

    const progressMap = new Map(
      progressRecords.map((record) => [record.lessonId, record])
    );

    // Count ONLY explicitly completed lessons (completed = true)
    // Never use progress percentage as a heuristic for completion
    const completedLessons = progressRecords.filter((record) => record.completed === true).length;

    // Module progress = (completedLessons / totalLessons) * 100
    const calculatedProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const roundedProgress = Math.round(calculatedProgress * 100) / 100;

    // Module is complete ONLY when ALL lessons are explicitly completed
    const isModuleComplete = totalLessons > 0 && completedLessons === totalLessons;

    if (isDev) {
      console.log('[moduleProgress] calculateAndSaveModuleProgress', {
        userId,
        moduleId,
        totalLessons,
        completedLessons,
        calculatedProgress: roundedProgress,
        isModuleComplete,
      });
    }

    const updatedProgress = await prisma.progress.upsert({
      where: {
        progress_user_module_unique: { userId, moduleId },
      },
      update: {
        progress: roundedProgress,
        completed: isModuleComplete,
        lastAccess: new Date(),
      },
      create: {
        userId,
        moduleId,
        progress: roundedProgress,
        completed: isModuleComplete,
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

    const totalLessons = lessons.length;
    const lessonIds = lessons.map((lesson) => lesson.id);

    const progressRecords = lessonIds.length > 0
      ? await prisma.progress.findMany({
          where: {
            userId,
            moduleId,
            lessonId: { in: lessonIds },
          },
          select: {
            lessonId: true,
            progress: true,
            completed: true,
          },
        })
      : [];

    const progressMap = new Map(
      progressRecords.map((record) => [record.lessonId, record])
    );

    let completedLessons = 0;
    let totalProgress = 0;

    // Count ONLY explicitly completed lessons (completed = true)
    // Never use progress percentage as a heuristic for completion
    lessons.forEach((lesson) => {
      const record = progressMap.get(lesson.id);
      // Only check explicit completed flag, not progress value
      const isCompleted = record?.completed === true;

      if (isCompleted) {
        completedLessons += 1;
      }
    });

    // Module progress = (completedLessons / totalLessons) * 100
    const moduleProgress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100 * 100) / 100
      : 0;

    const lastAccessedRecord = await prisma.progress.findFirst({
      where: {
        userId,
        moduleId,
        lessonId: { not: null },
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
    });

    const lastAccessedLesson = lastAccessedRecord?.lesson
      ? {
          id: lastAccessedRecord.lesson.id,
          title: lastAccessedRecord.lesson.title,
          progress: lastAccessedRecord.progress,
        }
      : null;

    // Find next lesson that is NOT explicitly marked as completed
    const nextIncompleteLesson = lessons.find((lesson) => {
      const record = progressMap.get(lesson.id);
      // Only check explicit completed flag
      return record?.completed !== true;
    }) ?? null;

    if (isDev) {
      console.log('[moduleProgress] getModuleProgressStats', {
        userId,
        moduleId,
        totalLessons,
        completedLessons,
        moduleProgress,
      });
    }

    return {
      totalLessons,
      completedLessons,
      moduleProgress,
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
