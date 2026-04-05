/**
 * Admin Controller
 * REST API for teacher & admin dashboards.
 *
 * Routes (mounted at /api/admin):
 *   GET  /students                   – list all students (TEACHER+)
 *   GET  /students/:id/progress      – detailed student progress (TEACHER+)
 *   GET  /teachers                   – list teachers (ADMIN+)
 *   PATCH /users/:id/role            – change user role (ADMIN+)
 *   GET  /statistics                 – platform stats (ADMIN+)
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireTeacherPlus, requireAdmin } from '../../shared/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import * as AdminService from './admin.service';

const router = Router();

router.use(authenticate);

// ── List students ─────────────────────────────────────────────────────────────
router.get('/students', requireTeacherPlus, async (req: Request, res: Response) => {
  try {
    const {
      groupId,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
      myGroups,
    } = req.query;

    const options: any = {
      groupId: groupId ? String(groupId) : undefined,
      search: search ? String(search) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Math.min(Number(limit), 100) : 20,
      sortBy: sortBy ?? 'name',
      sortOrder: sortOrder ?? 'asc',
    };

    // ?myGroups=true → filter by teacher's own groups
    if (myGroups === 'true') {
      options.teacherId = req.user!.id;
    }

    const result = await AdminService.getStudents(options);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Detailed student progress ─────────────────────────────────────────────────
router.get('/students/:id/progress', requireTeacherPlus, async (req: Request, res: Response) => {
  try {
    const progress = await AdminService.getStudentProgress(req.params.id);
    res.json({ success: true, data: progress });
  } catch (err: any) {
    const status = err.message.includes('no encontrado') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── List teachers ─────────────────────────────────────────────────────────────
router.get('/teachers', requireAdmin, async (req: Request, res: Response) => {
  try {
    const search = req.query.search ? String(req.query.search) : undefined;
    const teachers = await AdminService.getTeachers(search);
    res.json({ success: true, teachers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Change user role ──────────────────────────────────────────────────────────
router.patch('/users/:id/role', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!role || !Object.values(UserRole).includes(role)) {
      return res.status(400).json({ success: false, message: 'Rol inválido' });
    }
    const updated = await AdminService.updateUserRole(req.params.id, role as UserRole, req.user!.id);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    const status = err.message.includes('no encontrado') ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── Platform statistics ───────────────────────────────────────────────────────
router.get('/statistics', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await AdminService.getPlatformStatistics();
    res.json({ success: true, statistics: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
