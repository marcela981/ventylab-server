import { prisma } from '../../config/prisma';
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
    // Validar que la lección existe
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: { id: true },
        },
      },
    });

    if (!lesson) {
      return {
        success: false,
        error: 'Lección no encontrada',
      };
    }

    // Usar transacción: LearningProgress + LessonProgress
    const result = await prisma.$transaction(async (tx) => {
      const learningProgress = await tx.learningProgress.upsert({
        where: {
          userId_moduleId: { userId, moduleId: lesson.moduleId },
        },
        update: { updatedAt: new Date() },
        create: {
          userId,
          moduleId: lesson.moduleId,
          timeSpent: 0,
        },
      });

      const lessonProgress = await tx.lessonProgress.upsert({
        where: {
          progressId_lessonId: {
            progressId: learningProgress.id,
            lessonId,
          },
        },
        update: {
          completed: true,
          lastAccessed: new Date(),
        },
        create: {
          progressId: learningProgress.id,
          lessonId,
          completed: true,
          timeSpent: 0,
          lastAccessed: new Date(),
        },
      });

      await checkAndCompleteModule(userId, lesson.moduleId, tx);

      return { learningProgress, lessonProgress };
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    invalidateUserCache(userId);

    const xpGained = 50;

    const { checkAndUnlockAchievements } = await import('./achievements.service');
    const achievements = await checkAndUnlockAchievements(userId, {
      type: 'lessons_completed',
      value: 1,
    });

    return {
      success: true,
      progress: {
        id: result.lessonProgress.id,
        userId,
        moduleId: lesson.moduleId,
        lessonId,
        completed: result.lessonProgress.completed,
        progress: 100,
        completionPercentage: 100,
        updatedAt: result.lessonProgress.updatedAt,
      },
      xpGained,
      achievementsUnlocked: achievements,
    };
  } catch (error: any) {
    // Manejar errores de concurrencia
    if (error.code === 'P2034') {
      return {
        success: false,
        error: 'Conflicto de concurrencia. Por favor, intenta nuevamente.',
      };
    }

    console.error('Error al completar lección:', error);
    return {
      success: false,
      error: 'Error al marcar la lección como completada',
    };
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
    // Validar porcentaje de progreso
    if (progressPercent < 0 || progressPercent > 100) {
      return {
        success: false,
        error: 'El porcentaje de progreso debe estar entre 0 y 100',
      };
    }

    // Validar que la lección existe
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: { id: true },
        },
      },
    });

    if (!lesson) {
      return {
        success: false,
        error: 'Lección no encontrada',
      };
    }

    const isCompleted = completedOverride === true;

    const result = await prisma.$transaction(async (tx) => {
      const learningProgress = await tx.learningProgress.upsert({
        where: {
          userId_moduleId: { userId, moduleId: lesson.moduleId },
        },
        update: { updatedAt: new Date() },
        create: {
          userId,
          moduleId: lesson.moduleId,
          timeSpent: 0,
        },
      });

      const lessonProgress = await tx.lessonProgress.upsert({
        where: {
          progressId_lessonId: {
            progressId: learningProgress.id,
            lessonId,
          },
        },
        update: {
          completed: isCompleted,
          lastAccessed: new Date(),
        },
        create: {
          progressId: learningProgress.id,
          lessonId,
          completed: isCompleted,
          timeSpent: 0,
          lastAccessed: new Date(),
        },
      });

      if (isCompleted) {
        await checkAndCompleteModule(userId, lesson.moduleId, tx);
      }

      return lessonProgress;
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    invalidateUserCache(userId);

    const progressValue = isCompleted ? 100 : progressPercent;

    return {
      success: true,
      progress: {
        id: result.id,
        userId,
        moduleId: lesson.moduleId,
        lessonId,
        completed: result.completed,
        progress: progressValue,
        completionPercentage: typeof completionPercentage === 'number' ? completionPercentage : progressValue,
        updatedAt: result.updatedAt,
      },
    };
  } catch (error: any) {
    if (error.code === 'P2034') {
      return {
        success: false,
        error: 'Conflicto de concurrencia. Por favor, intenta nuevamente.',
      };
    }

    console.error('Error al guardar progreso de lección:', error);
    return {
      success: false,
      error: 'Error al guardar el progreso',
    };
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

    // Validate completionPercentage only if provided
    if (completionPercentage !== undefined && (completionPercentage < 0 || completionPercentage > 100)) {
      return {
        success: false,
        error: 'El porcentaje de progreso debe estar entre 0 y 100',
      };
    }

    // Ensure we have at least completionPercentage or timeSpent
    if (completionPercentage === undefined && timeSpent === undefined) {
      return {
        success: false,
        error: 'Se requiere al menos completionPercentage o timeSpent',
      };
    }

    // Try to get lesson from DB, but extract moduleId from lessonId if not found
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, moduleId: true },
    });

    // Extract moduleId from lessonId format: "module-01-lesson-01"
    let moduleId: string | null = lesson?.moduleId || null;
    if (!moduleId && lessonId.includes('-')) {
      const parts = lessonId.split('-');
      if (parts.length >= 2) {
        moduleId = `${parts[0]}-${parts[1]}`;
      }
    }

    // Log if lesson not in DB (normal for JSON-based lessons)
    if (!lesson) {
      console.log(`[updateLessonProgress] Lesson ${lessonId} not in DB, using derived moduleId: ${moduleId}`);
    }

    // IMPORTANT: Only mark as completed when explicitly requested
    // Never auto-complete based on progress percentage
    const isCompleted = completed === true;

    const timeSpentIncrement = typeof timeSpent === 'number' && timeSpent > 0
      ? timeSpent
      : undefined;

    if (!moduleId) {
      return {
        success: false,
        error: 'No se pudo determinar el módulo de la lección',
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const learningProgress = await tx.learningProgress.upsert({
        where: {
          userId_moduleId: { userId, moduleId },
        },
        update: {
          ...(timeSpentIncrement !== undefined && timeSpentIncrement > 0
            ? { timeSpent: { increment: timeSpentIncrement } }
            : {}),
          updatedAt: new Date(),
        },
        create: {
          userId,
          moduleId,
          timeSpent: timeSpentIncrement ?? 0,
        },
      });

      const lessonProgress = await tx.lessonProgress.upsert({
        where: {
          progressId_lessonId: {
            progressId: learningProgress.id,
            lessonId,
          },
        },
        update: {
          completed: isCompleted,
          ...(timeSpentIncrement !== undefined && timeSpentIncrement > 0
            ? { timeSpent: { increment: timeSpentIncrement } }
            : {}),
          lastAccessed: new Date(),
        },
        create: {
          progressId: learningProgress.id,
          lessonId,
          completed: isCompleted,
          timeSpent: timeSpentIncrement ?? 0,
          lastAccessed: new Date(),
        },
      });

      if (timeSpentIncrement !== undefined && timeSpentIncrement > 0) {
        await tx.learningProgress.update({
          where: { id: learningProgress.id },
          data: { timeSpent: { increment: timeSpentIncrement } },
        });
      }

      try {
        await calculateAndSaveModuleProgress(userId, moduleId);
      } catch (error) {
        console.warn(`[updateLessonProgress] Could not update module progress for ${moduleId}:`, error);
      }

      return lessonProgress;
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    invalidateUserCache(userId);

    const progressValue = completionPercentage ?? (isCompleted ? 100 : 0);

    return {
      success: true,
      progress: {
        id: result.id,
        userId,
        moduleId,
        lessonId,
        completed: result.completed,
        progress: progressValue,
        completionPercentage: completionPercentage ?? progressValue,
        updatedAt: result.updatedAt,
      },
    };
  } catch (error: any) {
    if (error.code === 'P2034') {
      return {
        success: false,
        error: 'Conflicto de concurrencia. Por favor, intenta nuevamente.',
      };
    }

    console.error('Error al actualizar progreso de lección:', error);
    return {
      success: false,
      error: 'Error al actualizar progreso de la lección',
    };
  }
}

/**
 * Registrar intento de quiz
 */
export async function recordQuizAttempt(
  userId: string,
  quizId: string,
  score: number,
  passed: boolean,
  answers: any
): Promise<ProgressUpdateResult> {
  try {
    // Validar datos
    if (score < 0 || score > 100) {
      return {
        success: false,
        error: 'El puntaje debe estar entre 0 y 100',
      };
    }

    // Validar que el quiz existe
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return {
        success: false,
        error: 'Quiz no encontrado',
      };
    }

    // Usar transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear registro de intento
      const attempt = await tx.quizAttempt.create({
        data: {
          userId,
          quizId,
          score,
          passed,
          answers,
          completedAt: new Date(),
        },
      });

      return attempt;
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    // Invalidar caché
    invalidateUserCache(userId);

    // Calcular XP ganado
    let xpGained = 0;
    if (passed) {
      xpGained = 100; // XP base por pasar quiz
      // Bonus por puntaje perfecto
      if (score === 100) {
        xpGained += 50;
      }
    }

    // Verificar logros
    const { checkAndUnlockAchievements } = await import('./achievements.service');
    const achievements = await checkAndUnlockAchievements(userId, {
      type: passed ? 'quizzes_passed' : 'quizzes_passed',
      value: 1,
    });

    // Logro por puntaje perfecto
    if (score === 100) {
      const perfectScoreAchievements = await checkAndUnlockAchievements(userId, {
        type: 'perfect_score',
        value: 1,
      });
      achievements.push(...perfectScoreAchievements);
    }

    return {
      success: true,
      xpGained,
      achievementsUnlocked: achievements,
    };
  } catch (error: any) {
    if (error.code === 'P2034') {
      return {
        success: false,
        error: 'Conflicto de concurrencia. Por favor, intenta nuevamente.',
      };
    }

    console.error('Error al registrar intento de quiz:', error);
    return {
      success: false,
      error: 'Error al registrar el intento de quiz',
    };
  }
}

/**
 * Actualizar XP del usuario
 * Nota: Esto requeriría agregar un campo XP al modelo User
 * Por ahora, calculamos XP dinámicamente
 */
export async function updateUserXP(
  userId: string,
  xpGained: number
): Promise<{ success: boolean; totalXP: number; levelUp?: { oldLevel: number; newLevel: number } }> {
  try {
    if (xpGained <= 0) {
      return {
        success: false,
        totalXP: 0,
      };
    }

    // Calcular XP total actual
    const { getUserStats } = await import('./progressQuery.service');
    const stats = await getUserStats(userId);
    const oldTotalXP = stats.totalXP;
    const newTotalXP = oldTotalXP + xpGained;

    // Calcular niveles
    const { calculateLevel } = await import('./levelCalculation.service');
    const oldLevelInfo = await calculateLevel(oldTotalXP);
    const newLevelInfo = await calculateLevel(newTotalXP);

    // Verificar si subió de nivel
    let levelUp;
    if (newLevelInfo.level > oldLevelInfo.level) {
      levelUp = {
        oldLevel: oldLevelInfo.level,
        newLevel: newLevelInfo.level,
      };

      // Verificar logros por nivel
      const { checkAndUnlockAchievements } = await import('./achievements.service');
      await checkAndUnlockAchievements(userId, {
        type: 'xp_reached',
        value: newTotalXP,
      });
    }

    // Invalidar caché
    invalidateUserCache(userId);

    return {
      success: true,
      totalXP: newTotalXP,
      levelUp,
    };
  } catch (error) {
    console.error('Error al actualizar XP del usuario:', error);
    return {
      success: false,
      totalXP: 0,
    };
  }
}

/**
 * Verificar y completar módulo si todas las lecciones están completadas (LearningProgress + LessonProgress)
 */
async function checkAndCompleteModule(
  userId: string,
  moduleId: string,
  tx: any
): Promise<void> {
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

  const learningProgress = await tx.learningProgress.findUnique({
    where: {
      userId_moduleId: { userId, moduleId },
    },
    include: {
      lessons: {
        where: { lessonId: { in: lessonIds }, completed: true },
      },
    },
  });

  if (!learningProgress) return;

  const completedCount = learningProgress.lessons.length;
  if (completedCount !== lessonIds.length) return;

  await tx.learningProgress.update({
    where: { id: learningProgress.id },
    data: {
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const { checkAndUnlockAchievements } = await import('./achievements.service');
  await checkAndUnlockAchievements(userId, {
    type: 'modules_completed',
    value: 1,
  });
}

export default {
  completeLesson,
  saveLessonProgress,
  updateLessonProgress,
  recordQuizAttempt,
  updateUserXP,
};

