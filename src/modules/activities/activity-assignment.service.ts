import { prisma } from '../../shared/infrastructure/database';
import type { AssignActivityToGroupInput } from './activity.types';

function parseOptionalDate(value: Date | string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.getTime())) throw new Error('Fecha inválida');
  return dt;
}

export async function assignActivityToGroup(
  input: AssignActivityToGroupInput,
  assignedBy: string,
  opts?: { allowAny?: boolean }
) {
  const activity = await prisma.activity.findUnique({
    where: { id: input.activityId },
    select: { id: true, isActive: true, createdBy: true },
  });
  if (!activity || !activity.isActive) throw new Error('Actividad no encontrada');
  if (!opts?.allowAny && activity.createdBy !== assignedBy) throw new Error('No autorizado para asignar esta actividad');

  const group = await prisma.group.findUnique({ where: { id: input.groupId }, select: { id: true, isActive: true } });
  if (!group || !group.isActive) throw new Error('Grupo no encontrado');

  return prisma.activityAssignment.upsert({
    where: { activityId_groupId: { activityId: input.activityId, groupId: input.groupId } },
    create: {
      activityId: input.activityId,
      groupId: input.groupId,
      assignedBy,
      visibleFrom: parseOptionalDate(input.visibleFrom) ?? null,
      dueDate: parseOptionalDate(input.dueDate) ?? null,
      isActive: input.isActive ?? true,
    },
    update: {
      visibleFrom: parseOptionalDate(input.visibleFrom),
      dueDate: parseOptionalDate(input.dueDate),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      assignedBy,
    },
  });
}

export async function removeAssignment(assignmentId: string, requesterId: string, opts?: { allowAny?: boolean }) {
  const record = await prisma.activityAssignment.findUnique({ where: { id: assignmentId } });
  if (!record) throw new Error('Asignación no encontrada');
  if (!opts?.allowAny && record.assignedBy !== requesterId) throw new Error('No autorizado para eliminar la asignación');
  return prisma.activityAssignment.update({ where: { id: assignmentId }, data: { isActive: false } });
}

export async function getAssignmentsForActivity(activityId: string) {
  return prisma.activityAssignment.findMany({
    where: { activityId, isActive: true },
    include: { group: { select: { id: true, name: true, parentGroupId: true, depth: true } } },
    orderBy: [{ createdAt: 'desc' }],
  });
}

export async function getActivitiesForStudent(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  const groupIds = memberships.map((m) => m.groupId);
  if (groupIds.length === 0) return [];

  return prisma.activity.findMany({
    where: {
      isActive: true,
      isPublished: true,
      assignments: { some: { groupId: { in: groupIds }, isActive: true } },
    },
    include: {
      assignments: { where: { isActive: true, groupId: { in: groupIds } }, select: { groupId: true, dueDate: true, visibleFrom: true } },
      submissions: {
        where: { userId },
        select: { id: true, status: true, score: true, maxScore: true, submittedAt: true, gradedAt: true },
      },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });
}

