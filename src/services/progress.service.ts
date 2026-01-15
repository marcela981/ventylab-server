/**
 * Progress Service
 * Consolidated service for lesson and module progress tracking
 */

import { prisma } from '../config/prisma';

/**
 * Type definitions
 */
export interface UpdateLessonProgressParams {
  userId: string;
  lessonId: string;
  completionPercentage: number;
  timeSpent?: number; // in seconds
  scrollPosition?: number;
  lastViewedSection?: string;
}

export interface LessonProgressResult {
  id: string;
  userId: string;
  lessonId: string;
  moduleId: string | null;
  completed: boolean;
  completionPercentage: number;
  progress: number;
  timeSpent: number;
  scrollPosition: number | null;
  lastViewedSection: string | null;
  lastAccess: Date | null;
  updatedAt: Date;
}

export interface ModuleProgressResult {
  moduleId: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  timeSpent: number;
  lastAccessedAt: Date | null;
  isCompleted: boolean;
}

export interface ModuleResumePoint {
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
  moduleId: string;
  completionPercentage: number;
  scrollPosition: number | null;
  lastViewedSection: string | null;
}

export interface UserOverview {
  totalLessons: number;
  completedLessons: number;
  totalModules: number;
  modulesInProgress: number;
  overallProgress: number;
  lastAccessedModule: {
    moduleId: string;
    moduleTitle: string;
    progress: number;
    lastAccess: Date;
  } | null;
}

/**
 * Update or create lesson progress
 */
export async function updateLessonProgress(
  params: UpdateLessonProgressParams
): Promise<LessonProgressResult> {
  const {
    userId,
    lessonId,
    completionPercentage,
    timeSpent,
    scrollPosition,
    lastViewedSection,
  } = params;

  // Validate lesson exists and get moduleId
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, moduleId: true, isActive: true },
  });

  if (!lesson) {
    throw new Error('Lección no encontrada');
  }

  if (!lesson.isActive) {
    throw new Error('Lección no está activa');
  }

  // Auto-complete if >= 90%
  const isCompleted = completionPercentage >= 90;

  // Convert timeSpent from seconds to minutes for storage
  const timeSpentMinutes = timeSpent ? Math.round(timeSpent / 60) : 0;

  // Upsert progress
  const progress = await prisma.progress.upsert({
    where: {
      progress_user_lesson_unique: {
        userId,
        lessonId,
      },
    },
    create: {
      userId,
      lessonId,
      moduleId: lesson.moduleId,
      completed: isCompleted,
      completionPercentage,
      progress: completionPercentage,
      timeSpent: timeSpentMinutes,
      scrollPosition,
      lastViewedSection,
      lastAccess: new Date(),
    },
    update: {
      completed: isCompleted,
      completionPercentage,
      progress: completionPercentage,
      ...(timeSpent !== undefined && {
        timeSpent: {
          increment: timeSpentMinutes,
        },
      }),
      ...(scrollPosition !== undefined && { scrollPosition }),
      ...(lastViewedSection !== undefined && { lastViewedSection }),
      lastAccess: new Date(),
    },
  });

  // Update module progress
  if (lesson.moduleId) {
    await updateModuleProgress(userId, lesson.moduleId);
  }

  return {
    id: progress.id,
    userId: progress.userId,
    lessonId: progress.lessonId!,
    moduleId: progress.moduleId,
    completed: progress.completed,
    completionPercentage: progress.completionPercentage,
    progress: progress.progress,
    timeSpent: progress.timeSpent,
    scrollPosition: progress.scrollPosition,
    lastViewedSection: progress.lastViewedSection,
    lastAccess: progress.lastAccess,
    updatedAt: progress.updatedAt,
  };
}

/**
 * Get lesson progress for a user
 */
export async function getLessonProgress(
  userId: string,
  lessonId: string
): Promise<LessonProgressResult | null> {
  const progress = await prisma.progress.findUnique({
    where: {
      progress_user_lesson_unique: {
        userId,
        lessonId,
      },
    },
  });

  if (!progress || !progress.lessonId) {
    return null;
  }

  return {
    id: progress.id,
    userId: progress.userId,
    lessonId: progress.lessonId,
    moduleId: progress.moduleId,
    completed: progress.completed,
    completionPercentage: progress.completionPercentage,
    progress: progress.progress,
    timeSpent: progress.timeSpent,
    scrollPosition: progress.scrollPosition,
    lastViewedSection: progress.lastViewedSection,
    lastAccess: progress.lastAccess,
    updatedAt: progress.updatedAt,
  };
}

/**
 * Get module progress for a user
 */
export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgressResult> {
  // Get all lessons for the module
  const lessons = await prisma.lesson.findMany({
    where: {
      moduleId,
      isActive: true,
    },
    select: { id: true },
  });

  const totalLessons = lessons.length;

  if (totalLessons === 0) {
    return {
      moduleId,
      progress: 0,
      completedLessons: 0,
      totalLessons: 0,
      timeSpent: 0,
      lastAccessedAt: null,
      isCompleted: false,
    };
  }

  // Get progress for all lessons
  const progressRecords = await prisma.progress.findMany({
    where: {
      userId,
      lessonId: {
        in: lessons.map((l) => l.id),
      },
    },
    select: {
      completed: true,
      timeSpent: true,
      lastAccess: true,
    },
  });

  const completedLessons = progressRecords.filter((p) => p.completed).length;
  const totalTimeSpent = progressRecords.reduce((sum, p) => sum + p.timeSpent, 0);
  const lastAccessedAt = progressRecords
    .map((p) => p.lastAccess)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0] || null;

  const progress = Math.round((completedLessons / totalLessons) * 100);
  const isCompleted = completedLessons === totalLessons;

  return {
    moduleId,
    progress,
    completedLessons,
    totalLessons,
    timeSpent: totalTimeSpent,
    lastAccessedAt,
    isCompleted,
  };
}

/**
 * Get the resume point for a module (first incomplete lesson)
 */
export async function getModuleResumePoint(
  userId: string,
  moduleId: string
): Promise<ModuleResumePoint | null> {
  // Get all lessons ordered by order
  const lessons = await prisma.lesson.findMany({
    where: {
      moduleId,
      isActive: true,
    },
    orderBy: {
      order: 'asc',
    },
    select: {
      id: true,
      title: true,
      order: true,
    },
  });

  if (lessons.length === 0) {
    return null;
  }

  // Get progress for all lessons
  const progressRecords = await prisma.progress.findMany({
    where: {
      userId,
      lessonId: {
        in: lessons.map((l) => l.id),
      },
    },
    select: {
      lessonId: true,
      completed: true,
      completionPercentage: true,
      scrollPosition: true,
      lastViewedSection: true,
    },
  });

  // Create a map for quick lookup
  const progressMap = new Map(
    progressRecords.map((p) => [p.lessonId, p])
  );

  // Find first incomplete lesson
  for (const lesson of lessons) {
    const progress = progressMap.get(lesson.id);
    if (!progress || !progress.completed) {
      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonOrder: lesson.order,
        moduleId,
        completionPercentage: progress?.completionPercentage || 0,
        scrollPosition: progress?.scrollPosition || null,
        lastViewedSection: progress?.lastViewedSection || null,
      };
    }
  }

  // All lessons completed, return last lesson
  const lastLesson = lessons[lessons.length - 1];
  const lastProgress = progressMap.get(lastLesson.id);

  return {
    lessonId: lastLesson.id,
    lessonTitle: lastLesson.title,
    lessonOrder: lastLesson.order,
    moduleId,
    completionPercentage: lastProgress?.completionPercentage || 100,
    scrollPosition: lastProgress?.scrollPosition || null,
    lastViewedSection: lastProgress?.lastViewedSection || null,
  };
}

/**
 * Get user overview of all progress
 */
export async function getUserOverview(userId: string): Promise<UserOverview> {
  // Get total lessons count
  const totalLessons = await prisma.lesson.count({
    where: { isActive: true },
  });

  // Get completed lessons count
  const completedLessons = await prisma.progress.count({
    where: {
      userId,
      lessonId: { not: null },
      completed: true,
    },
  });

  // Get total modules
  const totalModules = await prisma.module.count({
    where: { isActive: true },
  });

  // Get modules with progress
  const modulesWithProgress = await prisma.module.findMany({
    where: {
      isActive: true,
      progress: {
        some: {
          userId,
          lessonId: { not: null },
        },
      },
    },
    select: {
      id: true,
      title: true,
      lessons: {
        where: { isActive: true },
        select: { id: true },
      },
      progress: {
        where: {
          userId,
          lessonId: { not: null },
        },
        select: {
          completed: true,
          lastAccess: true,
        },
      },
    },
  });

  // Calculate modules in progress (0% < progress < 100%)
  let modulesInProgress = 0;
  for (const module of modulesWithProgress) {
    const totalModuleLessons = module.lessons.length;
    const completedModuleLessons = module.progress.filter((p) => p.completed).length;
    const progress = totalModuleLessons > 0
      ? (completedModuleLessons / totalModuleLessons) * 100
      : 0;

    if (progress > 0 && progress < 100) {
      modulesInProgress++;
    }
  }

  // Get last accessed module
  const lastAccessedProgress = await prisma.progress.findFirst({
    where: {
      userId,
      moduleId: { not: null },
    },
    orderBy: {
      lastAccess: 'desc',
    },
    include: {
      module: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  let lastAccessedModule = null;
  if (lastAccessedProgress?.module && lastAccessedProgress.moduleId) {
    const moduleStats = await getModuleProgress(userId, lastAccessedProgress.moduleId);
    lastAccessedModule = {
      moduleId: lastAccessedProgress.moduleId,
      moduleTitle: lastAccessedProgress.module.title,
      progress: moduleStats.progress,
      lastAccess: lastAccessedProgress.lastAccess || lastAccessedProgress.updatedAt,
    };
  }

  const overallProgress = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  return {
    totalLessons,
    completedLessons,
    totalModules,
    modulesInProgress,
    overallProgress,
    lastAccessedModule,
  };
}

/**
 * Internal: Update module progress after lesson progress changes
 */
async function updateModuleProgress(userId: string, moduleId: string): Promise<void> {
  const moduleStats = await getModuleProgress(userId, moduleId);

  // Upsert module progress
  await prisma.progress.upsert({
    where: {
      progress_user_module_unique: {
        userId,
        moduleId,
      },
    },
    create: {
      userId,
      moduleId,
      completed: moduleStats.isCompleted,
      completionPercentage: moduleStats.progress,
      progress: moduleStats.progress,
      timeSpent: moduleStats.timeSpent,
      lastAccess: moduleStats.lastAccessedAt || new Date(),
    },
    update: {
      completed: moduleStats.isCompleted,
      completionPercentage: moduleStats.progress,
      progress: moduleStats.progress,
      timeSpent: moduleStats.timeSpent,
      lastAccess: moduleStats.lastAccessedAt || new Date(),
    },
  });
}
