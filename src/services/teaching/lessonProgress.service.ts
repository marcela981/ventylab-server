/**
 * LESSON PROGRESS SERVICE
 * =======================
 *
 * Handles lesson completion and module progress tracking
 * using the UserProgress + LessonCompletion tables.
 *
 * KEY RESPONSIBILITIES:
 * 1. Mark lessons as completed (with quiz/case validation)
 * 2. Recalculate module progress (denormalized counters)
 * 3. Enforce sequential lesson access within modules
 *
 * TRANSACTION SAFETY:
 * - All writes use prisma.$transaction for atomicity
 * - Timeout: 10s
 * - MaxWait: 5s (queue wait before timeout)
 *
 * All reads filter by isActive to exclude deactivated content.
 */

import { prisma } from '../../config/prisma';
import { ProgressStatus } from '@prisma/client';
import { canAccessModule } from './moduleUnlock.service';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CompleteLessonResult {
  completedLessonsCount: number;
  totalLessons: number;
  progressPercentage: number;
  moduleCompleted: boolean;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Mark a lesson as completed.
 *
 * Validates:
 * 1. Lesson exists and is active (+ its module)
 * 2. User can access the lesson (module unlock + sequential)
 * 3. Quiz/case requirements are met (if lesson.hasRequiredQuiz/hasRequiredCase)
 *
 * Then atomically:
 * 1. Upserts LessonCompletion (with best-score tracking)
 * 2. Recalculates UserProgress for the parent module
 *
 * @param userId - The user completing the lesson
 * @param lessonId - The lesson being completed
 * @param quizScore - Quiz score (0-100), required if lesson.hasRequiredQuiz
 * @param caseScore - Case score (0-100), required if lesson.hasRequiredCase
 * @returns Updated module progress stats
 */
export async function completeLesson(
  userId: string,
  lessonId: string,
  quizScore?: number,
  caseScore?: number
): Promise<CompleteLessonResult> {
  // 1. Validate lesson exists and is active
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, isActive: true },
    include: {
      module: { select: { id: true, isActive: true } },
    },
  });

  if (!lesson) {
    throw new Error('Lesson not found or inactive');
  }
  if (!lesson.module.isActive) {
    throw new Error('Module is inactive');
  }

  // 2. Validate access (module unlock + sequential within module)
  const hasAccess = await canAccessLesson(userId, lessonId);
  if (!hasAccess) {
    throw new Error('Cannot access this lesson yet');
  }

  // 3. Validate quiz/case requirements
  if (lesson.hasRequiredQuiz && quizScore === undefined) {
    throw new Error('Quiz score is required for this lesson');
  }
  if (lesson.hasRequiredCase && caseScore === undefined) {
    throw new Error('Case score is required for this lesson');
  }

  // 4. Fetch existing completion for best-score comparison
  //    (must happen BEFORE the transaction to avoid referencing undefined)
  const existing = await prisma.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  // 5. Atomic transaction: upsert completion + recalculate module progress
  const result = await prisma.$transaction(async (tx) => {
    // 5a. Upsert LessonCompletion
    await tx.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        quizAttempts: quizScore !== undefined ? 1 : 0,
        bestQuizScore: quizScore ?? null,
        lastQuizScore: quizScore ?? null,
        caseAttempts: caseScore !== undefined ? 1 : 0,
        bestCaseScore: caseScore ?? null,
        lastCaseScore: caseScore ?? null,
      },
      update: {
        // Spread conditionally: only update quiz fields if a new score is provided
        ...(quizScore !== undefined && {
          quizAttempts: { increment: 1 },
          bestQuizScore: Math.max(quizScore, existing?.bestQuizScore ?? 0),
          lastQuizScore: quizScore,
        }),
        // Same for case study fields
        ...(caseScore !== undefined && {
          caseAttempts: { increment: 1 },
          bestCaseScore: Math.max(caseScore, existing?.bestCaseScore ?? 0),
          lastCaseScore: caseScore,
        }),
      },
    });

    // 5b. Recalculate and upsert UserProgress
    return await recalculateModuleProgress(
      tx,
      userId,
      lesson.moduleId,
      lessonId
    );
  }, {
    maxWait: 5000,
    timeout: 10000,
  });

  return result;
}

/**
 * Check if a user can access a specific lesson.
 *
 * Rules (in order):
 * 1. Lesson and its module must exist and be active
 * 2. Module must be unlocked (via canAccessModule)
 * 3. If module is COMPLETED, all lessons are freely accessible (revisit mode)
 * 4. First lesson (lowest order among active) is always accessible
 * 5. Other lessons require the immediately previous active lesson to be completed
 *
 * @param userId - The user to check
 * @param lessonId - The lesson to check access for
 * @returns true if the user can access the lesson
 */
export async function canAccessLesson(
  userId: string,
  lessonId: string
): Promise<boolean> {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, isActive: true },
    include: {
      module: { select: { id: true, isActive: true } },
    },
  });

  if (!lesson) return false;
  if (!lesson.module.isActive) return false;

  // 1. Module must be unlocked
  const moduleAccessible = await canAccessModule(userId, lesson.moduleId);
  if (!moduleAccessible) return false;

  // 2. If module is completed, allow free access (revisit)
  const moduleProgress = await prisma.userProgress.findUnique({
    where: { userId_moduleId: { userId, moduleId: lesson.moduleId } },
  });

  if (moduleProgress?.status === ProgressStatus.COMPLETED) return true;

  // 3. First active lesson in the module is always accessible
  const firstLesson = await prisma.lesson.findFirst({
    where: { moduleId: lesson.moduleId, isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true },
  });

  if (firstLesson?.id === lessonId) return true;

  // 4. Previous active lesson (by order) must be completed
  const previousLesson = await prisma.lesson.findFirst({
    where: {
      moduleId: lesson.moduleId,
      isActive: true,
      order: { lt: lesson.order },
    },
    orderBy: { order: 'desc' },
    select: { id: true },
  });

  // No previous active lesson means this is effectively the first
  if (!previousLesson) return true;

  const previousCompletion = await prisma.lessonCompletion.findUnique({
    where: { userId_lessonId: { userId, lessonId: previousLesson.id } },
    select: { id: true },
  });

  return !!previousCompletion;
}

// ============================================
// INTERNAL HELPERS
// ============================================

/**
 * Recalculate module progress after a lesson completion.
 *
 * Updates denormalized counters in UserProgress:
 * - completedLessonsCount
 * - totalLessons
 * - progressPercentage
 * - status (NOT_STARTED | IN_PROGRESS | COMPLETED)
 * - completedAt (set when 100%, cleared otherwise)
 * - lastAccessedLessonId
 *
 * @internal Called within a transaction from completeLesson
 */
async function recalculateModuleProgress(
  tx: any,
  userId: string,
  moduleId: string,
  lastAccessedLessonId: string
): Promise<CompleteLessonResult> {
  // Count active lessons in module
  const totalLessons = await tx.lesson.count({
    where: { moduleId, isActive: true },
  });

  // Count completed lessons for this user in this module
  const completedLessonsCount = await tx.lessonCompletion.count({
    where: {
      userId,
      lesson: { moduleId, isActive: true },
    },
  });

  // Safe percentage calculation (prevents division by zero)
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
      lastAccessedLessonId,
      completedAt: moduleCompleted ? new Date() : null,
    },
    update: {
      status,
      isModuleCompleted: moduleCompleted,
      completedLessonsCount,
      totalLessons,
      progressPercentage,
      lastAccessedLessonId,
      lastAccessedAt: new Date(),
      completedAt: moduleCompleted ? new Date() : null,
    },
  });

  return {
    completedLessonsCount,
    totalLessons,
    progressPercentage,
    moduleCompleted,
  };
}
