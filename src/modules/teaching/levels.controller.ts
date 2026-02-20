/**
 * Levels Controller
 * Handles HTTP requests for level-related operations
 *
 * RBAC:
 * - GET endpoints: Public (no auth required)
 * - GET /roadmap, /unlock-status: Authenticated (any role)
 * - POST/PUT endpoints: TEACHER+ (TEACHER, ADMIN, SUPERUSER)
 * - DELETE endpoints: ADMIN+ (ADMIN, SUPERUSER)
 */

import { Request, Response, NextFunction } from 'express';
import * as levelService from './levels.service';
import * as levelPrerequisiteService from './levelPrerequisites.service';
import * as roadmapService from './roadmap.service';
import { sendSuccess, sendCreated, sendPaginatedSuccess } from '../../shared/utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../config/constants';
import { AppError } from '../../shared/middleware/error-handler.middleware';

/**
 * Get all levels
 * GET /api/levels
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - includeInactive: Include inactive levels (admin only)
 */
export const getAllLevels = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const includeInactive = req.query.includeInactive === 'true';

    const result = await levelService.getAllLevels({
      page,
      limit,
      includeInactive,
    });

    sendPaginatedSuccess(
      res,
      result.levels,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      'Niveles obtenidos exitosamente'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get level by ID
 * GET /api/levels/:id
 */
export const getLevelById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const level = await levelService.getLevelById(id);

    sendSuccess(res, HTTP_STATUS.OK, 'Nivel obtenido exitosamente', level);
  } catch (error) {
    next(error);
  }
};

/**
 * Get modules for a level
 * GET /api/levels/:id/modules
 *
 * Query params:
 * - includeInactive: Include inactive modules (admin only)
 */
export const getLevelModules = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const includeInactive = req.query.includeInactive === 'true';

    const modules = await levelService.getLevelModules(id, includeInactive);

    sendSuccess(res, HTTP_STATUS.OK, 'Módulos del nivel obtenidos exitosamente', modules);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new level
 * POST /api/levels
 *
 * Body:
 * - title: string (required)
 * - description: string (optional)
 * - order: number (optional, auto-assigned if not provided)
 */
export const createLevel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const levelData = req.body;
    const userId = req.user?.id;

    const level = await levelService.createLevel(levelData, userId);

    sendCreated(res, SUCCESS_MESSAGES.LEVEL_CREATED, level);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a level
 * PUT /api/levels/:id
 *
 * Body (all optional):
 * - title: string
 * - description: string
 * - order: number
 * - isActive: boolean
 */
export const updateLevel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    const level = await levelService.updateLevel(id, updateData, userId);

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LEVEL_UPDATED, level);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a level (soft delete)
 * DELETE /api/levels/:id
 *
 * Query params:
 * - forceDeactivate: Deactivate even if level has modules (default: false)
 */
export const deleteLevel = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const forceDeactivate = req.query.forceDeactivate === 'true';
    const userId = req.user?.id;

    const message = await levelService.deleteLevel(id, forceDeactivate, userId);

    sendSuccess(res, HTTP_STATUS.OK, message);
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder levels
 * PUT /api/levels/reorder
 *
 * Body:
 * - levelIds: string[] (array of level IDs in desired order)
 */
export const reorderLevels = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { levelIds } = req.body;
    const userId = req.user?.id;

    const levels = await levelService.reorderLevels(levelIds, userId);

    sendSuccess(res, HTTP_STATUS.OK, 'Niveles reordenados exitosamente', levels);
  } catch (error) {
    next(error);
  }
};

// ============================================
// Roadmap Endpoints (Authenticated)
// ============================================

/**
 * Get user's personalized roadmap
 * GET /api/levels/roadmap
 *
 * Returns all levels with unlock status and progress for the authenticated user.
 * Requires authentication (any role).
 */
export const getUserRoadmap = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(
        'Usuario no autenticado',
        HTTP_STATUS.UNAUTHORIZED,
        'UNAUTHORIZED'
      );
    }

    const roadmap = await roadmapService.getUserRoadmap(userId);

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.ROADMAP_RETRIEVED, roadmap);
  } catch (error) {
    next(error);
  }
};

/**
 * Get unlock status for a specific level
 * GET /api/levels/:id/unlock-status
 *
 * Returns detailed unlock status including prerequisite progress.
 * Requires authentication (any role).
 */
export const getLevelUnlockStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(
        'Usuario no autenticado',
        HTTP_STATUS.UNAUTHORIZED,
        'UNAUTHORIZED'
      );
    }

    const status = await roadmapService.getLevelUnlockStatus(userId, id);

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LEVEL_UNLOCK_STATUS_RETRIEVED, status);
  } catch (error) {
    next(error);
  }
};

// ============================================
// Prerequisite Management Endpoints (TEACHER+)
// ============================================

/**
 * Add a prerequisite to a level
 * POST /api/levels/:id/prerequisites
 *
 * Body:
 * - prerequisiteLevelId: string (required) - Level that must be completed first
 *
 * VALIDATION:
 * - Cannot add itself as prerequisite
 * - Cannot create circular dependencies
 * - Cannot duplicate existing prerequisites
 */
export const addPrerequisite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { prerequisiteLevelId } = req.body;
    const userId = req.user?.id;

    const level = await levelPrerequisiteService.addLevelPrerequisite(
      id,
      prerequisiteLevelId,
      userId
    );

    // Invalidate roadmap cache for all users (prerequisite changes affect everyone)
    roadmapService.invalidateAllRoadmapCache();

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.LEVEL_PREREQUISITE_ADDED, level);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a prerequisite from a level
 * DELETE /api/levels/:id/prerequisites/:prereqId
 */
export const removePrerequisite = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, prereqId } = req.params;
    const userId = req.user?.id;

    const message = await levelPrerequisiteService.removeLevelPrerequisite(
      id,
      prereqId,
      userId
    );

    // Invalidate roadmap cache for all users
    roadmapService.invalidateAllRoadmapCache();

    sendSuccess(res, HTTP_STATUS.OK, message);
  } catch (error) {
    next(error);
  }
};

// ============================================
// Prerequisite Validation Endpoints (ADMIN+)
// ============================================

/**
 * Check if a level can be safely deleted
 * GET /api/levels/:id/can-delete
 *
 * Returns:
 * - canDelete: boolean
 * - reason: string (if canDelete is false)
 * - dependentLevels: string[] (titles of levels that depend on this one)
 * - hasStudentProgress: boolean (if students have progress in this level)
 */
export const checkCanDelete = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await levelPrerequisiteService.canDeleteLevel(id);

    sendSuccess(res, HTTP_STATUS.OK, 'Verificación completada', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get level with full prerequisite information
 * GET /api/levels/:id/prerequisites
 *
 * Returns level with:
 * - prerequisites: Levels that must be completed before this one
 * - dependentLevels: Levels that depend on this one
 */
export const getLevelPrerequisites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const level = await levelPrerequisiteService.getLevelWithPrerequisites(id);

    sendSuccess(res, HTTP_STATUS.OK, 'Prerequisitos obtenidos exitosamente', {
      levelId: level.id,
      levelTitle: level.title,
      prerequisites: level.prerequisites.map((p) => ({
        id: p.id,
        levelId: p.prerequisiteLevel.id,
        levelTitle: p.prerequisiteLevel.title,
        order: p.prerequisiteLevel.order,
        isActive: p.prerequisiteLevel.isActive,
      })),
      dependentLevels: level.dependentLevels.map((d) => ({
        id: d.id,
        levelId: d.level.id,
        levelTitle: d.level.title,
        order: d.level.order,
      })),
    });
  } catch (error) {
    next(error);
  }
};
