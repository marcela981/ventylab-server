/**
 * Card (Step) Routes
 * Defines all routes for step/card-related operations
 *
 * NOTE: Uses "/api/cards" as per requirement spec, but internally
 * these are "steps" - atomic content units within lessons.
 *
 * RBAC ACCESS:
 * - GET endpoints: Public (students can read active content)
 * - POST/PUT endpoints: TEACHER, ADMIN, SUPERUSER
 * - DELETE endpoints: ADMIN, SUPERUSER only
 *
 * ROUTE STRUCTURE:
 * - GET    /api/cards              - List all cards (with ?lessonId filter)
 * - GET    /api/cards/:id          - Get single card
 * - GET    /api/cards/:id/next     - Get next card in lesson
 * - GET    /api/cards/:id/previous - Get previous card in lesson
 * - POST   /api/cards              - Create card (TEACHER+)
 * - PUT    /api/cards/:id          - Update card (TEACHER+)
 * - PUT    /api/cards/reorder      - Reorder cards (TEACHER+)
 * - DELETE /api/cards/:id          - Delete card (ADMIN+)
 */

import { Router } from 'express';
import * as stepsController from './steps.controller';
import { authenticate, requireAdmin, requireTeacherPlus } from '../../shared/middleware/auth.middleware';
import { validateRequest } from '../../shared/middleware/validator.middleware';
import {
  createStepValidator,
  updateStepValidator,
  reorderStepsValidator,
  idValidator,
  paginationValidator,
  lessonIdQueryValidator,
} from '../../shared/middleware/validators';
import { readLimiter, writeLimiter } from '../../shared/middleware/rate-limiter.middleware';

const router = Router();

// ============================================
// Public Routes (No authentication required)
// ============================================
// Students can read active card content

// GET /api/cards - List all cards with optional lesson filter
router.get(
  '/',
  readLimiter,
  validateRequest([...paginationValidator, ...lessonIdQueryValidator]),
  stepsController.getAllSteps
);

// GET /api/cards/:id - Get a single card by ID
router.get(
  '/:id',
  readLimiter,
  validateRequest(idValidator),
  stepsController.getStepById
);

// GET /api/cards/:id/next - Get the next card in the lesson
router.get(
  '/:id/next',
  readLimiter,
  validateRequest(idValidator),
  stepsController.getNextStep
);

// GET /api/cards/:id/previous - Get the previous card in the lesson
router.get(
  '/:id/previous',
  readLimiter,
  validateRequest(idValidator),
  stepsController.getPreviousStep
);

// ============================================
// Teacher/Admin Routes (Role-based access)
// ============================================
// Note: SUPERUSER has implicit access via requireRole middleware

// PUT /api/cards/reorder - Reorder cards within a lesson (must come before /:id)
router.put(
  '/reorder',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  validateRequest(reorderStepsValidator),
  stepsController.reorderSteps
);

// POST /api/cards - Create a new card
router.post(
  '/',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  validateRequest(createStepValidator),
  stepsController.createStep
);

// PUT /api/cards/:id - Update a card
router.put(
  '/:id',
  writeLimiter,
  authenticate,
  requireTeacherPlus,  // TEACHER, ADMIN (SUPERUSER implicit)
  validateRequest([...idValidator, ...updateStepValidator]),
  stepsController.updateStep
);

// ============================================
// Admin Routes (Strict role access)
// ============================================

// DELETE /api/cards/:id - Delete a card (soft delete)
router.delete(
  '/:id',
  writeLimiter,
  authenticate,
  requireAdmin,  // ADMIN only (SUPERUSER implicit)
  validateRequest(idValidator),
  stepsController.deleteStep
);

export default router;
