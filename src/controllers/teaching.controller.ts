/**
 * Teaching Controller
 * Exposes teaching progression services via HTTP endpoints.
 *
 * Delegates to:
 * - completeLesson()     from teaching/lessonProgress.service
 * - canAccessLesson()    from teaching/lessonProgress.service
 * - canAccessModule()    from teaching/moduleUnlock.service
 * - getUnlockedModules() from teaching/moduleUnlock.service
 */

import { Request, Response, NextFunction } from 'express';
import {
  completeLesson as completeLessonService,
  canAccessLesson as canAccessLessonService,
  canAccessModule as canAccessModuleService,
  getUnlockedModules as getUnlockedModulesService,
} from '../services/teaching';
import { sendSuccess } from '../utils/response';
import { HTTP_STATUS } from '../config/constants';

/**
 * Complete a lesson (with optional quiz/case scores).
 * POST /api/teaching/lessons/:lessonId/complete
 * Body: { quizScore?: number, caseScore?: number }
 */
export const completeLessonHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendSuccess(res, HTTP_STATUS.UNAUTHORIZED, 'Usuario no autenticado');
      return;
    }

    const { quizScore, caseScore } = req.body;

    const result = await completeLessonService(
      userId,
      lessonId,
      quizScore !== undefined ? Number(quizScore) : undefined,
      caseScore !== undefined ? Number(caseScore) : undefined
    );

    sendSuccess(res, HTTP_STATUS.OK, 'Lección completada exitosamente', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all unlocked module IDs for the authenticated user.
 * GET /api/teaching/modules/unlocked
 */
export const getUnlockedModulesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendSuccess(res, HTTP_STATUS.UNAUTHORIZED, 'Usuario no autenticado');
      return;
    }

    const unlockedIds = await getUnlockedModulesService(userId);

    sendSuccess(res, HTTP_STATUS.OK, 'Módulos desbloqueados obtenidos', {
      unlockedModuleIds: unlockedIds,
      count: unlockedIds.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if the authenticated user can access a specific module.
 * GET /api/teaching/modules/:moduleId/access
 */
export const checkModuleAccessHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { moduleId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendSuccess(res, HTTP_STATUS.UNAUTHORIZED, 'Usuario no autenticado');
      return;
    }

    const hasAccess = await canAccessModuleService(userId, moduleId);

    sendSuccess(res, HTTP_STATUS.OK, 'Estado de acceso obtenido', {
      moduleId,
      hasAccess,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if the authenticated user can access a specific lesson.
 * GET /api/teaching/lessons/:lessonId/access
 */
export const checkLessonAccessHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendSuccess(res, HTTP_STATUS.UNAUTHORIZED, 'Usuario no autenticado');
      return;
    }

    const hasAccess = await canAccessLessonService(userId, lessonId);

    sendSuccess(res, HTTP_STATUS.OK, 'Estado de acceso obtenido', {
      lessonId,
      hasAccess,
    });
  } catch (error) {
    next(error);
  }
};
