import { prisma } from '../../config/prisma';
import { ProgressUpdateResult } from '../../types/progress';
import { invalidateUserCache } from './progressQuery.service';

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

    // Usar transacción para asegurar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // Buscar o crear registro de progreso
      let progress = await tx.progress.findFirst({
        where: {
          userId,
          lessonId,
        },
      });

      if (progress) {
        // Actualizar progreso existente
        progress = await tx.progress.update({
          where: { id: progress.id },
          data: {
            completed: true,
            progress: 100,
          },
        });
      } else {
        // Crear nuevo registro de progreso
        progress = await tx.progress.create({
          data: {
            userId,
            moduleId: lesson.moduleId,
            lessonId,
            completed: true,
            progress: 100,
          },
        });
      }

      // Verificar si el módulo está completo
      await checkAndCompleteModule(userId, lesson.moduleId, tx);

      return progress;
    }, {
      maxWait: 5000, // Tiempo máximo de espera
      timeout: 10000, // Timeout de la transacción
    });

    // Invalidar caché
    invalidateUserCache(userId);

    // Calcular XP ganado
    const xpGained = 50; // XP por lección completada

    // Verificar logros
    const { checkAndUnlockAchievements } = await import('./achievements.service');
    const achievements = await checkAndUnlockAchievements(userId, {
      type: 'lessons_completed',
      value: 1,
    });

    return {
      success: true,
      progress: {
        id: result.id,
        userId: result.userId,
        moduleId: result.moduleId || undefined,
        lessonId: result.lessonId || undefined,
        completed: result.completed,
        progress: result.progress,
        updatedAt: result.updatedAt,
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
  progressPercent: number
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

    // Usar transacción
    const result = await prisma.$transaction(async (tx) => {
      // Buscar progreso existente
      let progress = await tx.progress.findFirst({
        where: {
          userId,
          lessonId,
        },
      });

      const isCompleted = progressPercent >= 100;

      if (progress) {
        // Actualizar progreso existente
        progress = await tx.progress.update({
          where: { id: progress.id },
          data: {
            progress: progressPercent,
            completed: isCompleted,
          },
        });
      } else {
        // Crear nuevo registro
        progress = await tx.progress.create({
          data: {
            userId,
            moduleId: lesson.moduleId,
            lessonId,
            progress: progressPercent,
            completed: isCompleted,
          },
        });
      }

      // Si se completó, verificar módulo
      if (isCompleted) {
        await checkAndCompleteModule(userId, lesson.moduleId, tx);
      }

      return progress;
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    // Invalidar caché
    invalidateUserCache(userId);

    return {
      success: true,
      progress: {
        id: result.id,
        userId: result.userId,
        moduleId: result.moduleId || undefined,
        lessonId: result.lessonId || undefined,
        completed: result.completed,
        progress: result.progress,
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
 * Verificar y completar módulo si todas las lecciones están completadas
 */
async function checkAndCompleteModule(
  userId: string,
  moduleId: string,
  tx: any
): Promise<void> {
  // Obtener todas las lecciones del módulo
  const module = await tx.module.findUnique({
    where: { id: moduleId },
    include: {
      lessons: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  if (!module) return;

  const totalLessons = module.lessons.length;
  if (totalLessons === 0) return;

  // Contar lecciones completadas del usuario
  const completedLessons = await tx.progress.count({
    where: {
      userId,
      moduleId,
      lessonId: { in: module.lessons.map((l: any) => l.id) },
      completed: true,
    },
  });

  // Si todas las lecciones están completadas, marcar módulo como completado
  if (completedLessons === totalLessons) {
    // Buscar o crear progreso del módulo
    let moduleProgress = await tx.progress.findFirst({
      where: {
        userId,
        moduleId,
        lessonId: null,
      },
    });

    if (moduleProgress) {
      await tx.progress.update({
        where: { id: moduleProgress.id },
        data: {
          completed: true,
          progress: 100,
        },
      });
    } else {
      await tx.progress.create({
        data: {
          userId,
          moduleId,
          completed: true,
          progress: 100,
        },
      });
    }

    // Verificar logros por módulo completado
    const { checkAndUnlockAchievements } = await import('./achievements.service');
    await checkAndUnlockAchievements(userId, {
      type: 'modules_completed',
      value: 1,
    });
  }
}

export default {
  completeLesson,
  saveLessonProgress,
  recordQuizAttempt,
  updateUserXP,
};

