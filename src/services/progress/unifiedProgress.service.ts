/**
 * UNIFIED PROGRESS SERVICE
 * ========================
 *
 * This is the SINGLE source of truth for all progress operations.
 * It replaces fragmented progress logic with a consolidated, auditable system.
 *
 * KEY PRINCIPLES:
 * 1. Database is the ONLY source of truth
 * 2. Every step navigation triggers a DB write
 * 3. Resume state comes ONLY from this service
 * 4. Frontend MUST NOT guess or infer progress
 *
 * USAGE:
 * - updateStepProgress(): Call on EVERY step navigation
 * - getResumeState(): Call when user clicks "Continue Module"
 * - markLessonComplete(): Call when user finishes a lesson
 */

import { prisma } from '../../config/prisma';
import { invalidateUserCache } from './progressQuery.service';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Input for updating step progress
 * Called on EVERY step navigation in the frontend
 */
export interface UpdateStepProgressInput {
  userId: string;
  moduleId: string;
  lessonId: string;
  currentStepIndex: number;  // 0-based index of current step
  totalSteps: number;        // Total steps in lesson (from content)
  timeSpentDelta?: number;   // Incremental time spent (seconds)
}

/**
 * Result of updating step progress
 */
export interface UpdateStepProgressResult {
  success: boolean;
  lessonId: string;
  currentStepIndex: number;
  totalSteps: number;
  completed: boolean;
  progressPercentage: number;
  error?: string;
}

/**
 * Resume state returned by getResumeState
 * This is the ONLY source of truth for "Continue Module"
 */
export interface ResumeState {
  moduleId: string;
  moduleName: string;
  currentLessonId: string;
  currentLessonTitle: string;
  currentLessonOrder: number;
  currentStepIndex: number;    // Exact step to resume
  totalStepsInLesson: number;
  moduleProgress: number;      // 0-100%
  totalLessons: number;
  completedLessons: number;
  isModuleComplete: boolean;
  lastAccessedAt: Date | null;
}

/**
 * Input for marking a lesson as complete
 */
export interface MarkLessonCompleteInput {
  userId: string;
  moduleId: string;
  lessonId: string;
  totalSteps: number;
  timeSpentDelta?: number;
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * UPDATE STEP PROGRESS
 *
 * Call this on EVERY step navigation in the frontend.
 * This ensures the database always knows the exact position.
 *
 * @param input - Step progress data
 * @returns Result with current state
 */
export async function updateStepProgress(
  input: UpdateStepProgressInput
): Promise<UpdateStepProgressResult> {
  const {
    userId,
    moduleId,
    lessonId,
    currentStepIndex,
    totalSteps,
    timeSpentDelta = 0,
  } = input;

  try {
    // Validate inputs
    if (currentStepIndex < 0) {
      return {
        success: false,
        lessonId,
        currentStepIndex: 0,
        totalSteps,
        completed: false,
        progressPercentage: 0,
        error: 'currentStepIndex cannot be negative',
      };
    }

    if (totalSteps < 1) {
      return {
        success: false,
        lessonId,
        currentStepIndex,
        totalSteps: 1,
        completed: false,
        progressPercentage: 0,
        error: 'totalSteps must be at least 1',
      };
    }

    // Clamp currentStepIndex to valid range
    const clampedStepIndex = Math.min(currentStepIndex, totalSteps - 1);

    // Use transaction for atomic updates
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Upsert LearningProgress (module-level)
      const learningProgress = await tx.learningProgress.upsert({
        where: {
          userId_moduleId: { userId, moduleId },
        },
        update: {
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
          timeSpent: { increment: timeSpentDelta },
          updatedAt: new Date(),
        },
        create: {
          userId,
          moduleId,
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
          timeSpent: timeSpentDelta,
        },
      });

      // Step 2: Upsert LessonProgress (lesson-level with step tracking)
      const lessonProgress = await tx.lessonProgress.upsert({
        where: {
          progressId_lessonId: {
            progressId: learningProgress.id,
            lessonId,
          },
        },
        update: {
          currentStepIndex: clampedStepIndex,
          totalSteps,
          timeSpent: { increment: timeSpentDelta },
          lastAccessed: new Date(),
          updatedAt: new Date(),
        },
        create: {
          progressId: learningProgress.id,
          lessonId,
          currentStepIndex: clampedStepIndex,
          totalSteps,
          completed: false,
          timeSpent: timeSpentDelta,
          lastAccessed: new Date(),
        },
      });

      return { learningProgress, lessonProgress };
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    // Invalidate cache after successful update
    invalidateUserCache(userId);

    // Calculate progress percentage
    const progressPercentage = totalSteps > 0
      ? Math.floor(((clampedStepIndex + 1) / totalSteps) * 100)
      : 0;

    return {
      success: true,
      lessonId,
      currentStepIndex: result.lessonProgress.currentStepIndex,
      totalSteps: result.lessonProgress.totalSteps,
      completed: result.lessonProgress.completed,
      progressPercentage,
    };
  } catch (error: any) {
    console.error('[updateStepProgress] Error:', error);

    // Handle concurrency errors
    if (error.code === 'P2034') {
      return {
        success: false,
        lessonId,
        currentStepIndex,
        totalSteps,
        completed: false,
        progressPercentage: 0,
        error: 'Concurrency conflict. Please retry.',
      };
    }

    return {
      success: false,
      lessonId,
      currentStepIndex,
      totalSteps,
      completed: false,
      progressPercentage: 0,
      error: 'Failed to update progress',
    };
  }
}

/**
 * GET RESUME STATE
 *
 * Call this when user clicks "Continue Module".
 * Returns the EXACT position to resume (lesson + step).
 *
 * ALGORITHM:
 * 1. Find first incomplete lesson (in order)
 * 2. Return that lesson's currentStepIndex
 * 3. If all complete, return last lesson at last step
 *
 * @param userId - User ID
 * @param moduleId - Module ID
 * @returns Resume state with exact position
 */
export async function getResumeState(
  userId: string,
  moduleId: string
): Promise<ResumeState> {
  // Step 1: Get module info with lessons
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      title: true,
      lessons: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
          steps: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  if (module.lessons.length === 0) {
    throw new Error(`Module has no lessons: ${moduleId}`);
  }

  // Step 2: Get user's progress for this module
  const learningProgress = await prisma.learningProgress.findUnique({
    where: {
      userId_moduleId: { userId, moduleId },
    },
    include: {
      lessons: true,
    },
  });

  // Build progress map for quick lookup
  const progressMap = new Map(
    (learningProgress?.lessons ?? []).map((lp) => [lp.lessonId, lp])
  );

  // Step 3: Find first incomplete lesson
  let resumeLesson = module.lessons.find((lesson) => {
    const record = progressMap.get(lesson.id);
    return !record?.completed;
  });

  // Step 4: If all complete, use last lesson
  const isModuleComplete = !resumeLesson;
  if (!resumeLesson) {
    resumeLesson = module.lessons[module.lessons.length - 1];
  }

  // Step 5: Get step position from DB
  const lessonProgress = progressMap.get(resumeLesson.id);

  // Calculate default totalSteps from content if not in DB
  const totalStepsFromContent = resumeLesson.steps.length || 1;
  const currentStepIndex = lessonProgress?.currentStepIndex ?? 0;
  const totalStepsInLesson = lessonProgress?.totalSteps ?? totalStepsFromContent;

  // Step 6: Calculate module stats
  const completedLessons = module.lessons.filter(
    (lesson) => progressMap.get(lesson.id)?.completed
  ).length;

  const moduleProgress = module.lessons.length > 0
    ? Math.floor((completedLessons / module.lessons.length) * 100)
    : 0;

  return {
    moduleId: module.id,
    moduleName: module.title,
    currentLessonId: resumeLesson.id,
    currentLessonTitle: resumeLesson.title,
    currentLessonOrder: resumeLesson.order,
    currentStepIndex,
    totalStepsInLesson,
    moduleProgress,
    totalLessons: module.lessons.length,
    completedLessons,
    isModuleComplete,
    lastAccessedAt: learningProgress?.lastAccessedAt ?? null,
  };
}

/**
 * MARK LESSON COMPLETE
 *
 * Call this when user finishes a lesson (clicks "Complete" on last step).
 * This sets completed=true and advances currentStepIndex to last step.
 *
 * @param input - Lesson completion data
 * @returns Updated progress state
 */
export async function markLessonComplete(
  input: MarkLessonCompleteInput
): Promise<UpdateStepProgressResult> {
  const {
    userId,
    moduleId,
    lessonId,
    totalSteps,
    timeSpentDelta = 0,
  } = input;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Ensure LearningProgress exists
      const learningProgress = await tx.learningProgress.upsert({
        where: {
          userId_moduleId: { userId, moduleId },
        },
        update: {
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
          timeSpent: { increment: timeSpentDelta },
          updatedAt: new Date(),
        },
        create: {
          userId,
          moduleId,
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
          timeSpent: timeSpentDelta,
        },
      });

      // Step 2: Mark lesson as complete with final step position
      const lessonProgress = await tx.lessonProgress.upsert({
        where: {
          progressId_lessonId: {
            progressId: learningProgress.id,
            lessonId,
          },
        },
        update: {
          currentStepIndex: Math.max(0, totalSteps - 1),
          totalSteps,
          completed: true,
          timeSpent: { increment: timeSpentDelta },
          lastAccessed: new Date(),
          updatedAt: new Date(),
        },
        create: {
          progressId: learningProgress.id,
          lessonId,
          currentStepIndex: Math.max(0, totalSteps - 1),
          totalSteps,
          completed: true,
          timeSpent: timeSpentDelta,
          lastAccessed: new Date(),
        },
      });

      // Step 3: Check if module is now complete
      await checkAndCompleteModule(userId, moduleId, tx);

      return { learningProgress, lessonProgress };
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    // Invalidate cache
    invalidateUserCache(userId);

    return {
      success: true,
      lessonId,
      currentStepIndex: result.lessonProgress.currentStepIndex,
      totalSteps: result.lessonProgress.totalSteps,
      completed: true,
      progressPercentage: 100,
    };
  } catch (error: any) {
    console.error('[markLessonComplete] Error:', error);

    if (error.code === 'P2034') {
      return {
        success: false,
        lessonId,
        currentStepIndex: totalSteps - 1,
        totalSteps,
        completed: false,
        progressPercentage: 0,
        error: 'Concurrency conflict. Please retry.',
      };
    }

    return {
      success: false,
      lessonId,
      currentStepIndex: 0,
      totalSteps,
      completed: false,
      progressPercentage: 0,
      error: 'Failed to mark lesson complete',
    };
  }
}

/**
 * Check if all lessons in a module are complete
 * If so, mark the module as complete
 */
async function checkAndCompleteModule(
  userId: string,
  moduleId: string,
  tx: any
): Promise<void> {
  // Get all active lessons in module
  const module = await tx.module.findUnique({
    where: { id: moduleId },
    include: {
      lessons: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  if (!module || module.lessons.length === 0) return;

  const lessonIds = module.lessons.map((l: { id: string }) => l.id);

  // Get learning progress with all lesson progress records
  const learningProgress = await tx.learningProgress.findUnique({
    where: {
      userId_moduleId: { userId, moduleId },
    },
    include: {
      lessons: {
        where: {
          lessonId: { in: lessonIds },
          completed: true,
        },
      },
    },
  });

  if (!learningProgress) return;

  // Check if all lessons are complete
  const completedCount = learningProgress.lessons.length;
  if (completedCount !== lessonIds.length) return;

  // All lessons complete - mark module complete
  await tx.learningProgress.update({
    where: { id: learningProgress.id },
    data: {
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * GET LESSON PROGRESS DETAILS
 *
 * Get detailed progress for a specific lesson.
 * Use this for displaying lesson-level progress in UI.
 */
export async function getLessonProgressDetails(
  userId: string,
  moduleId: string,
  lessonId: string
): Promise<{
  lessonId: string;
  currentStepIndex: number;
  totalSteps: number;
  completed: boolean;
  timeSpent: number;
  lastAccessed: Date | null;
  progressPercentage: number;
} | null> {
  // Get or create learning progress
  const learningProgress = await prisma.learningProgress.findUnique({
    where: {
      userId_moduleId: { userId, moduleId },
    },
  });

  if (!learningProgress) {
    // No progress yet - return initial state
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        steps: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    return {
      lessonId,
      currentStepIndex: 0,
      totalSteps: lesson?.steps.length ?? 1,
      completed: false,
      timeSpent: 0,
      lastAccessed: null,
      progressPercentage: 0,
    };
  }

  // Get lesson progress
  const lessonProgress = await prisma.lessonProgress.findUnique({
    where: {
      progressId_lessonId: {
        progressId: learningProgress.id,
        lessonId,
      },
    },
  });

  if (!lessonProgress) {
    // Lesson not started - return initial state
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        steps: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    return {
      lessonId,
      currentStepIndex: 0,
      totalSteps: lesson?.steps.length ?? 1,
      completed: false,
      timeSpent: 0,
      lastAccessed: null,
      progressPercentage: 0,
    };
  }

  const progressPercentage = lessonProgress.totalSteps > 0
    ? Math.floor(((lessonProgress.currentStepIndex + 1) / lessonProgress.totalSteps) * 100)
    : 0;

  return {
    lessonId: lessonProgress.lessonId,
    currentStepIndex: lessonProgress.currentStepIndex,
    totalSteps: lessonProgress.totalSteps,
    completed: lessonProgress.completed,
    timeSpent: lessonProgress.timeSpent,
    lastAccessed: lessonProgress.lastAccessed,
    progressPercentage: lessonProgress.completed ? 100 : progressPercentage,
  };
}

// Export default object for convenient imports
export default {
  updateStepProgress,
  getResumeState,
  markLessonComplete,
  getLessonProgressDetails,
};
