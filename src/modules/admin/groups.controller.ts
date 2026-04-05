/**
 * Groups Controller
 * REST API for managing groups and subgroups.
 *
 * Routes (mounted at /api/groups):
 *   GET    /                        – list groups (with filters)
 *   POST   /                        – create group
 *   GET    /:id                     – get group detail + members
 *   PATCH  /:id                     – update group
 *   DELETE /:id                     – delete group
 *   GET    /:id/members             – list members
 *   POST   /:id/members             – add member
 *   DELETE /:id/members/:userId     – remove member
 *   PATCH  /:id/lead                – set/clear simulator lead
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireTeacherPlus } from '../../shared/middleware/auth.middleware';
import * as GroupService from './group.service';

const router = Router();

router.use(authenticate);
router.use(requireTeacherPlus);

// ── List groups ──────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { teacherId, studentId, parentGroupId, depth, isActive, myGroups } = req.query;

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (depth !== undefined) filters.depth = Number(depth);
    if (parentGroupId === 'null') filters.parentGroupId = null;
    else if (parentGroupId) filters.parentGroupId = String(parentGroupId);
    if (teacherId) filters.teacherId = String(teacherId);
    if (studentId) filters.studentId = String(studentId);
    // ?myGroups=true → show only groups where the caller is a TEACHER member
    if (myGroups === 'true') filters.teacherId = req.user!.id;

    const groups = await GroupService.getGroups(filters);
    res.json({ success: true, groups });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Create group ─────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, parentGroupId, semester, academicYear, maxStudents } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'El nombre es requerido' });

    const group = await GroupService.createGroup({
      name,
      description,
      parentGroupId,
      semester,
      academicYear,
      maxStudents,
      createdBy: req.user!.id,
    });
    res.status(201).json({ success: true, group });
  } catch (err: any) {
    const status = err.message.includes('no existe') || err.message.includes('niveles') ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── Get group detail ─────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const group = await GroupService.getGroupById(req.params.id);
    res.json({ success: true, group });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// ── Update group ─────────────────────────────────────────────────────────────
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, semester, academicYear, maxStudents, isActive } = req.body;
    const group = await GroupService.updateGroup(req.params.id, {
      name, description, semester, academicYear, maxStudents, isActive,
    });
    res.json({ success: true, group });
  } catch (err: any) {
    const status = err.message === 'Grupo no encontrado' ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── Delete group ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await GroupService.deleteGroup(req.params.id);
    res.json({ success: true, message: 'Grupo eliminado' });
  } catch (err: any) {
    const status = err.message.includes('subgrupos') ? 409 : 404;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── List members ─────────────────────────────────────────────────────────────
router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const members = await GroupService.getGroupMembers(req.params.id);
    res.json({ success: true, members });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Add member ───────────────────────────────────────────────────────────────
router.post('/:id/members', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId es requerido' });

    const memberRole: 'STUDENT' | 'TEACHER' = role === 'TEACHER' ? 'TEACHER' : 'STUDENT';
    const member = await GroupService.addMember(req.params.id, userId, memberRole);
    res.status(201).json({ success: true, member });
  } catch (err: any) {
    const status = err.message.includes('máximo') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// ── Remove member ────────────────────────────────────────────────────────────
router.delete('/:id/members/:userId', async (req: Request, res: Response) => {
  try {
    await GroupService.removeMember(req.params.id, req.params.userId);
    res.json({ success: true, message: 'Miembro removido' });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// ── Set / clear simulator lead ───────────────────────────────────────────────
router.patch('/:id/lead', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body; // null to clear
    const group = await GroupService.setSimulatorLead(
      req.params.id,
      userId === null || userId === '' ? null : userId,
    );
    res.json({ success: true, group });
  } catch (err: any) {
    const status = err.message.includes('miembro') ? 400 : 404;
    res.status(status).json({ success: false, message: err.message });
  }
});

export default router;
