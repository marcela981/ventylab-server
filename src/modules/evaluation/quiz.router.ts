/**
 * quiz.router.ts
 * ==============
 * Express router for quiz and activity (exam/taller) endpoints.
 *
 * Routes mounted at /api/evaluation by src/index.ts:
 *
 *   GET  /api/evaluation/quizzes               ?moduleId=X
 *   GET  /api/evaluation/quizzes/:quizId
 *   POST /api/evaluation/quizzes/:quizId/attempt
 *   GET  /api/evaluation/activities/:id
 *   GET  /api/evaluation/activities            ?type=EXAM|TALLER
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { readLimiter, writeLimiter } from '../../shared/middleware/rate-limiter.middleware';
import { prisma } from '../../shared/infrastructure/database';
import * as QuizService from './quiz.service';

const router = Router();
router.use(authenticate);

// ─── GET /api/evaluation/quizzes/my-attempts ─────────────────────────────────
// Must be declared BEFORE /quizzes/:quizId to avoid route shadowing

router.get('/quizzes/my-attempts', readLimiter, async (req: Request, res: Response) => {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        quizId: true,
        score: true,
        passed: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
    });
    return res.json({ success: true, attempts });
  } catch (err: any) {
    console.error('[GET /quizzes/my-attempts]', err.message);
    return res.status(500).json({ success: false, message: 'Error al obtener intentos' });
  }
});

// ─── GET /api/evaluation/quizzes?moduleId=X ───────────────────────────────────
// moduleId is optional — omit to get all active quizzes

router.get('/quizzes', readLimiter, async (req: Request, res: Response) => {
  try {
    const moduleId = typeof req.query.moduleId === 'string' ? req.query.moduleId : undefined;

    const data = moduleId
      ? await QuizService.getQuizzesByModule(moduleId)
      : await QuizService.getAllQuizzes();

    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('[GET /quizzes]', err.message);
    return res.status(500).json({ success: false, message: 'Error al obtener quizzes' });
  }
});

// ─── GET /api/evaluation/quizzes/:quizId ─────────────────────────────────────

router.get('/quizzes/:quizId', readLimiter, async (req: Request, res: Response) => {
  try {
    const quiz = await QuizService.getQuizById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz no encontrado' });
    }

    if (!quiz.isActive) {
      return res.status(403).json({ success: false, message: 'Quiz inactivo' });
    }

    return res.json({ success: true, data: quiz });
  } catch (err: any) {
    console.error('[GET /quizzes/:id]', err.message);
    return res.status(500).json({ success: false, message: 'Error al obtener quiz' });
  }
});

// ─── GET /api/evaluation/quizzes/:quizId/my-attempt ──────────────────────────

router.get('/quizzes/:quizId/my-attempt', readLimiter, async (req: Request, res: Response) => {
  try {
    const attempt = await prisma.quizAttempt.findFirst({
      where: { quizId: req.params.quizId, userId: req.user!.id },
      orderBy: { completedAt: 'desc' },
      select: { id: true, quizId: true, score: true, passed: true, completedAt: true },
    });
    return res.json({ success: true, attempt: attempt ?? null });
  } catch (err: any) {
    console.error('[GET /quizzes/:quizId/my-attempt]', err.message);
    return res.status(500).json({ success: false, message: 'Error al obtener intento' });
  }
});

// ─── POST /api/evaluation/quizzes/:quizId/attempt ────────────────────────────

router.post('/quizzes/:quizId/attempt', writeLimiter, async (req: Request, res: Response) => {
  try {
    const userId  = req.user!.id;
    const quizId  = req.params.quizId;
    const answers = req.body?.answers;

    // One-attempt policy
    const existing = await prisma.quizAttempt.findFirst({ where: { quizId, userId } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Ya completaste este quiz. Contacta a tu docente para repetirlo.',
        attempt: { id: existing.id, score: existing.score, passed: existing.passed, completedAt: existing.completedAt },
      });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el campo answers (array)',
      });
    }

    // Basic shape validation
    for (const a of answers) {
      if (typeof a.questionId !== 'string' || typeof a.selectedOptionId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Cada respuesta debe tener questionId y selectedOptionId (string)',
        });
      }
    }

    const result = await QuizService.gradeQuizAttempt(userId, quizId, answers);

    return res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    if (err.message?.startsWith('Quiz not found')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    console.error('[POST /quizzes/:id/attempt]', err.message);
    return res.status(500).json({ success: false, message: 'Error al procesar intento' });
  }
});

// ─── GET /api/evaluation/activities/:id ──────────────────────────────────────

router.get('/activities/:id', readLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const activity = await prisma.activity.findUnique({
      where: { id },
      select: {
        id:           true,
        title:        true,
        description:  true,
        instructions: true,
        type:         true,
        maxScore:     true,
        timeLimit:    true,
        dueDate:      true,
        isPublished:  true,
        isActive:     true,
        createdAt:    true,
      },
    });

    if (!activity || !activity.isActive) {
      return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
    }

    // Students may only access published activities
    if (req.user!.role === 'STUDENT' && !activity.isPublished) {
      return res.status(403).json({ success: false, message: 'Actividad no disponible' });
    }

    return res.json({ success: true, activity });
  } catch (err: any) {
    console.error('[GET /activities/:id]', err.message);
    return res.status(500).json({ success: false, message: 'Error al obtener actividad' });
  }
});

// ─── GET /api/evaluation/activities?type=EXAM|TALLER ─────────────────────────

router.get('/activities', readLimiter, async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const VALID_TYPES = ['EXAM', 'TALLER', 'QUIZ', 'WORKSHOP'] as const;

    const where: Record<string, unknown> = { isActive: true };

    if (type) {
      if (typeof type !== 'string' || !VALID_TYPES.includes(type as any)) {
        return res.status(400).json({
          success: false,
          message: `type debe ser uno de: ${VALID_TYPES.join(', ')}`,
        });
      }
      where.type = type;
    }

    // Students see only published activities; teachers/admins see all.
    if (req.user!.role === 'STUDENT') {
      where.isPublished = true;
    }

    const data = await prisma.activity.findMany({
      where,
      select: {
        id:           true,
        title:        true,
        description:  true,
        type:         true,
        maxScore:     true,
        timeLimit:    true,
        dueDate:      true,
        isPublished:  true,
        createdAt:    true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('[GET /activities]', err.message);
    return res.status(500).json({ success: false, message: 'Error al obtener actividades' });
  }
});

export default router;
