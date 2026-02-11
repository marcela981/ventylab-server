/**
 * Pages Controller - Phase 1 Content Hierarchy
 *
 * Handles HTTP requests for the new Page-based content system.
 * Phase 1: Read-only (GET endpoints only).
 */

import { Request, Response, NextFunction } from 'express';
import * as pageService from '../services/pages';
import { sendSuccess } from '../utils/response';
import { HTTP_STATUS } from '../config/constants';

/**
 * GET /api/pages/:id
 * Returns a Page with all its active sections.
 */
export const getPageById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const page = await pageService.getPageById(id);
    sendSuccess(res, HTTP_STATUS.OK, 'Página obtenida exitosamente', page);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/pages/by-legacy-json/:legacyJsonId
 * Returns a Page by its original JSON file id.
 * Used by the frontend to check if a JSON lesson has been migrated.
 */
export const getPageByLegacyJsonId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { legacyJsonId } = req.params;
    const page = await pageService.getPageByLegacyJsonId(legacyJsonId);

    if (!page) {
      sendSuccess(res, HTTP_STATUS.OK, 'Página no migrada aún', {
        migrated: false,
        legacyJsonId,
      });
      return;
    }

    sendSuccess(res, HTTP_STATUS.OK, 'Página obtenida exitosamente', {
      migrated: true,
      page,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/pages/by-lesson/:lessonId
 * Coexistence resolver: checks if a Lesson has been migrated to a Page.
 * Returns the Page if migrated, or { source: 'lesson' } if not.
 */
export const getContentForLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lessonId } = req.params;
    const result = await pageService.getContentForLesson(lessonId);
    sendSuccess(res, HTTP_STATUS.OK, 'Contenido resuelto', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/modules/:moduleId/pages
 * Lists all published pages in a module.
 */
export const getPagesByModuleId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { moduleId } = req.params;
    const pages = await pageService.getPagesByModuleId(moduleId);
    sendSuccess(res, HTTP_STATUS.OK, 'Páginas del módulo obtenidas', pages);
  } catch (error) {
    next(error);
  }
};
