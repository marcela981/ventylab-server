/**
 * Lessons Controller
 * Handles HTTP requests for lesson-related operations
 */

import { Request, Response, NextFunction } from 'express';
import * as lessonService from '../services/lessons';
import { sendSuccess, sendCreated } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants';

// Extend Request to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Get lesson by ID
 * GET /api/lessons/:id
 */
export const getLessonById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const lesson = await lessonService.getLessonById(id, userId);

    sendSuccess(res, HTTP_STATUS.OK, 'Lección obtenida exitosamente', lesson);
  } catch (error) {
    next(error);
  }
};

/**
 * Get next lesson
 * GET /api/lessons/:id/next
 */
export const getNextLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const nextLesson = await lessonService.getNextLesson(id);

    sendSuccess(
      res,
      HTTP_STATUS.OK,
      nextLesson ? 'Siguiente lección obtenida' : 'No hay más lecciones',
      nextLesson
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get previous lesson
 * GET /api/lessons/:id/previous
 */
export const getPreviousLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const previousLesson = await lessonService.getPreviousLesson(id);

    sendSuccess(
      res,
      HTTP_STATUS.OK,
      previousLesson ? 'Lección anterior obtenida' : 'No hay lección anterior',
      previousLesson
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new lesson
 * POST /api/lessons
 */
export const createLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lessonData = req.body;

    const lesson = await lessonService.createLesson(lessonData);

    sendCreated(res, SUCCESS_MESSAGES.LESSON_CREATED, lesson);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a lesson
 * PUT /api/lessons/:id
 */
export const updateLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const lesson = await lessonService.updateLesson(id, updateData);

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LESSON_UPDATED, lesson);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a lesson
 * DELETE /api/lessons/:id
 */
export const deleteLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await lessonService.deleteLesson(id);

    sendSuccess(res, HTTP_STATUS.OK, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark lesson as completed
 * POST /api/lessons/:id/complete
 */
export const markLessonComplete = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { timeSpent } = req.body;

    if (!userId) {
      sendSuccess(res, HTTP_STATUS.UNAUTHORIZED, 'Usuario no autenticado');
      return;
    }

    const result = await lessonService.markLessonAsCompleted(userId, id, timeSpent || 0);

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LESSON_COMPLETED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Record lesson access (for tracking without completing)
 * POST /api/lessons/:id/access
 */
export const recordLessonAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendSuccess(res, HTTP_STATUS.UNAUTHORIZED, 'Usuario no autenticado');
      return;
    }

    const progress = await lessonService.recordLessonAccess(userId, id);

    sendSuccess(res, HTTP_STATUS.OK, 'Acceso registrado', progress);
  } catch (error) {
    next(error);
  }
};

