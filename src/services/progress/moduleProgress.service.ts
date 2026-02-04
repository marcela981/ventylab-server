import { prisma } from '../../config/prisma';
import { computeModuleProgress, isModuleComplete } from '../../utils/computeModuleProgress';

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
      where: {
        moduleId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const lessonIds = lessons.map((lesson) => lesson.id);

    // Get lesson progress from LearningProgress + LessonProgress
    const learningProgress = await prisma.learningProgress.findUnique({
      where: {
        userId_moduleId: { userId, moduleId },
      },
      include: { lessons: { where: { lessonId: { in: lessonIds } } } },
    });

    const progressMap = new Map(
      (learningProgress?.lessons ?? []).map((lp) => [lp.lessonId, lp])
    );

    const lessonsWithProgress = lessons.map((lesson) => {
      const record = progressMap.get(lesson.id);
      const progressValue = record?.completed ? 100 : 0;
      return {
        id: lesson.id,
        progress: progressValue,
      };
    });

    const { completedLessonsCount, totalLessonsCount, progressPercentage } =
      computeModuleProgress(lessonsWithProgress);

    const moduleComplete = isModuleComplete(lessonsWithProgress);

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

    // Upsert LearningProgress (module-level); completedAt when all lessons done
    const updatedProgress = await prisma.learningProgress.upsert({
      where: {
        userId_moduleId: { userId, moduleId },
      },
      update: {
        completedAt: moduleComplete ? new Date() : undefined,
        updatedAt: new Date(),
      },
      create: {
        userId,
        moduleId,
        timeSpent: 0,
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

    // Get lesson progress from LearningProgress + LessonProgress
    const learningProgress = await prisma.learningProgress.findUnique({
      where: {
        userId_moduleId: { userId, moduleId },
      },
      include: {
        lessons: {
          where: { lessonId: { in: lessonIds } },
          include: {
            lesson: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    const progressMap = new Map(
      (learningProgress?.lessons ?? []).map((lp) => [lp.lessonId, lp])
    );

    const lessonsWithProgress = lessons.map((lesson) => {
      const record = progressMap.get(lesson.id);
      const progressValue = record?.completed ? 100 : 0;
      return {
        id: lesson.id,
        progress: progressValue,
      };
    });

    const { completedLessonsCount, totalLessonsCount, progressPercentage } =
      computeModuleProgress(lessonsWithProgress);

    // Last accessed lesson: LessonProgress with lastAccessed desc
    const lastAccessedRecord = lessonIds.length > 0 && learningProgress
      ? (await prisma.lessonProgress.findFirst({
          where: {
            progressId: learningProgress.id,
            lessonId: { in: lessonIds },
          },
          include: {
            lesson: {
              select: { id: true, title: true },
            },
          },
          orderBy: [{ lastAccessed: 'desc' }, { updatedAt: 'desc' }],
        }))
      : null;

    const lastAccessedLesson = lastAccessedRecord?.lesson
      ? {
          id: lastAccessedRecord.lesson.id,
          title: lastAccessedRecord.lesson.title,
          progress: lastAccessedRecord.completed ? 100 : 0,
        }
      : null;

    const nextIncompleteLesson = lessons.find((lesson) => {
      const record = progressMap.get(lesson.id);
      return !record?.completed;
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
