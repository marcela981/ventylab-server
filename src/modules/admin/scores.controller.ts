/**
 * Scores Controller
 * REST API for teacher-assigned student grades.
 *
 * Routes (mounted at /api/scores):
 *   POST   /                                 – assign / update score
 *   DELETE /:id                              – delete a score
 *   GET    /students/:studentId              – all scores for a student (caller's scores only, unless ADMIN)
 *   GET    /my-scores                        – all scores given by the calling teacher
 *   GET    /my-scores/students/:studentId    – caller's scores for one student
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireTeacherPlus } from '../../shared/middleware/auth.middleware';
import type { ScoreEntityType } from './score.service';
import * as ScoreService from './score.service';

const VALID_ENTITY_TYPES: ScoreEntityType[] = ['MODULE', 'LESSON', 'QUIZ', 'CASE', 'CUSTOM'];

const router = Router();

router.use(authenticate);
router.use(requireTeacherPlus);

// ── Assign / update score ────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const { studentId, entityType, entityId, score, maxScore, notes } = req.body;

    if (!studentId || !entityType || !entityId || score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'studentId, entityType, entityId y score son requeridos',
      });
    }

    if (!VALID_ENTITY_TYPES.includes(entityType as ScoreEntityType)) {
      return res.status(400).json({ success: false, message: 'entityType inválido' });
    }

    const result = await ScoreService.upsertScore({
      graderId: req.user!.id,
      userId: studentId,
      entityType: entityType as ScoreEntityType,
      entityId,
      points: Number(score),
      maxPoints: maxScore !== undefined ? Number(maxScore) : 100,
      comments: notes,
    });

    res.status(200).json({ success: true, score: result });
  } catch (err: any) {
    const status = err.message.includes('no encontrado') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── Delete score ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await ScoreService.deleteScore(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Calificación eliminada' });
  } catch (err: any) {
    const status = err.message.includes('no encontrada') ? 404 : 403;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── Scores for a student ──────────────────────────────────────────────────────
// ADMIN sees all teachers' scores; TEACHER sees only their own
router.get('/students/:studentId', async (req: Request, res: Response) => {
  try {
    const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPERUSER';
    const graderFilter = isAdmin ? undefined : req.user!.id;
    const scores = await ScoreService.getStudentScores(req.params.studentId, graderFilter);
    res.json({ success: true, scores });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── All scores given by me ────────────────────────────────────────────────────
router.get('/my-scores', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.query;
    const scores = await ScoreService.getGraderScores(
      req.user!.id,
      studentId ? String(studentId) : undefined,
    );
    res.json({ success: true, scores });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
