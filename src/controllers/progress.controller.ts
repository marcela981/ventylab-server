import { Request, Response, NextFunction } from 'express';
import * as learningProgressService from '../services/progress/learningProgress.service';
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
export async function updateLessonProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { lessonId } = req.params;
    const { completed = false, timeSpent = 0 } = req.body;
    const moduleIdFromQuery = req.query.moduleId as string | undefined;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const moduleId = await resolveModuleIdForLesson(lessonId, moduleIdFromQuery);
    if (!moduleId) {
      return res.json({
        lessonId,
        completed,
        timeSpent,
        lastAccessed: new Date().toISOString(),
        nextLessonId: null,
      });
    }

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