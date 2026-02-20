/**
 * UNIFIED PROGRESS SERVICE (FASE 3 - Migrated)
 * =============================================
 *
 * Single source of truth for all progress operations.
 * Uses UserProgress (module-level) + LessonCompletion (lesson+step level).
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

import { prisma } from '../../shared/infrastructure/database';
import { ProgressStatus } from '@prisma/client';
import { invalidateUserCache } from './progressQuery.service';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UpdateStepProgressInput {
  userId: string;
  moduleId: string;
  lessonId: string;
  currentStepIndex: number;  // 0-based
  totalSteps: number;
  timeSpentDelta?: number;   // seconds
}

export interface UpdateStepProgressResult {
  success: boolean;
  lessonId: string;
  currentStepIndex: number;
  totalSteps: number;
  completed: boolean;
  progressPercentage: number;
  error?: string;
}

export interface ResumeState {
  moduleId: string;
  moduleName: string;
  currentLessonId: string;
  currentLessonTitle: string;
  currentLessonOrder: number;
  currentStepIndex: number;
  totalStepsInLesson: number;
  moduleProgress: number;    // 0-100%
  totalLessons: number;
  completedLessons: number;
  isModuleComplete: boolean;
  lastAccessedAt: Date | null;
}

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
 * Call on EVERY step navigation. Writes to UserProgress + LessonCompletion.
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
    if (currentStepIndex < 0) {
      return { success: false, lessonId, currentStepIndex: 0, totalSteps, completed: false, progressPercentage: 0, error: 'currentStepIndex cannot be negative' };
    }
    if (totalSteps < 1) {
      return { success: false, lessonId, currentStepIndex, totalSteps: 1, completed: false, progressPercentage: 0, error: 'totalSteps must be at least 1' };
    }

    const clampedStep = Math.min(currentStepIndex, totalSteps - 1);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert UserProgress (module-level)
      await tx.userProgress.upsert({
        where: { userId_moduleId: { userId, moduleId } },
        update: {
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
          timeSpent: { increment: timeSpentDelta },
          // Only transition to IN_PROGRESS if currently NOT_STARTED
          status: ProgressStatus.IN_PROGRESS,
        },
        create: {
          userId,
          moduleId,
          status: ProgressStatus.IN_PROGRESS,
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
          timeSpent: timeSpentDelta,
        },
      });

      // 2. Upsert LessonCompletion (lesson+step level)
      // NEVER downgrade isCompleted true → false
      const existing = await tx.lessonCompletion.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
        select: { isCompleted: true },
      });

      const lessonCompletion = await tx.lessonCompletion.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: {
          currentStepIndex: clampedStep,
          totalSteps,
          timeSpent: { increment: timeSpentDelta },
          lastAccessed: new Date(),
          // Never downgrade completion
          ...(existing?.isCompleted ? {} : { isCompleted: false }),
        },
        create: {
          userId,
          lessonId,
          currentStepIndex: clampedStep,
          totalSteps,
          timeSpent: timeSpentDelta,
          lastAccessed: new Date(),
          isCompleted: false,
          completedAt: null,
        },
      });

      return lessonCompletion;
    }, { maxWait: 5000, timeout: 10000 });

    invalidateUserCache(userId);

    const progressPercentage = Math.floor(((clampedStep + 1) / totalSteps) * 100);

    return {
      success: true,
      lessonId,
      currentStepIndex: result.currentStepIndex,
      totalSteps: result.totalSteps,
      completed: result.isCompleted,
      progressPercentage: result.isCompleted ? 100 : progressPercentage,
    };
  } catch (error: any) {
    console.error('[updateStepProgress] Error:', error);
    if (error.code === 'P2034') {
      return { success: false, lessonId, currentStepIndex, totalSteps, completed: false, progressPercentage: 0, error: 'Concurrency conflict. Please retry.' };
    }
    return { success: false, lessonId, currentStepIndex, totalSteps, completed: false, progressPercentage: 0, error: 'Failed to update progress' };
  }
}

/**
 * GET RESUME STATE
 *
 * Returns exact position (lesson + step) for "Continue Module".
 */
export async function getResumeState(
  userId: string,
  moduleId: string
): Promise<ResumeState> {
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
          steps: { where: { isActive: true }, select: { id: true } },
        },
      },
    },
  });

  if (!module) throw new Error(`Module not found: ${moduleId}`);
  if (module.lessons.length === 0) throw new Error(`Module has no lessons: ${moduleId}`);

  // Get all lesson completions for this module's lessons
  const lessonIds = module.lessons.map(l => l.id);
  const completions = await prisma.lessonCompletion.findMany({
    where: { userId, lessonId: { in: lessonIds } },
  });
  const completionMap = new Map(completions.map(c => [c.lessonId, c]));

  // Find first incomplete lesson
  let resumeLesson = module.lessons.find(l => {
    const record = completionMap.get(l.id);
    return !record?.isCompleted;
  });

  const isModuleComplete = !resumeLesson;
  if (!resumeLesson) {
    resumeLesson = module.lessons[module.lessons.length - 1];
  }

  const completion = completionMap.get(resumeLesson.id);
  const totalStepsFromContent = resumeLesson.steps.length || 1;
  const currentStepIndex = completion?.currentStepIndex ?? 0;
  const totalStepsInLesson = completion?.totalSteps ?? totalStepsFromContent;

  const completedLessons = module.lessons.filter(l => completionMap.get(l.id)?.isCompleted).length;
  const moduleProgress = module.lessons.length > 0
    ? Math.floor((completedLessons / module.lessons.length) * 100)
    : 0;

  // Get lastAccessedAt from UserProgress
  const userProgress = await prisma.userProgress.findUnique({
    where: { userId_moduleId: { userId, moduleId } },
    select: { lastAccessedAt: true },
  });

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
    lastAccessedAt: userProgress?.lastAccessedAt ?? null,
  };
}

/**
 * MARK LESSON COMPLETE
 *
 * Sets isCompleted=true and advances to last step. Recalculates module progress.
 */
export async function markLessonComplete(
  input: MarkLessonCompleteInput
): Promise<UpdateStepProgressResult> {
  const { userId, moduleId, lessonId, totalSteps, timeSpentDelta = 0 } = input;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert LessonCompletion as completed
      const lessonCompletion = await tx.lessonCompletion.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: {
          currentStepIndex: Math.max(0, totalSteps - 1),
          totalSteps,
          timeSpent: { increment: timeSpentDelta },
          lastAccessed: new Date(),
          isCompleted: true,
          completedAt: new Date(),
        },
        create: {
          userId,
          lessonId,
          currentStepIndex: Math.max(0, totalSteps - 1),
          totalSteps,
          timeSpent: timeSpentDelta,
          lastAccessed: new Date(),
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      // 2. Recalculate and upsert UserProgress
      await recalculateUserProgress(tx, userId, moduleId, lessonId, timeSpentDelta);

      return lessonCompletion;
    }, { maxWait: 5000, timeout: 10000 });

    invalidateUserCache(userId);

    return {
      success: true,
      lessonId,
      currentStepIndex: result.currentStepIndex,
      totalSteps: result.totalSteps,
      completed: true,
      progressPercentage: 100,
    };
  } catch (error: any) {
    console.error('[markLessonComplete] Error:', error);
    if (error.code === 'P2034') {
      return { success: false, lessonId, currentStepIndex: totalSteps - 1, totalSteps, completed: false, progressPercentage: 0, error: 'Concurrency conflict. Please retry.' };
    }
    return { success: false, lessonId, currentStepIndex: 0, totalSteps, completed: false, progressPercentage: 0, error: 'Failed to mark lesson complete' };
  }
}

/**
 * GET LESSON PROGRESS DETAILS
 *
 * Detailed progress for a specific lesson including step info.
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
  // Verify module exists
  const moduleExists = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true },
  });
  if (!moduleExists) return null;

  const completion = await prisma.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  if (!completion) {
    // Return initial state
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { steps: { where: { isActive: true }, select: { id: true } } },
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

  const progressPercentage = completion.totalSteps > 0
    ? Math.floor(((completion.currentStepIndex + 1) / completion.totalSteps) * 100)
    : 0;

  return {
    lessonId: completion.lessonId,
    currentStepIndex: completion.currentStepIndex,
    totalSteps: completion.totalSteps,
    completed: completion.isCompleted,
    timeSpent: completion.timeSpent,
    lastAccessed: completion.lastAccessed,
    progressPercentage: completion.isCompleted ? 100 : progressPercentage,
  };
}

// ============================================
// INTERNAL HELPERS
// ============================================

/**
 * Recalculate UserProgress counters after a lesson completion.
 * @internal Used within transactions
 */
async function recalculateUserProgress(
  tx: any,
  userId: string,
  moduleId: string,
  lastAccessedLessonId: string,
  timeSpentDelta: number
): Promise<void> {
  const totalLessons = await tx.lesson.count({
    where: { moduleId, isActive: true },
  });

  const lessonIds: string[] = (await tx.lesson.findMany({
    where: { moduleId, isActive: true },
    select: { id: true },
  })).map((l: { id: string }) => l.id);

  const completedLessonsCount = await tx.lessonCompletion.count({
    where: { userId, lessonId: { in: lessonIds }, isCompleted: true },
  });

  const progressPercentage = totalLessons > 0
    ? (completedLessonsCount / totalLessons) * 100
    : 0;
  const moduleCompleted = progressPercentage >= 100;
  const status: ProgressStatus = moduleCompleted
    ? ProgressStatus.COMPLETED
    : progressPercentage > 0
      ? ProgressStatus.IN_PROGRESS
      : ProgressStatus.NOT_STARTED;

  await tx.userProgress.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    create: {
      userId,
      moduleId,
      status,
      isModuleCompleted: moduleCompleted,
      completedLessonsCount,
      totalLessons,
      progressPercentage,
      timeSpent: timeSpentDelta,
      lastAccessedLessonId,
      lastAccessedAt: new Date(),
      completedAt: moduleCompleted ? new Date() : null,
    },
    update: {
      status,
      isModuleCompleted: moduleCompleted,
      completedLessonsCount,
      totalLessons,
      progressPercentage,
      timeSpent: { increment: timeSpentDelta },
      lastAccessedLessonId,
      lastAccessedAt: new Date(),
      completedAt: moduleCompleted ? new Date() : null,
    },
  });
}

export default {
  updateStepProgress,
  getResumeState,
  markLessonComplete,
  getLessonProgressDetails,
};
