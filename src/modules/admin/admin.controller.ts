/**
 * Admin Controller
 * Handles admin dashboard endpoints
 * TODO: Implement API endpoints in Phase 5
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin, requireTeacherPlus } from '../../shared/middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireTeacherPlus);

// GET /api/admin/students - List students
router.get('/students', async (req: Request, res: Response) => {
  // TODO: Implement using AdminService
  res.status(501).json({ message: 'Not implemented yet' });
});

// GET /api/admin/students/:id/progress - Get student progress
router.get('/students/:id/progress', async (req: Request, res: Response) => {
  // TODO: Implement
  res.status(501).json({ message: 'Not implemented yet' });
});

// GET /api/admin/statistics - Get platform statistics
router.get('/statistics', requireAdmin, async (req: Request, res: Response) => {
  // TODO: Implement using AnalyticsService
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
