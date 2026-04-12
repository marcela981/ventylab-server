import { Router, Request, Response } from 'express';
import { authenticate, requireTeacherPlus } from '../../shared/middleware/auth.middleware';
import { readLimiter, writeLimiter } from '../../shared/middleware/rate-limiter.middleware';
import * as ActivityService from './activity.service';
import * as ActivityAssignmentService from './activity-assignment.service';
import * as ActivitySubmissionService from './activity-submission.service';

const router = Router();

router.use(authenticate);

// ── List activities (role-aware) ──────────────────────────────────────────────
router.get('/', readLimiter, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'STUDENT') {
      const activities = await ActivityAssignmentService.getActivitiesForStudent(user.id);
      return res.json({ success: true, activities });
    }

    // TEACHER+ : list own created activities
    const activities = await ActivityService.listActivitiesForTeacher(user.id);
    return res.json({ success: true, activities });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ── Create activity (TEACHER+) ───────────────────────────────────────────────
router.post('/', writeLimiter, requireTeacherPlus, async (req: Request, res: Response) => {
  try {
    const activity = await ActivityService.createActivity(req.body, req.user!.id);
    return res.status(201).json({ success: true, activity });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ── Get activity detail ──────────────────────────────────────────────────────
router.get('/:id', readLimiter, async (req: Request, res: Response) => {
  try {
    const activity = await ActivityService.getActivityById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Actividad no encontrada' });

    // If student: ensure activity is visible through an assignment
    if (req.user!.role === 'STUDENT') {
      const my = await ActivityAssignmentService.getActivitiesForStudent(req.user!.id);
      const allowed = my.some((a: any) => a.id === activity.id);
      if (!allowed) return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    return res.json({ success: true, activity });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ── Update activity (TEACHER+) ───────────────────────────────────────────────
router.put('/:id', writeLimiter, requireTeacherPlus, async (req: Request, res: Response) => {
  try {
    const allowAny = req.user!.role === 'ADMIN' || req.user!.role === 'SUPERUSER';
    const activity = await ActivityService.updateActivity(req.params.id, req.body, req.user!.id, { allowAny });
    return res.json({ success: true, activity });
  } catch (err: any) {
    const status = err.message.includes('no encontrada') ? 404 : 400;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// ── Soft delete activity (TEACHER+) ──────────────────────────────────────────
router.delete('/:id', writeLimiter, requireTeacherPlus, async (req: Request, res: Response) => {
  try {
    const allowAny = req.user!.role === 'ADMIN' || req.user!.role === 'SUPERUSER';
    const activity = await ActivityService.deleteActivity(req.params.id, req.user!.id, { allowAny });
    return res.json({ success: true, activity });
  } catch (err: any) {
    const status = err.message.includes('no encontrada') ? 404 : 400;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// ── Publish activity (TEACHER+) ──────────────────────────────────────────────
router.post('/:id/publish', writeLimiter, requireTeacherPlus, async (req: Request, res: Response) => {
  try {
    const allowAny = req.user!.role === 'ADMIN' || req.user!.role === 'SUPERUSER';
    const activity = await ActivityService.publishActivity(req.params.id, req.user!.id, { allowAny });
    return res.json({ success: true, activity });
  } catch (err: any) {
    const status = err.message.includes('no encontrada') ? 404 : 400;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// ── Submissions for an activity (TEACHER+) ───────────────────────────────────
router.get('/:id/submissions', readLimiter, requireTeacherPlus, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.query;
    const submissions = await ActivitySubmissionService.getSubmissionsForActivity(req.params.id, groupId ? String(groupId) : undefined);
    return res.json({ success: true, submissions });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

