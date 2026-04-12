import { Router, Request, Response } from 'express';
import { authenticate, requireTeacherPlus } from '../../shared/middleware/auth.middleware';
import { readLimiter, writeLimiter } from '../../shared/middleware/rate-limiter.middleware';
import * as ActivitySubmissionService from './activity-submission.service';

const router = Router();

router.use(authenticate);

// ── Student: list my submissions ─────────────────────────────────────────────
router.get('/my', readLimiter, async (req: Request, res: Response) => {
  try {
    const submissions = await ActivitySubmissionService.getStudentSubmissions(req.user!.id);
    return res.json({ success: true, submissions });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ── Get submission by id (student owner or TEACHER+) ────────────────────────
router.get('/:id', readLimiter, async (req: Request, res: Response) => {
  try {
    const submission = await ActivitySubmissionService.getSubmissionById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, message: 'Entrega no encontrada' });

    if (req.user!.role === 'STUDENT' && submission.userId !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    return res.json({ success: true, submission });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ── Student: init/get submission for activity ───────────────────────────────
router.post('/', writeLimiter, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Solo estudiantes pueden crear entregas' });
    }
    const { activityId } = req.body;
    if (!activityId) return res.status(400).json({ success: false, message: 'activityId es requerido' });
    const submission = await ActivitySubmissionService.getOrCreateSubmission(String(activityId), req.user!.id);
    return res.status(201).json({ success: true, submission });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ── Student: save draft ─────────────────────────────────────────────────────
router.put('/:id', writeLimiter, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Solo estudiantes pueden editar entregas' });
    }
    const { content } = req.body;
    const submission = await ActivitySubmissionService.saveSubmissionDraft(req.params.id, req.user!.id, content);
    return res.json({ success: true, submission });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ── Student: submit ─────────────────────────────────────────────────────────
router.post('/:id/submit', writeLimiter, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Solo estudiantes pueden enviar entregas' });
    }
    const submission = await ActivitySubmissionService.submitActivity(req.params.id, req.user!.id);
    return res.json({ success: true, submission });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ── Teacher: grade ──────────────────────────────────────────────────────────
router.put('/:id/grade', writeLimiter, requireTeacherPlus, async (req: Request, res: Response) => {
  try {
    const { score, feedback } = req.body;
    if (score === undefined) return res.status(400).json({ success: false, message: 'score es requerido' });
    const submission = await ActivitySubmissionService.gradeSubmission(req.params.id, req.user!.id, Number(score), feedback);
    return res.json({ success: true, submission });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;

