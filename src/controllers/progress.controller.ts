import { Request, Response, NextFunction } from 'express';
import * as progressService from '../services/progress.service';

// GET /api/progress/lesson/:lessonId
export async function getLessonProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { lessonId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const progress = await progressService.getLessonProgress(userId, lessonId);
    
    // Si no hay progreso, retornar objeto inicial (no 404)
    if (!progress) {
      return res.json({
        lessonId,
        currentStep: 0,
        totalSteps: 1,
        completed: false,
        completionPercentage: 0,
        timeSpent: 0,
        lastAccess: null,
        completedAt: null
      });
    }

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

    const overview = await progressService.getUserProgress(userId);
    res.json(overview);
  } catch (error) {
    next(error);
  }
}

// GET /api/progress/module/:moduleId - Progreso agregado del módulo
export async function getModuleProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { moduleId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Obtener progreso del módulo usando el servicio
    const moduleProgress = await progressService.getModuleProgress(userId, moduleId);
    res.json(moduleProgress);
  } catch (error) {
    next(error);
  }
}

// PUT /api/progress/lesson/:lessonId
export async function updateLessonProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { lessonId } = req.params;
    const { completionPercentage, timeSpent, scrollPosition, lastViewedSection } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Accept completionPercentage (new format) or currentStep/totalSteps (legacy format)
    if (typeof completionPercentage === 'number') {
      // New format: use completionPercentage directly
      const progress = await progressService.updateLessonProgressByPercentage(userId, {
        lessonId,
        completionPercentage,
        timeSpent: timeSpent || 0,
        scrollPosition,
        lastViewedSection
      });

      res.json(progress);
    } else if (req.body.currentStep !== undefined && req.body.totalSteps !== undefined) {
      // Legacy format: support for backward compatibility
      const { currentStep, totalSteps } = req.body;
      
      if (typeof currentStep !== 'number' || typeof totalSteps !== 'number') {
        return res.status(400).json({ error: 'currentStep y totalSteps deben ser números' });
      }

      const progress = await progressService.updateLessonProgress(userId, {
        lessonId,
        currentStep,
        totalSteps,
        timeSpent: timeSpent || 0
      });

      res.json(progress);
    } else {
      return res.status(400).json({ error: 'completionPercentage o currentStep/totalSteps son requeridos' });
    }
  } catch (error) {
    next(error);
  }
}

// POST /api/progress/lesson/:lessonId/complete
export async function markComplete(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers['x-user-id'] as string || (req.user as any)?.id;
    const { lessonId } = req.params;
    const { totalSteps } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const progress = await progressService.markLessonComplete(userId, lessonId, totalSteps || 1);
    res.json(progress);
  } catch (error) {
    next(error);
  }
}