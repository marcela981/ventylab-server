import { prisma } from '../../shared/infrastructure/database';
import type { CreateActivityInput, UpdateActivityInput } from './activity.types';

function parseOptionalDate(value: Date | string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.getTime())) throw new Error('Fecha inválida');
  return dt;
}

export async function createActivity(input: CreateActivityInput, createdBy: string) {
  if (!input.title?.trim()) throw new Error('El título es requerido');
  if (!input.type) throw new Error('El tipo es requerido');

  const maxScore = input.maxScore ?? 100;
  if (maxScore <= 0) throw new Error('maxScore debe ser mayor a 0');

  return prisma.activity.create({
    data: {
      title: input.title.trim(),
      description: input.description ?? null,
      instructions: input.instructions ?? null,
      type: input.type as any,
      maxScore,
      timeLimit: input.timeLimit ?? null,
      dueDate: parseOptionalDate(input.dueDate) ?? null,
      createdBy,
    },
  });
}

export async function updateActivity(
  activityId: string,
  input: UpdateActivityInput,
  requesterId: string,
  opts?: { allowAny?: boolean }
) {
  const record = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, createdBy: true },
  });
  if (!record) throw new Error('Actividad no encontrada');
  if (!opts?.allowAny && record.createdBy !== requesterId) {
    // Authorization (ADMIN override) is enforced at controller layer.
    throw new Error('No autorizado para editar esta actividad');
  }

  return prisma.activity.update({
    where: { id: activityId },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
      ...(input.type !== undefined ? { type: input.type as any } : {}),
      ...(input.maxScore !== undefined ? { maxScore: input.maxScore } : {}),
      ...(input.timeLimit !== undefined ? { timeLimit: input.timeLimit } : {}),
      ...(input.dueDate !== undefined ? { dueDate: parseOptionalDate(input.dueDate) } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}

export async function deleteActivity(activityId: string, requesterId: string, opts?: { allowAny?: boolean }) {
  const record = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, createdBy: true },
  });
  if (!record) throw new Error('Actividad no encontrada');
  if (!opts?.allowAny && record.createdBy !== requesterId) {
    // Authorization (ADMIN override) is enforced at controller layer.
    throw new Error('No autorizado para eliminar esta actividad');
  }

  return prisma.activity.update({
    where: { id: activityId },
    data: { isActive: false },
  });
}

export async function publishActivity(activityId: string, requesterId: string, opts?: { allowAny?: boolean }) {
  const record = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, createdBy: true, isPublished: true },
  });
  if (!record) throw new Error('Actividad no encontrada');
  if (!opts?.allowAny && record.createdBy !== requesterId) {
    // Authorization (ADMIN override) is enforced at controller layer.
    throw new Error('No autorizado para publicar esta actividad');
  }

  if (record.isPublished) return record;

  return prisma.activity.update({
    where: { id: activityId },
    data: { isPublished: true },
  });
}

export async function getActivityById(activityId: string) {
  return prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      assignments: { where: { isActive: true } },
    },
  });
}

export async function listActivitiesForTeacher(createdBy: string) {
  return prisma.activity.findMany({
    where: { createdBy, isActive: true },
    include: {
      assignments: { where: { isActive: true }, select: { id: true, groupId: true, dueDate: true, visibleFrom: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });
}

