/**
 * Changelog Controller
 * Handles HTTP requests for audit trail operations
 *
 * RBAC:
 * - All endpoints require authentication
 * - Teachers: Can only see their own changes
 * - Admin/Superuser: Full access to all change history
 * - Students: NO access (403 Forbidden)
 */

import { Request, Response, NextFunction } from 'express';
import * as changelogService from './changelog.service';
import { HTTP_STATUS, USER_ROLES } from '../../config/constants';
import { AppError } from '../../shared/middleware/error-handler.middleware';

// ============================================
// Type Definitions
// ============================================

/** Valid entity types for changelog queries */
const VALID_ENTITY_TYPES = ['Level', 'Module', 'Lesson', 'Step'] as const;

/** Valid action types for changelog queries */
const VALID_ACTIONS = ['create', 'update', 'delete', 'reorder'] as const;

// ============================================
// Controller Functions
// ============================================

/**
 * Get changelog entries with filtering
 * GET /api/changelog
 *
 * Query params:
 * - entityType: Level | Module | Lesson | Step
 * - entityId: specific entity ID
 * - action: create | update | delete | reorder
 * - changedBy: user ID
 * - fromDate: ISO date string
 * - toDate: ISO date string
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 */
export const getChangelog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;

    // Students cannot access changelog
    if (user.role === USER_ROLES.STUDENT) {
      throw new AppError(
        'Acceso denegado',
        HTTP_STATUS.FORBIDDEN,
        'FORBIDDEN',
        true,
        ['Los estudiantes no tienen acceso al historial de cambios']
      );
    }

    // Parse and validate query parameters
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const action = req.query.action as string | undefined;
    const changedBy = req.query.changedBy as string | undefined;
    const fromDateStr = req.query.fromDate as string | undefined;
    const toDateStr = req.query.toDate as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Validate entityType if provided
    if (entityType && !VALID_ENTITY_TYPES.includes(entityType as any)) {
      throw new AppError(
        'Tipo de entidad no válido',
        HTTP_STATUS.BAD_REQUEST,
        'INVALID_INPUT',
        true,
        [`entityType debe ser uno de: ${VALID_ENTITY_TYPES.join(', ')}`]
      );
    }

    // Validate action if provided
    if (action && !VALID_ACTIONS.includes(action as any)) {
      throw new AppError(
        'Acción no válida',
        HTTP_STATUS.BAD_REQUEST,
        'INVALID_INPUT',
        true,
        [`action debe ser uno de: ${VALID_ACTIONS.join(', ')}`]
      );
    }

    // Parse dates
    const fromDate = fromDateStr ? new Date(fromDateStr) : undefined;
    const toDate = toDateStr ? new Date(toDateStr) : undefined;

    // Validate dates
    if (fromDate && isNaN(fromDate.getTime())) {
      throw new AppError(
        'Fecha de inicio no válida',
        HTTP_STATUS.BAD_REQUEST,
        'INVALID_INPUT',
        true,
        ['fromDate debe ser una fecha válida en formato ISO 8601']
      );
    }

    if (toDate && isNaN(toDate.getTime())) {
      throw new AppError(
        'Fecha de fin no válida',
        HTTP_STATUS.BAD_REQUEST,
        'INVALID_INPUT',
        true,
        ['toDate debe ser una fecha válida en formato ISO 8601']
      );
    }

    const result = await changelogService.getChangelog(
      {
        entityType: entityType as changelogService.ChangeLogEntityType | undefined,
        entityId,
        action: action as changelogService.ChangeLogAction | undefined,
        changedBy,
        fromDate,
        toDate,
        page,
        limit,
      },
      { id: user.id, role: user.role }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Historial de cambios obtenido exitosamente',
      data: result.logs,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent changes
 * GET /api/changelog/recent
 *
 * Query params:
 * - limit: number (default: 20, max: 100)
 */
export const getRecentChanges = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;

    // Students cannot access changelog
    if (user.role === USER_ROLES.STUDENT) {
      throw new AppError(
        'Acceso denegado',
        HTTP_STATUS.FORBIDDEN,
        'FORBIDDEN',
        true,
        ['Los estudiantes no tienen acceso al historial de cambios']
      );
    }

    const limit = parseInt(req.query.limit as string) || 20;

    const logs = await changelogService.getRecentChanges(limit, {
      id: user.id,
      role: user.role,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Cambios recientes obtenidos exitosamente',
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get history for a specific entity
 * GET /api/changelog/:entityType/:entityId
 */
export const getEntityHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { entityType, entityId } = req.params;

    // Students cannot access changelog
    if (user.role === USER_ROLES.STUDENT) {
      throw new AppError(
        'Acceso denegado',
        HTTP_STATUS.FORBIDDEN,
        'FORBIDDEN',
        true,
        ['Los estudiantes no tienen acceso al historial de cambios']
      );
    }

    // Validate entityType
    if (!VALID_ENTITY_TYPES.includes(entityType as any)) {
      throw new AppError(
        'Tipo de entidad no válido',
        HTTP_STATUS.BAD_REQUEST,
        'INVALID_INPUT',
        true,
        [`entityType debe ser uno de: ${VALID_ENTITY_TYPES.join(', ')}`]
      );
    }

    // Validate entityId
    if (!entityId || entityId.trim() === '') {
      throw new AppError(
        'ID de entidad requerido',
        HTTP_STATUS.BAD_REQUEST,
        'INVALID_INPUT',
        true,
        ['entityId es requerido']
      );
    }

    const logs = await changelogService.getEntityHistory(
      entityType as changelogService.ChangeLogEntityType,
      entityId,
      { id: user.id, role: user.role }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Historial de entidad obtenido exitosamente',
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get change statistics for a period
 * GET /api/changelog/stats
 *
 * Query params:
 * - fromDate: ISO date string (required)
 * - toDate: ISO date string (required)
 */
export const getChangeStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;

    // Students cannot access changelog
    if (user.role === USER_ROLES.STUDENT) {
      throw new AppError(
        'Acceso denegado',
        HTTP_STATUS.FORBIDDEN,
        'FORBIDDEN',
        true,
        ['Los estudiantes no tienen acceso al historial de cambios']
      );
    }

    const fromDateStr = req.query.fromDate as string;
    const toDateStr = req.query.toDate as string;

    if (!fromDateStr || !toDateStr) {
      throw new AppError(
        'Fechas requeridas',
        HTTP_STATUS.BAD_REQUEST,
        'INVALID_INPUT',
        true,
        ['fromDate y toDate son requeridos']
      );
    }

    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new AppError(
        'Fechas no válidas',
        HTTP_STATUS.BAD_REQUEST,
        'INVALID_INPUT',
        true,
        ['Las fechas deben estar en formato ISO 8601']
      );
    }

    const stats = await changelogService.getChangeStats(fromDate, toDate, {
      id: user.id,
      role: user.role,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Estadísticas de cambios obtenidas exitosamente',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
