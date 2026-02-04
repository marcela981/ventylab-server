/**
 * Content Override Controller
 * Handles HTTP requests for content override CRUD operations
 *
 * ACCESS RULES:
 * - POST /overrides: TEACHER+ (only for assigned students), ADMIN/SUPERUSER (any)
 * - GET /overrides: TEACHER+ (only assigned students), ADMIN/SUPERUSER (any)
 * - GET /overrides/:id: TEACHER+ (if assigned student), ADMIN/SUPERUSER
 * - PUT /overrides/:id: TEACHER+ (if assigned student), ADMIN/SUPERUSER
 * - DELETE /overrides/:id: TEACHER+ (if assigned student), ADMIN/SUPERUSER
 *
 * Note: Permission verification is done in the service layer using canManageOverridesFor()
 */

import { Request, Response, NextFunction } from 'express';
import * as overrideService from '../services/overrides';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants';
import type { OverrideEntityType } from '../config/constants';

// Extend Request to include authenticated user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
  };
}

/**
 * Create a new content override
 * POST /api/overrides
 *
 * Body: { studentId, entityType, entityId, overrideData }
 */
export const createOverride = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const { studentId, entityType, entityId, overrideData } = req.body;

    const override = await overrideService.createOverride(
      { studentId, entityType, entityId, overrideData },
      user.id,
      user.role
    );

    sendCreated(res, SUCCESS_MESSAGES.OVERRIDE_CREATED, override);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing override
 * PUT /api/overrides/:id
 *
 * Body: { overrideData?, isActive? }
 */
export const updateOverride = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const { id } = req.params;
    const { overrideData, isActive } = req.body;

    const override = await overrideService.updateOverride(
      id,
      { overrideData, isActive },
      user.id,
      user.role
    );

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.OVERRIDE_UPDATED, override);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an override (soft delete)
 * DELETE /api/overrides/:id
 */
export const deleteOverride = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const { id } = req.params;

    await overrideService.deleteOverride(id, user.id, user.role);

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.OVERRIDE_DELETED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get overrides for a student
 * GET /api/overrides?studentId=...&entityType=...&includeInactive=...
 *
 * Query params:
 * - studentId (required): ID of the student
 * - entityType (optional): Filter by entity type (LEVEL, LESSON, CARD)
 * - includeInactive (optional): Include soft-deleted overrides
 */
export const getOverrides = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const { studentId, entityType, includeInactive } = req.query;

    if (!studentId || typeof studentId !== 'string') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'studentId es requerido',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const overrides = await overrideService.getOverridesForStudent(
      studentId,
      user.id,
      user.role,
      {
        entityType: entityType as OverrideEntityType | undefined,
        includeInactive: includeInactive === 'true',
      }
    );

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.OVERRIDES_RETRIEVED, {
      studentId,
      count: overrides.length,
      overrides,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single override by ID
 * GET /api/overrides/:id
 */
export const getOverrideById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'No autenticado',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const { id } = req.params;

    const override = await overrideService.getOverrideById(id, user.id, user.role);

    sendSuccess(res, HTTP_STATUS.OK, 'Override obtenido exitosamente', override);
  } catch (error) {
    next(error);
  }
};
