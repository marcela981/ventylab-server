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

    const progressRecords = lessonIds.length > 0
      ? await prisma.progress.findMany({
          where: {
            userId,
            lessonId: { in: lessonIds },
          },
          select: {
            lessonId: true,
            progress: true,
          },
        })
      : [];

    const progressMap = new Map(
      progressRecords.map((record) => [record.lessonId, record.progress])
    );

    const totalProgress = lessonIds.reduce((sum, lessonId) => {
      const lessonProgress = progressMap.get(lessonId) ?? 0;
      return sum + lessonProgress;
    }, 0);

    const averageProgress = totalLessons > 0 ? totalProgress / totalLessons : 0;
    const calculatedProgress = Math.max(0, Math.min(100, averageProgress));
    const roundedProgress = Math.round(calculatedProgress * 100) / 100;

    if (isDev) {
      console.log('[moduleProgress] calculateAndSaveModuleProgress', {
        userId,
        moduleId,
        totalLessons,
        calculatedProgress: roundedProgress,
      });
    }

    const updatedProgress = await prisma.progress.upsert({
      where: {
        userId_moduleId: { userId, moduleId },
      },
      update: {
        progress: roundedProgress,
        completed: roundedProgress >= 100,
        lastAccess: new Date(),
      },
      create: {
        userId,
        moduleId,
        progress: roundedProgress,
        completed: roundedProgress >= 100,
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

    lessons.forEach((lesson) => {
      const record = progressMap.get(lesson.id);
      const progressValue = record?.progress ?? 0;
      const isCompleted = Boolean(record?.completed) || progressValue >= 90;

      if (isCompleted) {
        completedLessons += 1;
      }

      totalProgress += progressValue;
    });

    const averageProgress = totalLessons > 0 ? totalProgress / totalLessons : 0;
    const moduleProgress = Math.round(Math.max(0, Math.min(100, averageProgress)) * 100) / 100;

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

    const nextIncompleteLesson = lessons.find((lesson) => {
      const record = progressMap.get(lesson.id);
      const progressValue = record?.progress ?? 0;
      const isCompleted = Boolean(record?.completed) || progressValue >= 90;
      return !isCompleted;
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
