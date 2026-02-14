/**
 * PROGRESS UPDATE SERVICE (FASE 3 - Migrated)
 * =============================================
 *
 * Uses UserProgress + LessonCompletion (unified system).
 * Legacy: LearningProgress + LessonProgress removed.
 */

import { prisma } from '../../config/prisma';
import { ProgressStatus } from '@prisma/client';
import { ProgressUpdateResult } from '../../types/progress';
import { invalidateUserCache } from './progressQuery.service';
import { calculateAndSaveModuleProgress } from './moduleProgress.service';

export interface LessonProgressUpdate {
  completionPercentage?: number;
  timeSpent?: number;
  completed?: boolean;
}

/**
 * Marcar una lección como completada
 */
export async function completeLesson(
  userId: string,
  lessonId: string
): Promise<ProgressUpdateResult> {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { id: true } } },
    });

    if (!lesson) {
      return { success: false, error: 'Lección no encontrada' };
    }

    const moduleId = lesson.moduleId;

    const result = await prisma.$transaction(async (tx) => {
      const completion = await tx.lessonCompletion.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: {
          isCompleted: true,
          completedAt: new Date(),
          lastAccessed: new Date(),
        },
        create: {
          userId,
          lessonId,
          isCompleted: true,
          completedAt: new Date(),
          lastAccessed: new Date(),
        },
      });

      await tx.userProgress.upsert({
        where: { userId_moduleId: { userId, moduleId } },
        update: {
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
          status: ProgressStatus.IN_PROGRESS,
        },
        create: {
          userId,
          moduleId,
          status: ProgressStatus.IN_PROGRESS,
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
        },
      });

      await checkAndCompleteModule(userId, moduleId, tx);

      return completion;
    }, { maxWait: 5000, timeout: 10000 });

    invalidateUserCache(userId);

    const { checkAndUnlockAchievements } = await import('./achievements.service');
    const achievements = await checkAndUnlockAchievements(userId, {
      type: 'lessons_completed',
      value: 1,
    });

    return {
      success: true,
      progress: {
        id: result.id,
        userId,
        moduleId,
        lessonId,
        completed: result.isCompleted,
        progress: 100,
        completionPercentage: 100,
        updatedAt: result.updatedAt,
      },
      xpGained: 50,
      achievementsUnlocked: achievements,
    };
  } catch (error: any) {
    if (error.code === 'P2034') {
      return { success: false, error: 'Conflicto de concurrencia. Por favor, intenta nuevamente.' };
    }
    console.error('Error al completar lección:', error);
    return { success: false, error: 'Error al marcar la lección como completada' };
  }
}

/**
 * Guardar progreso parcial de una lección
 */
export async function saveLessonProgress(
  userId: string,
  lessonId: string,
  progressPercent: number,
  completionPercentage?: number,
  completedOverride?: boolean
): Promise<ProgressUpdateResult> {
  try {
    if (progressPercent < 0 || progressPercent > 100) {
      return { success: false, error: 'El porcentaje de progreso debe estar entre 0 y 100' };
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { id: true } } },
    });

    if (!lesson) {
      return { success: false, error: 'Lección no encontrada' };
    }

    const isCompleted = completedOverride === true;
    const moduleId = lesson.moduleId;

    const result = await prisma.$transaction(async (tx) => {
      const completion = await tx.lessonCompletion.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: {
          isCompleted,
          completedAt: isCompleted ? new Date() : undefined,
          lastAccessed: new Date(),
        },
        create: {
          userId,
          lessonId,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastAccessed: new Date(),
        },
      });

      if (isCompleted) {
        await checkAndCompleteModule(userId, moduleId, tx);
      }

      return completion;
    }, { maxWait: 5000, timeout: 10000 });

    invalidateUserCache(userId);

    const progressValue = isCompleted ? 100 : progressPercent;
    return {
      success: true,
      progress: {
        id: result.id,
        userId,
        moduleId,
        lessonId,
        completed: result.isCompleted,
        progress: progressValue,
        completionPercentage: typeof completionPercentage === 'number' ? completionPercentage : progressValue,
        updatedAt: result.updatedAt,
      },
    };
  } catch (error: any) {
    if (error.code === 'P2034') {
      return { success: false, error: 'Conflicto de concurrencia. Por favor, intenta nuevamente.' };
    }
    console.error('Error al guardar progreso de lección:', error);
    return { success: false, error: 'Error al guardar el progreso' };
  }
}

/**
 * Actualizar progreso de una lección (nuevo flujo)
 */
export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  data: LessonProgressUpdate
): Promise<ProgressUpdateResult> {
  try {
    const { completionPercentage, timeSpent, completed } = data;

    if (completionPercentage !== undefined && (completionPercentage < 0 || completionPercentage > 100)) {
      return { success: false, error: 'El porcentaje de progreso debe estar entre 0 y 100' };
    }

    if (completionPercentage === undefined && timeSpent === undefined) {
      return { success: false, error: 'Se requiere al menos completionPercentage o timeSpent' };
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, moduleId: true },
    });

    let moduleId: string | null = lesson?.moduleId || null;
    if (!moduleId && lessonId.includes('-')) {
      const parts = lessonId.split('-');
      if (parts.length >= 2) moduleId = `${parts[0]}-${parts[1]}`;
    }

    if (!lesson) {
      console.log(`[updateLessonProgress] Lesson ${lessonId} not in DB, using derived moduleId: ${moduleId}`);
    }

    const isCompleted = completed === true;
    const timeSpentIncrement = typeof timeSpent === 'number' && timeSpent > 0 ? timeSpent : undefined;

    if (!moduleId) {
      return { success: false, error: 'No se pudo determinar el módulo de la lección' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const completion = await tx.lessonCompletion.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: {
          isCompleted,
          completedAt: isCompleted ? new Date() : undefined,
          lastAccessed: new Date(),
          ...(timeSpentIncrement ? { timeSpent: { increment: timeSpentIncrement } } : {}),
        },
        create: {
          userId,
          lessonId,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastAccessed: new Date(),
          timeSpent: timeSpentIncrement ?? 0,
        },
      });

      await tx.userProgress.upsert({
        where: { userId_moduleId: { userId, moduleId: moduleId! } },
        update: {
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
          ...(timeSpentIncrement ? { timeSpent: { increment: timeSpentIncrement } } : {}),
        },
        create: {
          userId,
          moduleId: moduleId!,
          status: ProgressStatus.IN_PROGRESS,
          lastAccessedLessonId: lessonId,
          lastAccessedAt: new Date(),
          timeSpent: timeSpentIncrement ?? 0,
        },
      });

      try {
        await calculateAndSaveModuleProgress(userId, moduleId!);
      } catch (e) {
        console.warn(`[updateLessonProgress] Could not update module progress for ${moduleId}:`, e);
      }

      return completion;
    }, { maxWait: 5000, timeout: 10000 });

    invalidateUserCache(userId);

    const progressValue = completionPercentage ?? (isCompleted ? 100 : 0);
    return {
      success: true,
      progress: {
        id: result.id,
        userId,
        moduleId,
        lessonId,
        completed: result.isCompleted,
        progress: progressValue,
        completionPercentage: completionPercentage ?? progressValue,
        updatedAt: result.updatedAt,
      },
    };
  } catch (error: any) {
    if (error.code === 'P2034') {
      return { success: false, error: 'Conflicto de concurrencia. Por favor, intenta nuevamente.' };
    }
    console.error('Error al actualizar progreso de lección:', error);
    return { success: false, error: 'Error al actualizar progreso de la lección' };
  }
}

/**
 * Registrar intento de quiz (sin cambios - usa QuizAttempt)
 */
export async function recordQuizAttempt(
  userId: string,
  quizId: string,
  score: number,
  passed: boolean,
  answers: any
): Promise<ProgressUpdateResult> {
  try {
    if (score < 0 || score > 100) {
      return { success: false, error: 'El puntaje debe estar entre 0 y 100' };
    }

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) return { success: false, error: 'Quiz no encontrado' };

    await prisma.$transaction(async (tx) => {
      await tx.quizAttempt.create({
        data: { userId, quizId, score, passed, answers, completedAt: new Date() },
      });
    }, { maxWait: 5000, timeout: 10000 });

    invalidateUserCache(userId);

    let xpGained = 0;
    if (passed) {
      xpGained = 100;
      if (score === 100) xpGained += 50;
    }

    const { checkAndUnlockAchievements } = await import('./achievements.service');
    const achievements = await checkAndUnlockAchievements(userId, { type: 'quizzes_passed', value: 1 });

    if (score === 100) {
      const perfect = await checkAndUnlockAchievements(userId, { type: 'perfect_score', value: 1 });
      achievements.push(...perfect);
    }

    return { success: true, xpGained, achievementsUnlocked: achievements };
  } catch (error: any) {
    if (error.code === 'P2034') {
      return { success: false, error: 'Conflicto de concurrencia. Por favor, intenta nuevamente.' };
    }
    console.error('Error al registrar intento de quiz:', error);
    return { success: false, error: 'Error al registrar el intento de quiz' };
  }
}

/**
 * Actualizar XP del usuario (sin cambios)
 */
export async function updateUserXP(
  userId: string,
  xpGained: number
): Promise<{ success: boolean; totalXP: number; levelUp?: { oldLevel: number; newLevel: number } }> {
  try {
    if (xpGained <= 0) return { success: false, totalXP: 0 };

    const { getUserStats } = await import('./progressQuery.service');
    const stats = await getUserStats(userId);
    const oldTotalXP = stats.totalXP;
    const newTotalXP = oldTotalXP + xpGained;

    const { calculateLevel } = await import('./levelCalculation.service');
    const oldLevelInfo = await calculateLevel(oldTotalXP);
    const newLevelInfo = await calculateLevel(newTotalXP);

    let levelUp;
    if (newLevelInfo.level > oldLevelInfo.level) {
      levelUp = { oldLevel: oldLevelInfo.level, newLevel: newLevelInfo.level };
      const { checkAndUnlockAchievements } = await import('./achievements.service');
      await checkAndUnlockAchievements(userId, { type: 'xp_reached', value: newTotalXP });
    }

    invalidateUserCache(userId);
    return { success: true, totalXP: newTotalXP, levelUp };
  } catch (error) {
    console.error('Error al actualizar XP del usuario:', error);
    return { success: false, totalXP: 0 };
  }
}

// ============================================
// INTERNAL
// ============================================

async function checkAndCompleteModule(
  userId: string,
  moduleId: string,
  tx: any
): Promise<void> {
  const activeLessons = await tx.lesson.findMany({
    where: { moduleId, isActive: true },
    select: { id: true },
  });

  if (activeLessons.length === 0) return;

  const lessonIds = activeLessons.map((l: { id: string }) => l.id);
  const completedCount = await tx.lessonCompletion.count({
    where: { userId, lessonId: { in: lessonIds }, isCompleted: true },
  });

  if (completedCount !== lessonIds.length) return;

  await tx.userProgress.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    update: {
      status: ProgressStatus.COMPLETED,
      isModuleCompleted: true,
      completedLessonsCount: completedCount,
      totalLessons: lessonIds.length,
      progressPercentage: 100,
      completedAt: new Date(),
    },
    create: {
      userId,
      moduleId,
      status: ProgressStatus.COMPLETED,
      isModuleCompleted: true,
      completedLessonsCount: completedCount,
      totalLessons: lessonIds.length,
      progressPercentage: 100,
      completedAt: new Date(),
    },
  });

  const { checkAndUnlockAchievements } = await import('./achievements.service');
  await checkAndUnlockAchievements(userId, { type: 'modules_completed', value: 1 });
}

export default {
  completeLesson,
  saveLessonProgress,
  updateLessonProgress,
  recordQuizAttempt,
  updateUserXP,
};
