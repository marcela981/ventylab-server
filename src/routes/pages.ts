/**
 * Pages Routes - Phase 1 Content Hierarchy
 *
 * Read-only endpoints for the new Page-based content system.
 * No authentication required for GET (matches existing lesson pattern).
 *
 * IMPORTANT: Specific routes (by-legacy-json, by-lesson) MUST come
 * before the generic /:id route to avoid matching as an id param.
 */

import { Router } from 'express';
import * as pagesController from '../controllers/pages.controller';
import { validateRequest } from '../middleware/validate';
import { idValidator } from '../middleware/validators';
import { readLimiter } from '../middleware/rateLimiter';

const router = Router();

// GET /api/pages/by-legacy-json/:legacyJsonId - Check migration status by JSON id
router.get(
  '/by-legacy-json/:legacyJsonId',
  readLimiter,
  pagesController.getPageByLegacyJsonId
);

// GET /api/pages/by-lesson/:lessonId - Coexistence resolver
router.get(
  '/by-lesson/:lessonId',
  readLimiter,
  pagesController.getContentForLesson
);

// GET /api/pages/by-module/:moduleId - List all published pages in a module
router.get(
  '/by-module/:moduleId',
  readLimiter,
  pagesController.getPagesByModuleId
);

// GET /api/pages/:id - Get a page with all sections (must be LAST)
router.get(
  '/:id',
  readLimiter,
  validateRequest(idValidator),
  pagesController.getPageById
);

export default router;
