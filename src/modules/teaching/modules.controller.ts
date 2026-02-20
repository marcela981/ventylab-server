/**
 * Modules Controller
 * Handles HTTP requests for module-related operations
 */

import { Request, Response, NextFunction } from 'express';
import * as moduleService from './modules.service';
import { sendSuccess, sendCreated, sendPaginatedSuccess } from '../../shared/utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../config/constants';

// Extend Request to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Get all modules
 * GET /api/modules
 */
export const getAllModules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, difficulty, page, limit } = req.query;

    const result = await moduleService.getAllModules({
      category: category as string,
      difficulty: difficulty as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    sendPaginatedSuccess(
      res,
      result.modules,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      'Módulos obtenidos exitosamente'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get module by ID
 * GET /api/modules/:id
 */
export const getModuleById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const module = await moduleService.getModuleById(id, userId);

    sendSuccess(res, HTTP_STATUS.OK, 'Módulo obtenido exitosamente', module);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new module
 * POST /api/modules
 */
export const createModule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const moduleData = req.body;
    const userId = req.user?.id;

    const module = await moduleService.createModule(moduleData, userId);

    sendCreated(res, SUCCESS_MESSAGES.MODULE_CREATED, module);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a module
 * PUT /api/modules/:id
 */
export const updateModule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    const module = await moduleService.updateModule(id, updateData, userId);

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.MODULE_UPDATED, module);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a module
 * DELETE /api/modules/:id
 */
export const deleteModule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const message = await moduleService.deleteModule(id, userId);

    sendSuccess(res, HTTP_STATUS.OK, message);
  } catch (error) {
    next(error);
  }
};

/**
 * Get lessons of a module
 * GET /api/modules/:id/lessons
 */
export const getModuleLessons = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const lessons = await moduleService.getModuleLessons(id, userId);

    sendSuccess(res, HTTP_STATUS.OK, 'Lecciones obtenidas exitosamente', lessons);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user progress in a module
 * GET /api/modules/:id/progress
 */
export const getModuleProgress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendSuccess(res, HTTP_STATUS.OK, 'Usuario no autenticado', null);
      return;
    }

    const progress = await moduleService.getUserModuleProgress(userId, id);

    sendSuccess(res, HTTP_STATUS.OK, 'Progreso obtenido exitosamente', progress);
  } catch (error) {
    next(error);
  }
};

/**
 * Get resume point for a module
 * GET /api/modules/:id/resume
 */
export const getModuleResume = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: moduleId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendSuccess(res, HTTP_STATUS.UNAUTHORIZED, 'Usuario no autenticado');
    }

    const resumeData = await moduleService.getModuleResumePoint(userId, moduleId);

    sendSuccess(res, HTTP_STATUS.OK, 'Punto de reanudación obtenido', resumeData);
  } catch (error) {
    next(error);
  }
};

/**
 * Add a prerequisite to a module
 * POST /api/modules/:id/prerequisites
 */
export const addPrerequisite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { prerequisiteId } = req.body;

    const module = await moduleService.addPrerequisite(id, prerequisiteId);

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PREREQUISITE_ADDED, module);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a prerequisite from a module
 * DELETE /api/modules/:id/prerequisites/:prerequisiteId
 */
export const removePrerequisite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, prerequisiteId } = req.params;

    const message = await moduleService.removePrerequisite(id, prerequisiteId);

    sendSuccess(res, HTTP_STATUS.OK, message);
  } catch (error) {
    next(error);
  }
};

