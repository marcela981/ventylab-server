/**
 * Teaching Routes
 * Exposes teaching progression services + Notion-style CMS editor endpoints.
 *
 * All routes require authentication.
 *
 * --- Progression (any authenticated role) ---
 * POST /api/teaching/lessons/:lessonId/complete  - Complete a lesson
 * GET  /api/teaching/modules/unlocked             - List unlocked module IDs
 * GET  /api/teaching/modules/:moduleId/access     - Check module access
 * GET  /api/teaching/lessons/:lessonId/access     - Check lesson access
 *
 * --- Curriculum Editor (TEACHER / ADMIN only) ---
 * GET    /api/teaching/tree                       - Full recursive curriculum tree
 * POST   /api/teaching/node                       - Create level / sublevel / module
 * PUT    /api/teaching/node/:id?type=level|module - Update node
 * DELETE /api/teaching/node/:id?type=level|module - Delete node + descendants
 * GET    /api/teaching/lesson/:id/content         - Get lesson Notion blocks
 * PUT    /api/teaching/lesson/:id/content         - Save Notion blocks to lesson
 */

import { Router } from 'express';
import {
  completeLessonHandler,
  getUnlockedModulesHandler,
  checkModuleAccessHandler,
  checkLessonAccessHandler,
} from './teaching.controller';
import {
  getCurriculumTree,
  createNode,
  updateNode,
  deleteNode,
  getLessonContent,
  saveLessonContent,
} from './curriculum-editor.controller';
import { authenticate, requireTeacherPlus } from '../../shared/middleware/auth.middleware';
import { readLimiter, writeLimiter } from '../../shared/middleware/rate-limiter.middleware';

const router = Router();

// All teaching routes require authentication
router.use(authenticate);

// Lesson completion (creates LessonCompletion + recalculates UserProgress)
router.post(
  '/lessons/:lessonId/complete',
  writeLimiter,
  completeLessonHandler
);

// Module unlock queries
router.get(
  '/modules/unlocked',
  readLimiter,
  getUnlockedModulesHandler
);

router.get(
  '/modules/:moduleId/access',
  readLimiter,
  checkModuleAccessHandler
);

// Lesson sequential access check
router.get(
  '/lessons/:lessonId/access',
  readLimiter,
  checkLessonAccessHandler
);

// ============================================
// Curriculum Editor Routes (TEACHER / ADMIN)
// ============================================

// GET /api/teaching/tree  — recursive curriculum tree
router.get(
  '/tree',
  readLimiter,
  requireTeacherPlus,
  getCurriculumTree
);

// POST /api/teaching/node  — create level / sublevel / module
router.post(
  '/node',
  writeLimiter,
  requireTeacherPlus,
  createNode
);

// PUT /api/teaching/node/:id?type=level|module  — update node
router.put(
  '/node/:id',
  writeLimiter,
  requireTeacherPlus,
  updateNode
);

// DELETE /api/teaching/node/:id?type=level|module  — recursive delete
router.delete(
  '/node/:id',
  writeLimiter,
  requireTeacherPlus,
  deleteNode
);

// GET /api/teaching/lesson/:id/content  — get lesson blocks
router.get(
  '/lesson/:id/content',
  readLimiter,
  requireTeacherPlus,
  getLessonContent
);

// PUT /api/teaching/lesson/:id/content  — save Notion blocks
router.put(
  '/lesson/:id/content',
  writeLimiter,
  requireTeacherPlus,
  saveLessonContent
);

export default router;
