/**
 * GroupService
 * Manages groups, subgroups (max 3 levels deep), memberships and simulator lead.
 *
 * HIERARCHY RULES (enforced here, not in DB):
 *   depth 0 = root group
 *   depth 1 = first-level subgroup
 *   depth 2 = second-level subgroup (max)
 */

import { prisma } from '../../shared/infrastructure/database';

const MAX_DEPTH = 2;
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function genCode(len = 6): string {
  return Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
}

// ---------------------------------------------------------------------------
// Group CRUD
// ---------------------------------------------------------------------------

export async function createGroup(input: {
  name: string;
  description?: string;
  parentGroupId?: string;
  semester?: string;
  academicYear?: string;
  maxStudents?: number;
  createdBy: string;
}) {
  const { name, description, parentGroupId, semester, academicYear, maxStudents, createdBy } = input;

  let depth = 0;
  if (parentGroupId) {
    const parent = await prisma.group.findUnique({ where: { id: parentGroupId } });
    if (!parent) throw new Error('El grupo padre no existe');
    if (!parent.isActive) throw new Error('El grupo padre está desactivado');
    if (parent.depth >= MAX_DEPTH) {
      throw new Error(`Máximo ${MAX_DEPTH + 1} niveles de jerarquía permitidos`);
    }
    depth = parent.depth + 1;
  }

  // Unique enrollment code
  let enrollmentCode = genCode();
  for (let i = 0; i < 9; i++) {
    const existing = await prisma.group.findUnique({ where: { enrollmentCode } });
    if (!existing) break;
    enrollmentCode = genCode();
  }

  const group = await prisma.group.create({
    data: { name, description, parentGroupId, depth, enrollmentCode, semester, academicYear, maxStudents, createdBy, isActive: true },
    include: _groupIncludes(),
  });

  // Auto-add creator as TEACHER member
  await prisma.groupMember.create({ data: { groupId: group.id, userId: createdBy, role: 'TEACHER' } });

  return group;
}

export async function updateGroup(groupId: string, input: {
  name?: string; description?: string; semester?: string;
  academicYear?: string; maxStudents?: number; isActive?: boolean;
}) {
  await _requireGroup(groupId);
  return prisma.group.update({ where: { id: groupId }, data: { ...input }, include: _groupIncludes() });
}

export async function deleteGroup(groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, include: { subGroups: { select: { id: true } } } });
  if (!group) throw new Error('Grupo no encontrado');
  if (group.subGroups.length > 0) throw new Error('Elimina los subgrupos antes de eliminar este grupo');
  await prisma.group.delete({ where: { id: groupId } });
  return { deleted: true };
}

export async function getGroups(filters: {
  teacherId?: string; studentId?: string; parentGroupId?: string | null;
  depth?: number; isActive?: boolean;
} = {}) {
  const where: any = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.depth !== undefined) where.depth = filters.depth;
  if (filters.parentGroupId !== undefined) where.parentGroupId = filters.parentGroupId;
  if (filters.teacherId) where.members = { some: { userId: filters.teacherId, role: 'TEACHER' } };
  if (filters.studentId) where.members = { some: { userId: filters.studentId, role: 'STUDENT' } };

  return prisma.group.findMany({
    where,
    include: _groupIncludes(),
    orderBy: [{ depth: 'asc' }, { name: 'asc' }],
  });
}

export async function getGroupById(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      ..._groupIncludes(),
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true, image: true } } },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      },
    },
  });
  if (!group) throw new Error('Grupo no encontrado');
  return group;
}

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------

export async function addMember(groupId: string, userId: string, role: 'STUDENT' | 'TEACHER') {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error('Grupo no encontrado');

  if (role === 'STUDENT' && group.maxStudents) {
    const count = await prisma.groupMember.count({ where: { groupId, role: 'STUDENT' } });
    if (count >= group.maxStudents) throw new Error(`El grupo ya alcanzó el límite de ${group.maxStudents} estudiantes`);
  }

  return prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: { groupId, userId, role },
    update: { role },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
}

export async function removeMember(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (!member) throw new Error('El usuario no es miembro de este grupo');
  // Clear simulator lead if this user was the lead
  await prisma.group.updateMany({ where: { id: groupId, simulatorLeaderId: userId }, data: { simulatorLeaderId: null } });
  await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } });
  return { removed: true };
}

export async function getGroupMembers(groupId: string) {
  return prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, email: true, role: true, image: true, createdAt: true } } },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
  });
}

// ---------------------------------------------------------------------------
// Simulator lead
// ---------------------------------------------------------------------------

export async function setSimulatorLead(groupId: string, userId: string | null) {
  await _requireGroup(groupId);
  if (userId !== null) {
    const isMember = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
    if (!isMember) throw new Error('El usuario debe ser miembro del grupo para ser líder');
  }
  return prisma.group.update({
    where: { id: groupId },
    data: { simulatorLeaderId: userId },
    include: { leader: { select: { id: true, name: true, email: true } } },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function _requireGroup(groupId: string) {
  const g = await prisma.group.findUnique({ where: { id: groupId } });
  if (!g) throw new Error('Grupo no encontrado');
  return g;
}

function _groupIncludes() {
  return {
    leader: { select: { id: true, name: true, email: true } },
    creator: { select: { id: true, name: true, email: true } },
    parentGroup: { select: { id: true, name: true, depth: true } },
    subGroups: {
      where: { isActive: true },
      select: { id: true, name: true, depth: true, _count: { select: { members: true, subGroups: true } } },
    },
    _count: { select: { members: true, subGroups: true } },
  } as const;
}
