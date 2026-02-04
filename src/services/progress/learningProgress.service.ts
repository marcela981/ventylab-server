/**
 * NEW PROGRESS SYSTEM - Learning Progress Service
 * 
 * This is the UNIFIED progress tracking system.
 * ALL progress operations should use this service.
 * 
 * Architecture:
 * - LearningProgress: Module-level progress (parent)
 * - LessonProgress: Lesson-level progress (child)
 * 
 * DO NOT use the old Progress model.
 */

import { prisma } from '../../config/prisma';

interface UpdateLessonProgressInput {
  userId: string;
  moduleId: string;
  lessonId: string;
  completed?: boolean;
  timeSpent?: number;
}

interface LessonProgressResponse {
  lessonId: string;
  completed: boolean;
  timeSpent: number;
  lastAccessed: Date | null;
}

interface ModuleProgressResponse {
  moduleId: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  timeSpent: number;
  score: number | null;
  lessons: LessonProgressResponse[];
  completedAt: Date | null;
}

/**
 * Get or create learning progress for a user + module
 */
async function ensureLearningProgress(userId: string, moduleId: string) {
  return prisma.learningProgress.upsert({
    where: {
      userId_moduleId: {
        userId,
        moduleId,
      },
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      userId,
      moduleId,
      timeSpent: 0,
    },
    include: {
      lessons: true,
    },
  });
}

/**
 * Update or create progress for a specific lesson
 */
export async function updateLessonProgress(
  input: UpdateLessonProgressInput
): Promise<LessonProgressResponse> {
  const { userId, moduleId, lessonId, completed = false, timeSpent = 0 } = input;

  // Step 1: Ensure parent learning progress exists
  const learningProgress = await ensureLearningProgress(userId, moduleId);

  // Step 2: Update or create lesson progress
  const lessonProgress = await prisma.lessonProgress.upsert({
    where: {
      progressId_lessonId: {
        progressId: learningProgress.id,
        lessonId,
      },
    },
    update: {
      completed,
      timeSpent: {
        increment: timeSpent,
      },
      lastAccessed: new Date(),
    },
    create: {
      progressId: learningProgress.id,
      lessonId,
      completed,
      timeSpent,
      lastAccessed: new Date(),
    },
  });

  // Step 3: Update parent learning progress with aggregated time
  await prisma.learningProgress.update({
    where: { id: learningProgress.id },
    data: {
      timeSpent: {
        increment: timeSpent,
      },
    },
  });

  // Step 4: Check if module is complete
  const allLessons = await prisma.lessonProgress.findMany({
    where: {
      progressId: learningProgress.id,
    },
  });

  const moduleComplete = allLessons.length > 0 && allLessons.every(l => l.completed);

  if (moduleComplete && !learningProgress.completedAt) {
    await prisma.learningProgress.update({
      where: { id: learningProgress.id },
      data: {
        completedAt: new Date(),
      },
    });
  }

  return {
    lessonId: lessonProgress.lessonId,
    completed: lessonProgress.completed,
    timeSpent: lessonProgress.timeSpent,
    lastAccessed: lessonProgress.lastAccessed,
  };
}

/**
 * Mark a lesson as completed
 */
export async function markLessonComplete(
  userId: string,
  moduleId: string,
  lessonId: string,
  timeSpent: number = 0
): Promise<LessonProgressResponse> {
  return updateLessonProgress({
    userId,
    moduleId,
    lessonId,
    completed: true,
    timeSpent,
  });
}

/**
 * Get progress for a specific lesson
 */
export async function getLessonProgress(
  userId: string,
  moduleId: string,
  lessonId: string
): Promise<LessonProgressResponse | null> {
  // Ensure learning progress exists
  const learningProgress = await ensureLearningProgress(userId, moduleId);

  // Find lesson progress
  const lessonProgress = await prisma.lessonProgress.findUnique({
    where: {
      progressId_lessonId: {
        progressId: learningProgress.id,
        lessonId,
      },
    },
  });

  if (!lessonProgress) {
    // Return initial state if no progress exists yet
    return {
      lessonId,
      completed: false,
      timeSpent: 0,
      lastAccessed: null,
    };
  }

  return {
    lessonId: lessonProgress.lessonId,
    completed: lessonProgress.completed,
    timeSpent: lessonProgress.timeSpent,
    lastAccessed: lessonProgress.lastAccessed,
  };
}

/**
 * Get complete module progress with all lessons
 */
export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgressResponse> {
  // Ensure learning progress exists
  const learningProgress = await ensureLearningProgress(userId, moduleId);

  // Get all lessons in this module
  const allModuleLessons = await prisma.lesson.findMany({
    where: {
      moduleId,
      isActive: true,
    },
    orderBy: { order: 'asc' },
    select: { id: true },
  });

  // Get all lesson progress records
  const lessonProgressRecords = await prisma.lessonProgress.findMany({
    where: {
      progressId: learningProgress.id,
    },
  });

  // Build lesson progress map
  const progressMap = new Map(
    lessonProgressRecords.map(lp => [lp.lessonId, lp])
  );

  // Build complete lesson list with progress
  const lessons: LessonProgressResponse[] = allModuleLessons.map(lesson => {
    const progress = progressMap.get(lesson.id);
    return {
      lessonId: lesson.id,
      completed: progress?.completed ?? false,
      timeSpent: progress?.timeSpent ?? 0,
      lastAccessed: progress?.lastAccessed ?? null,
    };
  });

  const completedLessons = lessons.filter(l => l.completed).length;
  const totalLessons = lessons.length;
  const completionPercentage = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  return {
    moduleId,
    totalLessons,
    completedLessons,
    completionPercentage,
    timeSpent: learningProgress.timeSpent,
    score: learningProgress.score,
    lessons,
    completedAt: learningProgress.completedAt,
  };
}

/**
 * Get overview of all modules for a user
 */
export async function getUserProgressOverview(userId: string) {
  const allProgress = await prisma.learningProgress.findMany({
    where: { userId },
    include: {
      lessons: true,
      module: {
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
    },
    orderBy: {
      module: {
        order: 'asc',
      },
    },
  });

  return allProgress.map(progress => ({
    moduleId: progress.moduleId,
    moduleTitle: progress.module.title,
    completedLessons: progress.lessons.filter(l => l.completed).length,
    totalLessons: progress.lessons.length,
    timeSpent: progress.timeSpent,
    completedAt: progress.completedAt,
    lastAccessed: progress.lessons.reduce((latest, lesson) => {
      if (!lesson.lastAccessed) return latest;
      if (!latest || lesson.lastAccessed > latest) return lesson.lastAccessed;
      return latest;
    }, null as Date | null),
  }));
}

/**
 * Get next lesson in sequence within a module
 */
export async function getNextLesson(
  userId: string,
  moduleId: string,
  currentLessonId: string
): Promise<string | null> {
  // Get all lessons in order
  const allLessons = await prisma.lesson.findMany({
    where: {
      moduleId,
      isActive: true,
    },
    orderBy: { order: 'asc' },
    select: { id: true },
  });

  // Find current lesson index
  const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
  
  if (currentIndex === -1 || currentIndex === allLessons.length - 1) {
    // Current lesson not found or is the last lesson
    return null;
  }

  // Return next lesson
  return allLessons[currentIndex + 1].id;
}
