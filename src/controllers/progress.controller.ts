import { Request, Response } from 'express';
import {
  getUserProgress,
  getModuleProgress as getModuleProgressService,
  getLessonProgress as getLessonProgressService,
  getUserStats,
} from '../services/progress/progressQuery.service';
import {
  completeLesson as completeLessonService,
  saveLessonProgress,
  recordQuizAttempt,
} from '../services/progress/progressUpdate.service';
import { calculateLevel } from '../services/progress/levelCalculation.service';
import { prisma } from '../config/prisma';

/**
 * Configurar headers de respuesta para evitar caché
 */
function setNoCacheHeaders(res: Response) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

/**
 * GET /api/progress/overview
 * Obtener estadísticas generales del progreso del usuario
 */
export const getProgressOverview = async (req: Request, res: Response) => {
  try {
    setNoCacheHeaders(res);

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para ver tu progreso',
      });
    }

    // Obtener progreso general y estadísticas
    const [progress, stats] = await Promise.all([
      getUserProgress(userId),
      getUserStats(userId),
    ]);

    // Obtener nivel actual
    const levelInfo = await calculateLevel(stats.totalXP);

    // Obtener próximas lecciones sugeridas (lecciones no completadas)
    const nextLessons = await prisma.lesson.findMany({
      where: {
        isActive: true,
        progress: {
          none: {
            userId,
            completed: true,
          },
        },
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { module: { order: 'asc' } },
        { order: 'asc' },
      ],
      take: 5, // Próximas 5 lecciones
    });

    // Obtener objetivos próximos (logros cercanos)
    const { getAvailableAchievements } = await import('../services/progress/achievements.service');
    const availableAchievements = await getAvailableAchievements(userId);
    const nearAchievements = availableAchievements.slice(0, 3); // Próximos 3 logros

    const overview = {
      progress: {
        overallPercentage: progress.overallProgress,
        modulesCompleted: progress.completedModules,
        modulesTotal: progress.totalModules,
        lessonsCompleted: progress.completedLessons,
        lessonsTotal: progress.totalLessons,
        lastActivity: progress.lastActivity,
      },
      stats: {
        totalXP: stats.totalXP,
        level: levelInfo.level,
        xpToNextLevel: levelInfo.xpToNext,
        progressToNextLevel: levelInfo.progressToNext,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalStudyTime: stats.totalStudyTime,
      },
      nextLessons: nextLessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        moduleId: lesson.moduleId,
        moduleTitle: lesson.module.title,
        order: lesson.order,
      })),
      upcomingAchievements: nearAchievements.map(achievement => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        xpReward: achievement.xpReward,
      })),
    };

    // Log de acceso
    console.log(`[${new Date().toISOString()}] Usuario ${userId} accedió a overview de progreso`);

    res.status(200).json(overview);
  } catch (error: any) {
    console.error('Error al obtener overview de progreso:', error);
    res.status(500).json({
      error: 'Error al obtener progreso',
      message: 'Ocurrió un error al consultar las estadísticas de progreso',
    });
  }
};

/**
 * GET /api/progress/modules/:moduleId
 * Obtener progreso detallado de un módulo específico
 */
export const getModuleProgress = async (req: Request, res: Response) => {
  try {
    setNoCacheHeaders(res);

    const userId = req.user?.id;
    const { moduleId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para ver el progreso',
      });
    }

    // Validar que moduleId esté presente
    if (!moduleId) {
      return res.status(400).json({
        error: 'Parámetro faltante',
        message: 'El ID del módulo es requerido',
      });
    }

    // Validar que el módulo existe
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: {
        id: true,
        title: true,
        description: true,
        isActive: true,
      },
    });

    if (!module) {
      return res.status(404).json({
        error: 'Módulo no encontrado',
        message: 'El módulo especificado no existe',
      });
    }

    if (!module.isActive) {
      return res.status(403).json({
        error: 'Módulo no disponible',
        message: 'Este módulo no está activo',
      });
    }

    // Obtener progreso del módulo
    const moduleProgress = await getModuleProgressService(userId, moduleId);

    // Obtener quizzes del módulo y sus intentos
    const quizzes = await prisma.quiz.findMany({
      where: {
        moduleId,
        isActive: true,
      },
      include: {
        attempts: {
          where: { userId },
          orderBy: { startedAt: 'desc' },
          take: 1, // Último intento
        },
      },
    });

    const quizStats = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      lastAttempt: quiz.attempts[0] ? {
        score: quiz.attempts[0].score,
        passed: quiz.attempts[0].passed,
        completedAt: quiz.attempts[0].completedAt,
      } : null,
      totalAttempts: await prisma.quizAttempt.count({
        where: {
          userId,
          quizId: quiz.id,
        },
      }),
    }));

    const completedQuizzes = quizStats.filter(q => q.lastAttempt?.passed).length;

    const response = {
      module: {
        id: module.id,
        title: module.title,
        description: module.description,
      },
      progress: {
        percentage: moduleProgress.progress,
        lessonsCompleted: moduleProgress.completedLessons,
        lessonsTotal: moduleProgress.totalLessons,
        quizzesCompleted: completedQuizzes,
        quizzesTotal: quizzes.length,
      },
      lessons: moduleProgress.lessons.map(lesson => ({
        id: lesson.lessonId,
        title: lesson.lessonTitle,
        completed: lesson.completed,
        progress: lesson.progress,
        lastAccessed: lesson.lastAccessed,
        completedAt: lesson.completedAt,
      })),
      quizzes: quizStats,
    };

    // Log de acceso
    console.log(`[${new Date().toISOString()}] Usuario ${userId} accedió a progreso del módulo ${moduleId}`);

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error al obtener progreso del módulo:', error);
    
    if (error.message === 'Módulo no encontrado') {
      return res.status(404).json({
        error: 'Módulo no encontrado',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Error al obtener progreso del módulo',
      message: 'Ocurrió un error al consultar el progreso del módulo',
    });
  }
};

/**
 * GET /api/progress/lessons/:lessonId
 * Obtener estado de una lección específica
 */
export const getLessonProgress = async (req: Request, res: Response) => {
  try {
    setNoCacheHeaders(res);

    const userId = req.user?.id;
    const { lessonId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para ver el progreso',
      });
    }

    // Validar que lessonId esté presente
    if (!lessonId) {
      return res.status(400).json({
        error: 'Parámetro faltante',
        message: 'El ID de la lección es requerido',
      });
    }

    // Validar que la lección existe
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({
        error: 'Lección no encontrada',
        message: 'La lección especificada no existe',
      });
    }

    if (!lesson.isActive) {
      return res.status(403).json({
        error: 'Lección no disponible',
        message: 'Esta lección no está activa',
      });
    }

    // Obtener progreso de la lección
    const lessonProgress = await getLessonProgressService(userId, lessonId);

    if (!lessonProgress) {
      return res.status(404).json({
        error: 'Progreso no encontrado',
        message: 'No se encontró progreso para esta lección',
      });
    }

    // Obtener intentos de quiz relacionados con esta lección
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quiz: {
          lessonId,
        },
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    // Calcular tiempo dedicado (estimado basado en número de accesos)
    const progressRecords = await prisma.progress.findMany({
      where: {
        userId,
        lessonId,
      },
      orderBy: { updatedAt: 'asc' },
    });

    // Estimación: 30 minutos por sesión de estudio
    const estimatedTimeMinutes = progressRecords.length * 30;

    const response = {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        moduleId: lesson.moduleId,
        moduleTitle: lesson.module.title,
      },
      progress: {
        completed: lessonProgress.completed,
        progressPercentage: lessonProgress.progress,
        lastAccessed: lessonProgress.lastAccessed,
        completedAt: lessonProgress.completedAt,
        estimatedTimeMinutes,
        accessCount: progressRecords.length,
      },
      quizAttempts: quizAttempts.map(attempt => ({
        id: attempt.id,
        quizId: attempt.quiz.id,
        quizTitle: attempt.quiz.title,
        score: attempt.score,
        passed: attempt.passed,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
      })),
    };

    // Log de acceso
    console.log(`[${new Date().toISOString()}] Usuario ${userId} accedió a progreso de lección ${lessonId}`);

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error al obtener progreso de la lección:', error);
    
    if (error.message?.includes('no encontrada') || error.message?.includes('no existe')) {
      return res.status(404).json({
        error: 'Lección no encontrada',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Error al obtener progreso de la lección',
      message: 'Ocurrió un error al consultar el progreso de la lección',
    });
  }
};

/**
 * POST /api/progress/lessons/:lessonId/complete
 * Marcar una lección como completada
 */
export const completeLesson = async (req: Request, res: Response) => {
  try {
    setNoCacheHeaders(res);

    const userId = req.user?.id;
    const { lessonId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para completar lecciones',
      });
    }

    // Validar que lessonId esté presente
    if (!lessonId) {
      return res.status(400).json({
        error: 'Parámetro faltante',
        message: 'El ID de la lección es requerido',
      });
    }

    // Validar que la lección existe
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        title: true,
        isActive: true,
      },
    });

    if (!lesson) {
      return res.status(404).json({
        error: 'Lección no encontrada',
        message: 'La lección especificada no existe',
      });
    }

    if (!lesson.isActive) {
      return res.status(403).json({
        error: 'Lección no disponible',
        message: 'Esta lección no está activa',
      });
    }

    // Completar lección usando el servicio
    const result = await completeLessonService(userId, lessonId);

    if (!result.success) {
      return res.status(400).json({
        error: 'Error al completar lección',
        message: result.error || 'No se pudo completar la lección',
      });
    }

    // Obtener estadísticas actualizadas
    const stats = await getUserStats(userId);
    const levelInfo = await calculateLevel(stats.totalXP);

    const response = {
      success: true,
      message: 'Lección completada exitosamente',
      lesson: {
        id: lesson.id,
        title: lesson.title,
      },
      xpGained: result.xpGained || 0,
      level: {
        current: levelInfo.level,
        xpTotal: stats.totalXP,
        xpToNext: levelInfo.xpToNext,
        progressToNext: levelInfo.progressToNext,
      },
      achievementsUnlocked: result.achievementsUnlocked || [],
      levelUp: result.levelUp,
    };

    // Log de evento importante
    console.log(`[${new Date().toISOString()}] Usuario ${userId} completó lección ${lessonId}. XP ganado: ${result.xpGained || 0}`);

    if (result.achievementsUnlocked && result.achievementsUnlocked.length > 0) {
      console.log(`[${new Date().toISOString()}] Usuario ${userId} desbloqueó ${result.achievementsUnlocked.length} logro(s)`);
    }

    if (result.levelUp) {
      console.log(`[${new Date().toISOString()}] Usuario ${userId} subió de nivel ${result.levelUp.oldLevel} a ${result.levelUp.newLevel}`);
    }

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error al completar lección:', error);
    
    if (error.message?.includes('no encontrada') || error.message?.includes('no existe')) {
      return res.status(404).json({
        error: 'Lección no encontrada',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Error al completar lección',
      message: 'Ocurrió un error al marcar la lección como completada',
    });
  }
};

/**
 * POST /api/progress/quiz/:quizId/attempt
 * Registrar intento de quiz y calcular score
 */
export const submitQuizAttempt = async (req: Request, res: Response) => {
  try {
    setNoCacheHeaders(res);

    const userId = req.user?.id;
    const { quizId } = req.params;
    const { answers } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para enviar intentos de quiz',
      });
    }

    // Validar que quizId esté presente
    if (!quizId) {
      return res.status(400).json({
        error: 'Parámetro faltante',
        message: 'El ID del quiz es requerido',
      });
    }

    // Validar que answers esté presente
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Las respuestas deben ser un objeto válido',
      });
    }

    // Validar que el quiz existe
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        questions: true,
        passingScore: true,
        isActive: true,
      },
    });

    if (!quiz) {
      return res.status(404).json({
        error: 'Quiz no encontrado',
        message: 'El quiz especificado no existe',
      });
    }

    if (!quiz.isActive) {
      return res.status(403).json({
        error: 'Quiz no disponible',
        message: 'Este quiz no está activo',
      });
    }

    // Validar que questions sea un array
    const questions = quiz.questions as any;
    if (!Array.isArray(questions)) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'El quiz no tiene preguntas válidas',
      });
    }

    // Calcular score
    let correctAnswers = 0;
    const totalQuestions = questions.length;
    const feedback: Array<{
      questionId: string | number;
      correct: boolean;
      userAnswer: any;
      correctAnswer: any;
      explanation?: string;
    }> = [];

    questions.forEach((question: any, index: number) => {
      const questionId = question.id || question.questionId || index;
      const userAnswer = answers[questionId] || answers[index];
      const correctAnswer = question.correctAnswer || question.answer;

      let isCorrect = false;

      // Comparar respuestas (soporta diferentes tipos)
      if (Array.isArray(correctAnswer)) {
        // Respuesta múltiple
        isCorrect = Array.isArray(userAnswer) &&
          userAnswer.length === correctAnswer.length &&
          userAnswer.every((ans: any) => correctAnswer.includes(ans));
      } else if (typeof correctAnswer === 'object' && correctAnswer !== null) {
        // Respuesta compleja (comparar JSON)
        isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
      } else {
        // Respuesta simple
        isCorrect = userAnswer === correctAnswer;
      }

      if (isCorrect) {
        correctAnswers++;
      }

      feedback.push({
        questionId,
        correct: isCorrect,
        userAnswer,
        correctAnswer,
        explanation: question.explanation,
      });
    });

    // Calcular score porcentual
    const score = totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100 * 100) / 100
      : 0;

    // Determinar si pasó
    const passed = score >= quiz.passingScore;

    // Guardar intento usando el servicio
    const result = await recordQuizAttempt(
      userId,
      quizId,
      score,
      passed,
      answers
    );

    if (!result.success) {
      return res.status(400).json({
        error: 'Error al guardar intento',
        message: result.error || 'No se pudo guardar el intento del quiz',
      });
    }

    // Obtener estadísticas actualizadas
    const stats = await getUserStats(userId);
    const levelInfo = await calculateLevel(stats.totalXP);

    const response = {
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
      },
      attempt: {
        score,
        passed,
        correctAnswers,
        totalQuestions,
        passingScore: quiz.passingScore,
      },
      feedback,
      xpGained: result.xpGained || 0,
      level: {
        current: levelInfo.level,
        xpTotal: stats.totalXP,
        xpToNext: levelInfo.xpToNext,
      },
      achievementsUnlocked: result.achievementsUnlocked || [],
    };

    // Log de evento importante
    console.log(`[${new Date().toISOString()}] Usuario ${userId} completó quiz ${quizId}. Score: ${score}%, Pasó: ${passed}`);

    if (result.achievementsUnlocked && result.achievementsUnlocked.length > 0) {
      console.log(`[${new Date().toISOString()}] Usuario ${userId} desbloqueó ${result.achievementsUnlocked.length} logro(s) por completar quiz`);
    }

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error al procesar intento de quiz:', error);
    
    if (error.message?.includes('no encontrado') || error.message?.includes('no existe')) {
      return res.status(404).json({
        error: 'Quiz no encontrado',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Error al procesar intento de quiz',
      message: 'Ocurrió un error al procesar el intento del quiz',
    });
  }
};

export default {
  getProgressOverview,
  getModuleProgress,
  getLessonProgress,
  completeLesson,
  submitQuizAttempt,
};

