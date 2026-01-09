/**
 * Module Routes
 * Defines all routes for module-related operations
 */

import { Router } from 'express';
import * as modulesController from '../controllers/modules.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  createModuleValidator,
  updateModuleValidator,
  idValidator,
  paginationValidator,
  prerequisiteValidator,
} from '../middleware/validators';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Public routes (no authentication required)
 */

// GET /api/modules - List all modules with filtering and pagination
router.get(
  '/',
  readLimiter,
  validateRequest(paginationValidator),
  modulesController.getAllModules
);

// GET /api/modules/:id - Get a single module by ID
router.get(
  '/:id',
  readLimiter,
  validateRequest(idValidator),
  modulesController.getModuleById
);

// GET /api/modules/:id/lessons - Get all lessons of a module
router.get(
  '/:id/lessons',
  readLimiter,
  validateRequest(idValidator),
  modulesController.getModuleLessons
);

/**
 * Protected routes (authentication required)
 */

// GET /api/modules/:id/progress - Get user progress in a module
router.get(
  '/:id/progress',
  readLimiter,
  authenticate,
  validateRequest(idValidator),
  modulesController.getModuleProgress
);

/**
 * Admin/Instructor routes (role-based access)
 */

// POST /api/modules - Create a new module
router.post(
  '/',
  writeLimiter,
  authenticate,
  requireRole('ADMIN', 'INSTRUCTOR'),
  validateRequest(createModuleValidator),
  modulesController.createModule
);

// PUT /api/modules/:id - Update a module
router.put(
  '/:id',
  writeLimiter,
  authenticate,
  requireRole('ADMIN', 'INSTRUCTOR'),
  validateRequest([...idValidator, ...updateModuleValidator]),
  modulesController.updateModule
);

// DELETE /api/modules/:id - Delete a module (soft delete)
router.delete(
  '/:id',
  writeLimiter,
  authenticate,
  requireRole('ADMIN'),
  validateRequest(idValidator),
  modulesController.deleteModule
);

// POST /api/modules/:id/prerequisites - Add a prerequisite
router.post(
  '/:id/prerequisites',
  writeLimiter,
  authenticate,
  requireRole('ADMIN', 'INSTRUCTOR'),
  validateRequest([...idValidator, ...prerequisiteValidator]),
  modulesController.addPrerequisite
);

// DELETE /api/modules/:id/prerequisites/:prerequisiteId - Remove a prerequisite
router.delete(
  '/:id/prerequisites/:prerequisiteId',
  writeLimiter,
  authenticate,
  requireRole('ADMIN', 'INSTRUCTOR'),
  modulesController.removePrerequisite
);

export default router;

