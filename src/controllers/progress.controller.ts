import { Request, Response } from 'express';
import {
  getUserProgress,
  getModuleProgress as getModuleProgressService,
  getLessonProgress as getLessonProgressService,
  getUserStats,
} from '../services/progress/progressQuery.service';
import { getModuleProgressStats } from '../services/progress/moduleProgress.service';
import {
  completeLesson as completeLessonService,
  updateLessonProgress as updateLessonProgressService,
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
    const userEmail = req.user?.email;
    const userName = (req.user as { name?: string } | undefined)?.name;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para ver tu progreso',
      });
    }

    const progressOverview = await getUserProgress(userId);

    const modulesWithProgress = await prisma.module.findMany({
      where: {
        isActive: true,
        progress: {
          some: { userId },
        },
      },
      select: {
        id: true,
        title: true,
        progress: {
          where: { userId },
          select: {
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
        },
      },
    });

    const modulesWithStats = await Promise.all(
      modulesWithProgress.map(async (module) => {
        const stats = await getModuleProgressStats(userId, module.id);
        const lastAccessed = module.progress[0]?.updatedAt ?? null;
        const isCompleted = stats.totalLessons > 0 && stats.completedLessons >= stats.totalLessons;

        return {
          id: module.id,
          title: module.title,
          progress: stats.moduleProgress,
          completed: isCompleted,
          totalLessons: stats.totalLessons,
          completedLessons: stats.completedLessons,
          lastAccessedLesson: stats.lastAccessedLesson,
          nextLesson: stats.nextIncompleteLesson,
          lastAccessed,
        };
      })
    );

    modulesWithStats.sort((a, b) => {
      const aTime = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
      const bTime = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
      return bTime - aTime;
    });

    const response = {
      user: {
        id: userId,
        email: userEmail,
        name: userName,
      },
      overview: {
        totalModules: progressOverview.totalModules,
        completedModules: progressOverview.completedModules,
        overallProgress: progressOverview.overallProgress,
      },
      modules: modulesWithStats,
    };

    console.log(`[${new Date().toISOString()}] Usuario ${userId} accedió a overview de progreso`);

    res.status(200).json(response);
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

    // Obtener conteo de intentos para cada quiz
    const quizStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const totalAttempts = await prisma.quizAttempt.count({
          where: {
            userId,
            quizId: quiz.id,
          },
        });
        
        return {
          id: quiz.id,
          title: quiz.title,
          lastAttempt: quiz.attempts[0] ? {
            score: quiz.attempts[0].score,
            passed: quiz.attempts[0].passed,
            completedAt: quiz.attempts[0].completedAt,
          } : null,
          totalAttempts,
        };
      })
    );

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

    // Si no hay progreso, devolver progreso inicial en lugar de 404
    if (!lessonProgress) {
      return res.status(200).json({
        lesson: {
          id: lessonId,
          title: lesson.title,
          moduleId: lesson.moduleId,
          moduleTitle: lesson.module.title,
        },
        progress: {
          completed: false,
          progressPercentage: 0,
          lastAccessed: null,
          completedAt: null,
          estimatedTimeMinutes: 0,
          accessCount: 0,
        },
        quizAttempts: [],
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
 * PUT /api/progress/lesson/:lessonId
 * Actualizar progreso parcial de una lección
 * Body: { progress, timeSpent?, completed?, completionPercentage? }
 */
export const updateLessonProgress = async (req: Request, res: Response) => {
  // ═══════════════════════════════════════════════════════════════
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 [BACKEND] updateLessonProgress REQUEST RECEIVED');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📍 Method:', req.method);
  console.log('📍 URL:', req.url);
  console.log('📍 Full path:', req.path);
  console.log('📍 Base URL:', req.baseUrl);
  console.log('📍 Original URL:', req.originalUrl);
  console.log('');
  console.log('📦 req.params:', JSON.stringify(req.params, null, 2));
  console.log('📦 req.query:', JSON.stringify(req.query, null, 2));
  console.log('📦 req.body:', JSON.stringify(req.body, null, 2));
  console.log('');
  console.log('👤 req.user exists?', !!req.user);
  if (req.user) {
    console.log('👤 req.user.id:', req.user.id);
    console.log('👤 req.user:', JSON.stringify(req.user, null, 2));
  } else {
    console.log('👤 req.user:', 'NULL or UNDEFINED');
  }
  console.log('');
  console.log('🔑 Headers:');
  console.log('   - Content-Type:', req.headers['content-type']);
  console.log('   - Authorization:', req.headers['authorization'] ? 'EXISTS' : 'MISSING');
  console.log('   - Cookie:', req.headers['cookie'] ? 'EXISTS' : 'MISSING');
  console.log('   - Origin:', req.headers['origin']);
  console.log('   - Referer:', req.headers['referer']);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  try {
    setNoCacheHeaders(res);

    // Extract data
    const userId = req.user?.id;
    const lessonIdFromParams = req.params.lessonId;
    const { 
      lessonId: lessonIdFromBody, 
      moduleId, 
      progress, 
      completionPercentage, 
      timeSpent,
      timeSpentDelta,
      completed,
      lastAccessed
    } = req.body;

    console.log('🔍 [BACKEND] Extracted values:');
    console.log('   - userId:', userId);
    console.log('   - lessonIdFromParams:', lessonIdFromParams);
    console.log('   - lessonIdFromBody:', lessonIdFromBody);
    console.log('   - moduleId:', moduleId);
    console.log('   - progress:', progress);
    console.log('   - completionPercentage:', completionPercentage);
    console.log('   - timeSpent:', timeSpent);
    console.log('   - timeSpentDelta:', timeSpentDelta);
    console.log('   - completed:', completed);
    console.log('   - lastAccessed:', lastAccessed);
    console.log('');

    // Validation
    if (!userId) {
      console.error('❌ [BACKEND] VALIDATION ERROR: No userId');
      console.error('   req.user:', req.user);
      console.log('═══════════════════════════════════════════════════════════════');
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Usuario no encontrado en la sesión',
        details: {
          hasUser: !!req.user,
          userId: userId
        }
      });
    }

    const lessonId = lessonIdFromParams || lessonIdFromBody;
    if (!lessonId) {
      console.error('❌ [BACKEND] VALIDATION ERROR: No lessonId');
      console.error('   lessonIdFromParams:', lessonIdFromParams);
      console.error('   lessonIdFromBody:', lessonIdFromBody);
      console.error('   req.body:', req.body);
      console.log('═══════════════════════════════════════════════════════════════');
      return res.status(400).json({
        error: 'Parámetro faltante',
        message: 'lessonId es requerido',
        details: {
          receivedParams: req.params,
          receivedBody: req.body
        }
      });
    }

    console.log('✅ [BACKEND] Validation passed');
    console.log('   - Using lessonId:', lessonId);
    console.log('   - Using userId:', userId);
    console.log('');

    // Handle timeSpentDelta OR timeSpent
    const effectiveTimeSpent = timeSpentDelta !== undefined ? timeSpentDelta : timeSpent;

    const rawCompletion = typeof completionPercentage === 'number'
      ? completionPercentage
      : (typeof progress === 'number' ? progress : undefined);

    console.log('[Backend Controller] rawCompletion calculated:', rawCompletion);
    console.log('[Backend Controller] effectiveTimeSpent:', effectiveTimeSpent);

    // Make progress optional for timeSpent-only updates
    if (typeof rawCompletion !== 'number' && effectiveTimeSpent === undefined) {
      console.error('[Backend Controller] ❌ Neither progress nor timeSpent provided');
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Se requiere al menos progress o timeSpent',
      });
    }

    // Only calculate completion percentage if rawCompletion is provided
    let clampedCompletionPercentage: number | undefined = undefined;
    
    if (typeof rawCompletion === 'number') {
      const normalizedCompletionPercentage = rawCompletion <= 1
        ? rawCompletion * 100
        : rawCompletion;
      clampedCompletionPercentage = Math.min(100, Math.max(0, normalizedCompletionPercentage));

      if (Number.isNaN(clampedCompletionPercentage)) {
        console.error('[Backend Controller] ❌ Invalid completion percentage (NaN)');
        return res.status(400).json({
          error: 'Datos inválidos',
          message: 'El progreso debe ser un número válido',
        });
      }
      
      console.log('[Backend Controller] clampedCompletionPercentage:', clampedCompletionPercentage);
    } else {
      console.log('[Backend Controller] No completion percentage provided, timeSpent-only update');
    }

    console.log('📤 [BACKEND] Calling updateLessonProgressService with:');
    console.log('   - userId:', userId);
    console.log('   - lessonId:', lessonId);
    console.log('   - completionPercentage:', clampedCompletionPercentage);
    console.log('   - timeSpent:', effectiveTimeSpent);
    console.log('   - completed:', completed);
    console.log('');

    const result = await updateLessonProgressService(userId, lessonId, {
      completionPercentage: clampedCompletionPercentage,
      timeSpent: effectiveTimeSpent,
      completed,
    });

    if (!result.success) {
      console.error('❌ [BACKEND] Service returned failure:', result.error);
      
      if (result.error?.toLowerCase().includes('lección no encontrada')) {
        // Si la lección no existe en BD, es normal en desarrollo
        console.log(`[${new Date().toISOString()}] Progreso para lección ${lessonId} no guardado en BD: ${result.error}`);
        const response = {
          success: true,
          message: 'Progreso actualizado',
          lesson: { id: lessonId },
          progress: clampedCompletionPercentage ?? 0,
          completed: completed ?? (clampedCompletionPercentage ? clampedCompletionPercentage >= 90 : false),
          timeSpent: typeof effectiveTimeSpent === 'number' ? effectiveTimeSpent : 0,
          savedToDb: false,
        };
        console.log('✅ [BACKEND] Sending response (not saved to DB):', JSON.stringify(response, null, 2));
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
        return res.status(200).json(response);
      }

      console.error('❌ [BACKEND] Service error, returning 400');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      return res.status(400).json({
        error: 'Error al actualizar progreso',
        message: result.error || 'No se pudo actualizar el progreso',
      });
    }

    const persistedProgress = result.progress?.id
      ? await prisma.progress.findUnique({
          where: { id: result.progress.id },
          select: { timeSpent: true, moduleId: true },
        })
      : null;

    const resolvedModuleId = persistedProgress?.moduleId ?? result.progress?.moduleId;
    const resolvedTimeSpent = persistedProgress?.timeSpent ?? 0;

    const response = {
      success: true,
      message: 'Progreso actualizado',
      lesson: {
        id: lessonId,
        moduleId: resolvedModuleId,
      },
      progress: result.progress?.progress ?? clampedCompletionPercentage ?? 0,
      completed: result.progress?.completed ?? false,
      timeSpent: resolvedTimeSpent,
      savedToDb: true,
    };

    console.log('✅ [BACKEND] Service call successful');
    console.log('   result:', JSON.stringify(result, null, 2));
    console.log('');
    console.log('✅ [BACKEND] Sending response:');
    console.log('   - Status: 200');
    console.log('   - Response:', JSON.stringify(response, null, 2));
    console.log(
      `   - Summary: Usuario ${userId} - Lección ${lessonId}: progress=${clampedCompletionPercentage ?? 'none'}, timeSpent=${effectiveTimeSpent ?? 'none'}`
    );
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    res.status(200).json(response);
  } catch (error: any) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('❌ [BACKEND] CATCH ERROR in updateLessonProgress');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('');

    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

/**
 * GET /api/progress/module/:moduleId/resume
 * Get resume point for a module (first incomplete lesson)
 */
export const getModuleResumePoint = async (req: Request, res: Response) => {
  try {
    setNoCacheHeaders(res);

    const userId = req.user?.id;
    const { moduleId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes estar autenticado para obtener el punto de reanudación',
      });
    }

    if (!moduleId) {
      return res.status(400).json({
        error: 'Parámetro faltante',
        message: 'El ID del módulo es requerido',
      });
    }

    // Import the new service
    const { getModuleResumePoint: getResumePointService } = await import('../services/progress.service');
    
    const resumePoint = await getResumePointService(userId, moduleId);

    if (!resumePoint) {
      return res.status(404).json({
        error: 'Sin lecciones',
        message: 'No se encontraron lecciones para este módulo',
      });
    }

    console.log(`[${new Date().toISOString()}] Usuario ${userId} obtuvo punto de reanudación para módulo ${moduleId}`);

    res.status(200).json(resumePoint);
  } catch (error: any) {
    console.error('Error al obtener punto de reanudación:', error);
    res.status(500).json({
      error: 'Error al obtener punto de reanudación',
      message: 'Ocurrió un error al consultar el punto de reanudación',
    });
  }
};

export default {
  getProgressOverview,
  getModuleProgress,
  getLessonProgress,
  updateLessonProgress,
  completeLesson,
  submitQuizAttempt,
  getModuleResumePoint,
};

