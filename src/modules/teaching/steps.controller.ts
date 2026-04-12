/**
 * Steps (Cards) Controller
 * Handles HTTP requests for step/card-related operations
 *
 * RBAC:
 * - GET endpoints: Public (no auth required)
 * - POST/PUT endpoints: TEACHER+ (TEACHER, ADMIN, SUPERUSER)
 * - DELETE endpoints: ADMIN+ (ADMIN, SUPERUSER)
 *
 * NOTE: Routes use "/api/cards" for API consistency with the requirement spec
 */

import { Request, Response, NextFunction } from 'express';
import * as stepService from './steps.service';
import { sendSuccess, sendCreated, sendPaginatedSuccess } from '../../shared/utils/response';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../config/constants';

/**
 * Get all steps with optional filtering
 * GET /api/cards
 *
 * Query params:
 * - lessonId: Filter by lesson (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - includeInactive: Include inactive steps (admin only)
 */
export const getAllSteps = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lessonId = req.query.lessonId as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const includeInactive = req.query.includeInactive === 'true';

    const result = await stepService.getAllSteps({
      lessonId,
      page,
      limit,
      includeInactive,
    });

    sendPaginatedSuccess(
      res,
      result.steps,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      'Pasos obtenidos exitosamente'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get step by ID
 * GET /api/cards/:id
 */
export const getStepById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const step = await stepService.getStepById(id);

    sendSuccess(res, HTTP_STATUS.OK, 'Paso obtenido exitosamente', step);
  } catch (error) {
    next(error);
  }
};

/**
 * Get steps by lesson ID
 * GET /api/lessons/:id/steps
 *
 * Query params:
 * - includeInactive: Include inactive steps (admin only)
 *
 * NOTE: Supports both :id and :lessonId param names for flexibility
 */
export const getStepsByLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Support both :id and :lessonId param names
    const lessonId = req.params.lessonId || req.params.id;
    const includeInactive = req.query.includeInactive === 'true';

    const steps = await stepService.getStepsByLessonId(lessonId, includeInactive);

    sendSuccess(res, HTTP_STATUS.OK, 'Pasos de la lección obtenidos exitosamente', steps);
  } catch (error) {
    next(error);
  }
};

/**
 * Get next step
 * GET /api/cards/:id/next
 */
export const getNextStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const nextStep = await stepService.getNextStep(id);

    sendSuccess(
      res,
      HTTP_STATUS.OK,
      nextStep ? 'Siguiente paso obtenido' : 'No hay más pasos',
      nextStep
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get previous step
 * GET /api/cards/:id/previous
 */
export const getPreviousStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const previousStep = await stepService.getPreviousStep(id);

    sendSuccess(
      res,
      HTTP_STATUS.OK,
      previousStep ? 'Paso anterior obtenido' : 'No hay paso anterior',
      previousStep
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new step
 * POST /api/cards
 *
 * Body:
 * - lessonId: string (required)
 * - title: string (optional)
 * - content: string (required)
 * - contentType: string (optional, default: "text")
 * - order: number (optional, auto-assigned if not provided)
 */
export const createStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stepData = req.body;
    const userId = req.user?.id;

    const step = await stepService.createStep(stepData, userId);

    sendCreated(res, SUCCESS_MESSAGES.STEP_CREATED, step);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a step
 * PUT /api/cards/:id
 *
 * Body (all optional):
 * - title: string
 * - content: string
 * - contentType: string
 * - order: number
 * - isActive: boolean
 */
export const updateStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    const step = await stepService.updateStep(id, updateData, userId);

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STEP_UPDATED, step);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a step (soft delete)
 * DELETE /api/cards/:id
 */
export const deleteStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const message = await stepService.deleteStep(id, userId);

    sendSuccess(res, HTTP_STATUS.OK, message);
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder steps within a lesson
 * PUT /api/cards/reorder
 *
 * Body:
 * - lessonId: string (required)
 * - stepIds: string[] (array of step IDs in desired order)
 */
export const reorderSteps = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lessonId, stepIds } = req.body;
    const userId = req.user?.id;

    const steps = await stepService.reorderSteps(lessonId, stepIds, userId);

    sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STEPS_REORDERED, steps);
  } catch (error) {
    next(error);
  }
};
