/**
 * Lesson Routes
 * Defines all routes for lesson-related operations
 */

import { Router } from 'express';
import * as lessonsController from '../controllers/lessons.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  createLessonValidator,
  updateLessonValidator,
  idValidator,
  completeLessonValidator,
} from '../middleware/validators';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Public routes (no authentication required for basic access)
 */

// GET /api/lessons/:id - Get a single lesson by ID
router.get(
  '/:id',
  readLimiter,
  validateRequest(idValidator),
  lessonsController.getLessonById
);

// GET /api/lessons/:id/next - Get the next lesson in the module
router.get(
  '/:id/next',
  readLimiter,
  validateRequest(idValidator),
  lessonsController.getNextLesson
);

// GET /api/lessons/:id/previous - Get the previous lesson in the module
router.get(
  '/:id/previous',
  readLimiter,
  validateRequest(idValidator),
  lessonsController.getPreviousLesson
);

/**
 * Protected routes (authentication required)
 */

// POST /api/lessons/:id/complete - Mark a lesson as completed
router.post(
  '/:id/complete',
  writeLimiter,
  authenticate,
  validateRequest([...idValidator, ...completeLessonValidator]),
  lessonsController.markLessonComplete
);

// POST /api/lessons/:id/access - Record lesson access (for tracking)
router.post(
  '/:id/access',
  readLimiter,
  authenticate,
  validateRequest(idValidator),
  lessonsController.recordLessonAccess
);

/**
 * Admin/Instructor routes (role-based access)
 */

// POST /api/lessons - Create a new lesson
router.post(
  '/',
  writeLimiter,
  authenticate,
  requireRole('ADMIN', 'INSTRUCTOR'),
  validateRequest(createLessonValidator),
  lessonsController.createLesson
);

// PUT /api/lessons/:id - Update a lesson
router.put(
  '/:id',
  writeLimiter,
  authenticate,
  requireRole('ADMIN', 'INSTRUCTOR'),
  validateRequest([...idValidator, ...updateLessonValidator]),
  lessonsController.updateLesson
);

// DELETE /api/lessons/:id - Delete a lesson
router.delete(
  '/:id',
  writeLimiter,
  authenticate,
  requireRole('ADMIN'),
  validateRequest(idValidator),
  lessonsController.deleteLesson
);

export default router;

