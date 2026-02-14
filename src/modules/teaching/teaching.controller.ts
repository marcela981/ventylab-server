/**
 * Teaching Controller
 * Main entry point for teaching module routes.
 * Aggregates all teaching-related sub-routes.
 *
 * Sub-routes handled:
 * - /api/teaching/* - Teaching progression (unlock + completion)
 * - /api/progress/* - Progress tracking
 * - /api/curriculum/* - Curriculum structure
 * - /api/modules/* - Module CRUD
 * - /api/lessons/* - Lesson CRUD
 * - /api/levels/* - Level CRUD
 * - /api/cards/* - Step/Card CRUD
 * - /api/pages/* - Page hierarchy
 * - /api/overrides/* - Content overrides
 * - /api/teacher-students/* - Teacher-Student relationships
 * - /api/changelog/* - Change audit trail
 *
 * NOTE: Individual route files in src/routes/ still handle specific endpoints.
 * This controller serves as the module's main documentation and future
 * consolidation point.
 */

import { Router } from 'express';

// Re-export handler functions from existing controllers for module access
export { completeLessonHandler, getUnlockedModulesHandler, checkModuleAccessHandler, checkLessonAccessHandler } from '../../controllers/teaching.controller';

// Note: Full route consolidation will happen in Phase 7 (cleanup)
// For now, routes are registered individually in src/index.ts

const router = Router();

export default router;
