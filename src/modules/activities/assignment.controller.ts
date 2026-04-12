import { Router, Request, Response } from 'express';
import { authenticate, requireTeacherPlus } from '../../shared/middleware/auth.middleware';
import { readLimiter, writeLimiter } from '../../shared/middleware/rate-limiter.middleware';
import * as ActivityAssignmentService from './activity-assignment.service';

const router = Router();

router.use(authenticate);
router.use(requireTeacherPlus);

// List assignments for a given activity (query param activityId)
router.get('/', readLimiter, async (req: Request, res: Response) => {
  try {
    const { activityId } = req.query;
    if (!activityId) return res.status(400).json({ success: false, message: 'activityId es requerido' });
    const assignments = await ActivityAssignmentService.getAssignmentsForActivity(String(activityId));
    return res.json({ success: true, assignments });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Assign/update an activity to a group
router.post('/', writeLimiter, async (req: Request, res: Response) => {
  try {
    const { activityId, groupId, visibleFrom, dueDate, isActive } = req.body;
    if (!activityId || !groupId) return res.status(400).json({ success: false, message: 'activityId y groupId son requeridos' });
    const assignment = await ActivityAssignmentService.assignActivityToGroup(
      { activityId, groupId, visibleFrom, dueDate, isActive },
      req.user!.id,
      { allowAny: req.user!.role === 'ADMIN' || req.user!.role === 'SUPERUSER' }
    );
    return res.status(201).json({ success: true, assignment });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// Remove (soft) assignment
router.delete('/:id', writeLimiter, async (req: Request, res: Response) => {
  try {
    const assignment = await ActivityAssignmentService.removeAssignment(req.params.id, req.user!.id, {
      allowAny: req.user!.role === 'ADMIN' || req.user!.role === 'SUPERUSER',
    });
    return res.json({ success: true, assignment });
  } catch (err: any) {
    const status = err.message.includes('no encontrada') ? 404 : 400;
    return res.status(status).json({ success: false, message: err.message });
  }
});

export default router;

