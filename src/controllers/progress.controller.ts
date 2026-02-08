import { Request, Response, NextFunction } from 'express';
import * as learningProgressService from '../services/progress/learningProgress.service';
import * as unifiedProgressService from '../services/progress/unifiedProgress.service';
import { prisma } from '../config/prisma';

// Helper to extract moduleId from lessonId
function extractModuleId(lessonId: string): string {
  // Assumes lessonId format: module-XX-lesson-name
  const match = lessonId.match(/^(module-\d+)/);
  return match ? match[1] : lessonId.split('-')[0];
}

/**
 * Resolve moduleId for a lesson - never fails.
 * Progress is created on access; we never return 404 for "no progress".
 */
async function resolveModuleIdForLesson(
  lessonId: string,
  moduleIdFromQuery?: string
): Promise<string | null> {
  if (moduleIdFromQuery) {
    const exists = await prisma.module.findUnique({
      where: { id: moduleIdFromQuery, isActive: true },
      select: { id: true },
    });
    if (exists) return moduleIdFromQuery;
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { moduleId: true },
  });
  if (lesson) return lesson.moduleId;

  const moduleWithLesson = await prisma.module.findFirst({
    where: { isActive: true, lessons: { some: { id: lessonId } } },
    select: { id: true },
  });
  if (moduleWithLesson) return moduleWithLesson.id;

  const firstModule = await prisma.module.findFirst({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true },
  });
  return firstModule?.id ?? null;
}

// GET /api/progress/lesson/:lessonId
// Never 404: progress is created on access (upsert)
export async function getLessonProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { lessonId } = req.params;
    const moduleIdFromQuery = req.query.moduleId as string | undefined;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const moduleId = await resolveModuleIdForLesson(lessonId, moduleIdFromQuery);
    if (!moduleId) {
      return res.json({
        lessonId,
        completed: false,
        timeSpent: 0,
        lastAccessed: null,
      });
    }

    const progress = await learningProgressService.getLessonProgress(
      userId,
      moduleId,
      lessonId
    );

    res.json(progress);
  } catch (error) {
    next(error);
  }
}

// GET /api/progress/overview
export async function getUserOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const overview = await learningProgressService.getUserProgressOverview(userId);
    res.json(overview);
  } catch (error) {
    next(error);
  }
}

// GET /api/progress/module/:moduleId - Progreso agregado del módulo
// Never 404: creates progress on access (upsert)
export async function getModuleProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { moduleId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const moduleExists = await prisma.module.findUnique({
      where: { id: moduleId, isActive: true },
      select: { id: true },
    });

    if (!moduleExists) {
      return res.json({
        moduleId,
        totalLessons: 0,
        completedLessons: 0,
        completionPercentage: 0,
        timeSpent: 0,
        score: null,
        lessons: [],
        completedAt: null,
      });
    }

    const moduleProgress = await learningProgressService.getModuleProgress(userId, moduleId);
    res.json(moduleProgress);
  } catch (error) {
    next(error);
  }
}

// PUT /api/progress/lesson/:lessonId
// Update lesson progress - never 404, progress created on access (upsert)
//
// IMPORTANT: This endpoint now routes to the unified progress system when
// step data (currentStep, totalSteps) is provided. This ensures step-level
// tracking is persisted to the database.
export async function updateLessonProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { lessonId } = req.params;

    // Extract ALL fields from body (frontend sends these)
    const {
      completed = false,
      timeSpent = 0,
      currentStep,      // 1-based from frontend
      totalSteps,
      completionPercentage,
      scrollPosition,
    } = req.body;

    const moduleIdFromQuery = req.query.moduleId as string | undefined;

    // Debug logging - uncomment to verify endpoint is being hit
    console.log('🔥 PUT /api/progress/lesson/:lessonId HIT', {
      userId: userId?.substring(0, 8) + '...',
      lessonId,
      currentStep,
      totalSteps,
      completionPercentage,
      completed,
      timeSpent,
    });

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const moduleId = await resolveModuleIdForLesson(lessonId, moduleIdFromQuery);
    if (!moduleId) {
      console.log('⚠️ Could not resolve moduleId for lesson:', lessonId);
      return res.json({
        lessonId,
        completed,
        timeSpent,
        lastAccessed: new Date().toISOString(),
        nextLessonId: null,
      });
    }

    // CRITICAL FIX: If step data is provided, use unified progress service
    // This ensures step-level tracking is persisted to the database
    if (typeof currentStep === 'number' && typeof totalSteps === 'number') {
      console.log('📝 Using unified progress service for step tracking');

      // Convert 1-based currentStep from frontend to 0-based for DB
      const currentStepIndex = Math.max(0, currentStep - 1);

      const result = await unifiedProgressService.updateStepProgress({
        userId,
        moduleId,
        lessonId,
        currentStepIndex,
        totalSteps,
        timeSpentDelta: timeSpent,
      });

      if (!result.success) {
        console.error('❌ Unified progress update failed:', result.error);
        // Fall through to legacy behavior on error
      } else {
        console.log('✅ Step progress saved:', {
          lessonId: result.lessonId,
          currentStepIndex: result.currentStepIndex,
          totalSteps: result.totalSteps,
          completed: result.completed,
        });

        // If marked as completed, get next lesson
        let nextLessonId: string | null = null;
        if (completed || result.completed) {
          nextLessonId = await learningProgressService.getNextLesson(
            userId,
            moduleId,
            lessonId
          );
        }

        return res.json({
          lessonId: result.lessonId,
          completed: result.completed,
          timeSpent,
          lastAccessed: new Date().toISOString(),
          currentStep: result.currentStepIndex + 1, // Convert back to 1-based
          totalSteps: result.totalSteps,
          progressPercentage: result.progressPercentage,
          nextLessonId,
        });
      }
    }

    // Legacy fallback for requests without step data
    console.log('📝 Using legacy progress service (no step data)');
    const progress = await learningProgressService.updateLessonProgress({
      userId,
      moduleId,
      lessonId,
      completed,
      timeSpent,
    });

    let nextLessonId: string | null = null;
    if (completed) {
      nextLessonId = await learningProgressService.getNextLesson(
        userId,
        moduleId,
        lessonId
      );
    }

    res.json({
      ...progress,
      nextLessonId,
    });
  } catch (error) {
    console.error('❌ updateLessonProgress error:', error);
    next(error);
  }
}

// POST /api/progress/lesson/:lessonId/complete
// Never 404, progress created on access (upsert)
export async function markComplete(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { lessonId } = req.params;
    const { timeSpent = 0 } = req.body;
    const moduleIdFromQuery = req.query.moduleId as string | undefined;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const moduleId = await resolveModuleIdForLesson(lessonId, moduleIdFromQuery);
    if (!moduleId) {
      return res.json({
        lessonId,
        completed: true,
        timeSpent,
        lastAccessed: new Date().toISOString(),
        nextLessonId: null,
        message: 'Lección completada.',
      });
    }

    const progress = await learningProgressService.markLessonComplete(
      userId,
      moduleId,
      lessonId,
      timeSpent
    );

    const nextLessonId = await learningProgressService.getNextLesson(
      userId,
      moduleId,
      lessonId
    );

    res.json({
      ...progress,
      nextLessonId,
      message: nextLessonId
        ? 'Lección completada. Avanzando a la siguiente.'
        : 'Lección completada. Has terminado este módulo.',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// STUBS PARA RUTAS NUEVAS
// TODO: Implementar funcionalidad completa cuando haya tiempo
// ============================================

/**
 * GET /api/progress/milestones
 * Obtener milestones/hitos del usuario
 */
export async function getMilestones(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // TODO: Implementar lógica de milestones
    // Por ahora retornar estructura vacía para no romper el frontend
    res.json({
      milestones: [],
      totalCompleted: 0,
      totalAvailable: 0,
      nextMilestone: null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/progress/achievements
 * Obtener logros del usuario
 */
export async function getAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Intentar obtener achievements de la BD si existen
    try {
      const achievements = await prisma.achievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
      });
      
      res.json({
        achievements: achievements.map(a => ({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          unlockedAt: a.unlockedAt,
        })),
        totalUnlocked: achievements.length,
      });
    } catch {
      // Si falla, retornar vacío
      res.json({
        achievements: [],
        totalUnlocked: 0,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/progress/skills
 * Obtener habilidades/competencias del usuario
 */
export async function getSkills(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // TODO: Implementar sistema de skills basado en progreso
    // Por ahora retornar estructura vacía
    res.json({
      skills: [],
      categories: [
        { id: 'physiology', name: 'Fisiología Respiratoria', progress: 0 },
        { id: 'ventilation', name: 'Ventilación Mecánica', progress: 0 },
        { id: 'clinical', name: 'Casos Clínicos', progress: 0 },
      ],
      overallLevel: 'beginner',
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// UNIFIED PROGRESS ENDPOINTS (NEW - USE THESE)
// ============================================
// These endpoints implement the consolidated progress system.
// The database is the SINGLE source of truth.

/**
 * POST /api/progress/step/update
 *
 * Update step progress - call on EVERY step navigation.
 * This is the PRIMARY endpoint for tracking user position.
 *
 * Request Body:
 * {
 *   "moduleId": "module-01",
 *   "lessonId": "lesson-01",
 *   "currentStepIndex": 5,     // 0-based
 *   "totalSteps": 10,
 *   "timeSpentDelta": 30       // seconds (optional)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "lessonId": "lesson-01",
 *   "currentStepIndex": 5,
 *   "totalSteps": 10,
 *   "completed": false,
 *   "progressPercentage": 60
 * }
 */
export async function updateStepProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;

    // Debug logging for POST /api/progress/step/update
    console.log('🔥 POST /api/progress/step/update HIT', {
      userId: userId?.substring(0, 8) + '...',
      body: req.body,
    });

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const {
      moduleId,
      lessonId,
      currentStepIndex,
      totalSteps,
      timeSpentDelta = 0,
    } = req.body;

    // Validate required fields
    if (!moduleId || !lessonId) {
      return res.status(400).json({
        success: false,
        error: 'moduleId and lessonId are required',
      });
    }

    if (typeof currentStepIndex !== 'number' || typeof totalSteps !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'currentStepIndex and totalSteps must be numbers',
      });
    }

    const result = await unifiedProgressService.updateStepProgress({
      userId,
      moduleId,
      lessonId,
      currentStepIndex,
      totalSteps,
      timeSpentDelta,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/progress/resume/:moduleId
 *
 * Get resume state for a module - call when user clicks "Continue Module".
 * Returns the EXACT position (lesson + step) to resume.
 *
 * Response:
 * {
 *   "moduleId": "module-01",
 *   "moduleName": "Introduction",
 *   "currentLessonId": "lesson-03",
 *   "currentLessonTitle": "Basics",
 *   "currentLessonOrder": 2,
 *   "currentStepIndex": 5,        // Resume HERE
 *   "totalStepsInLesson": 10,
 *   "moduleProgress": 40,
 *   "totalLessons": 5,
 *   "completedLessons": 2,
 *   "isModuleComplete": false,
 *   "lastAccessedAt": "2026-02-04T..."
 * }
 */
export async function getResumeState(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { moduleId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId is required' });
    }

    const resumeState = await unifiedProgressService.getResumeState(userId, moduleId);
    res.json(resumeState);
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
}

/**
 * POST /api/progress/lesson/:lessonId/complete-unified
 *
 * Mark a lesson as complete with step tracking.
 * Call when user clicks "Complete" on the last step.
 *
 * Request Body:
 * {
 *   "moduleId": "module-01",
 *   "totalSteps": 10,
 *   "timeSpentDelta": 60
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "lessonId": "lesson-01",
 *   "currentStepIndex": 9,
 *   "totalSteps": 10,
 *   "completed": true,
 *   "progressPercentage": 100
 * }
 */
export async function markLessonCompleteUnified(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { lessonId } = req.params;
    const { moduleId, totalSteps, timeSpentDelta = 0 } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!moduleId || !lessonId) {
      return res.status(400).json({
        success: false,
        error: 'moduleId and lessonId are required',
      });
    }

    if (typeof totalSteps !== 'number' || totalSteps < 1) {
      return res.status(400).json({
        success: false,
        error: 'totalSteps must be a positive number',
      });
    }

    const result = await unifiedProgressService.markLessonComplete({
      userId,
      moduleId,
      lessonId,
      totalSteps,
      timeSpentDelta,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Get next lesson for navigation
    const nextLessonId = await learningProgressService.getNextLesson(
      userId,
      moduleId,
      lessonId
    );

    res.json({
      ...result,
      nextLessonId,
      message: nextLessonId
        ? 'Lección completada. Avanzando a la siguiente.'
        : 'Lección completada. Has terminado este módulo.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/progress/lesson/:lessonId/details
 *
 * Get detailed progress for a specific lesson including step info.
 *
 * Query params:
 * - moduleId: string (required)
 *
 * Response:
 * {
 *   "lessonId": "lesson-01",
 *   "currentStepIndex": 5,
 *   "totalSteps": 10,
 *   "completed": false,
 *   "timeSpent": 300,
 *   "lastAccessed": "2026-02-04T...",
 *   "progressPercentage": 60
 * }
 */
export async function getLessonProgressDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { lessonId } = req.params;
    const moduleId = req.query.moduleId as string;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId query parameter is required' });
    }

    const details = await unifiedProgressService.getLessonProgressDetails(
      userId,
      moduleId,
      lessonId
    );

    if (!details) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json(details);
  } catch (error) {
    next(error);
  }
}

// ============================================
// DEBUG ENDPOINT - REMOVE IN PRODUCTION
// ============================================
/**
 * GET /api/progress/debug/write-test
 *
 * Tests database write capability. Creates a debug record and immediately
 * reads it back. Use this to verify:
 * 1. DATABASE_URL is correct
 * 2. Prisma can write to the DB
 * 3. The same DB is used by backend and Prisma Studio
 *
 * Response includes the DATABASE_URL (masked) for verification.
 */
export async function debugWriteTest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Log DATABASE_URL (masked for security)
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    const maskedUrl = dbUrl.replace(/\/\/[^@]+@/, '//***:***@');
    console.log('🔍 DATABASE_URL:', maskedUrl);

    // Find any module for the test
    const testModule = await prisma.module.findFirst({
      where: { isActive: true },
      select: { id: true, title: true },
    });

    if (!testModule) {
      return res.json({
        success: false,
        error: 'No active modules found',
        databaseUrl: maskedUrl,
      });
    }

    // Create a test progress record
    const testLessonId = `DEBUG_LESSON_${Date.now()}`;
    const testStepIndex = Math.floor(Math.random() * 10);

    console.log('📝 Creating test progress record...');

    const result = await prisma.$transaction(async (tx) => {
      // Upsert LearningProgress
      const learningProgress = await tx.learningProgress.upsert({
        where: {
          userId_moduleId: { userId, moduleId: testModule.id },
        },
        update: {
          lastAccessedLessonId: testLessonId,
          lastAccessedAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          userId,
          moduleId: testModule.id,
          lastAccessedLessonId: testLessonId,
          lastAccessedAt: new Date(),
          timeSpent: 0,
        },
      });

      console.log('✅ LearningProgress upserted:', learningProgress.id);

      // Create LessonProgress
      const lessonProgress = await tx.lessonProgress.upsert({
        where: {
          progressId_lessonId: {
            progressId: learningProgress.id,
            lessonId: testLessonId,
          },
        },
        update: {
          currentStepIndex: testStepIndex,
          totalSteps: 10,
          lastAccessed: new Date(),
          updatedAt: new Date(),
        },
        create: {
          progressId: learningProgress.id,
          lessonId: testLessonId,
          currentStepIndex: testStepIndex,
          totalSteps: 10,
          completed: false,
          timeSpent: 0,
          lastAccessed: new Date(),
        },
      });

      console.log('✅ LessonProgress upserted:', lessonProgress.id);

      return { learningProgress, lessonProgress };
    });

    // Read it back to verify
    const readBack = await prisma.lessonProgress.findUnique({
      where: {
        progressId_lessonId: {
          progressId: result.learningProgress.id,
          lessonId: testLessonId,
        },
      },
    });

    console.log('📖 Read back from DB:', readBack?.id);

    // Clean up the test lesson (keep the learning progress)
    await prisma.lessonProgress.delete({
      where: { id: readBack!.id },
    });

    console.log('🧹 Cleaned up test lesson progress');

    res.json({
      success: true,
      message: 'Database write test PASSED',
      databaseUrl: maskedUrl,
      testResults: {
        learningProgressId: result.learningProgress.id,
        moduleId: testModule.id,
        moduleName: testModule.title,
        testLessonId,
        testStepIndex,
        writeVerified: readBack?.currentStepIndex === testStepIndex,
        timestamp: new Date().toISOString(),
      },
      instructions: [
        '1. Open Prisma Studio (npx prisma studio)',
        '2. Check learning_progress table for this user',
        '3. Navigate steps in frontend',
        '4. Refresh Prisma Studio to see lesson_progress rows',
      ],
    });
  } catch (error: any) {
    console.error('❌ Debug write test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      databaseUrl: process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, '//***:***@') || 'NOT SET',
    });
  }
}