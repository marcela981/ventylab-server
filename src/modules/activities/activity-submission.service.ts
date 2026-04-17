import { prisma } from '../../shared/infrastructure/database';
import { Prisma } from '@prisma/client';
import * as ScoreService from '../admin/score.service';

function computeLateStatus(dueDate: Date | null | undefined) {
  if (!dueDate) return null;
  return new Date() > dueDate ? 'LATE' : null;
}

export async function getOrCreateSubmission(activityId: string, userId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, isActive: true, isPublished: true, dueDate: true, maxScore: true },
  });
  if (!activity || !activity.isActive || !activity.isPublished) throw new Error('Actividad no disponible');

  const memberships = await prisma.groupMember.findMany({ where: { userId }, select: { groupId: true } });
  const groupIds = memberships.map((m) => m.groupId);

  // Group membership is optional: students without a group can still submit.
  // Students in a group must have the activity assigned to that group.
  let resolvedGroupId: string | null = null;

  if (groupIds.length > 0) {
    const assignment = await prisma.activityAssignment.findFirst({
      where: { activityId, groupId: { in: groupIds }, isActive: true },
      select: { groupId: true, dueDate: true, visibleFrom: true },
    });
    if (!assignment) throw new Error('Actividad no asignada a tu grupo');
    if (assignment.visibleFrom && new Date() < assignment.visibleFrom) throw new Error('Actividad aún no disponible');
    resolvedGroupId = assignment.groupId;
  }

  const existing = await prisma.activitySubmission.findUnique({
    where: { activityId_userId: { activityId, userId } },
  });
  if (existing) return existing;

  return prisma.activitySubmission.create({
    data: {
      activityId,
      userId,
      groupId: resolvedGroupId,
      status: 'DRAFT' as any,
      maxScore: activity.maxScore,
    },
  });
}

export async function saveSubmissionDraft(submissionId: string, userId: string, content: unknown) {
  const record = await prisma.activitySubmission.findUnique({ where: { id: submissionId } });
  if (!record) throw new Error('Entrega no encontrada');
  if (record.userId !== userId) throw new Error('No autorizado');
  if (record.status !== ('DRAFT' as any)) throw new Error('Solo se puede editar un borrador');

  return prisma.activitySubmission.update({
    where: { id: submissionId },
    data: { content: content as Prisma.InputJsonValue },
  });
}

export async function submitActivity(submissionId: string, userId: string) {
  const record = await prisma.activitySubmission.findUnique({
    where: { id: submissionId },
    include: { activity: { select: { dueDate: true } } },
  });
  if (!record) throw new Error('Entrega no encontrada');
  if (record.userId !== userId) throw new Error('No autorizado');
  if (record.status !== ('DRAFT' as any)) throw new Error('La entrega ya fue enviada o calificada');

  const late = computeLateStatus(record.activity?.dueDate ?? null);
  return prisma.activitySubmission.update({
    where: { id: submissionId },
    data: {
      status: (late ?? 'SUBMITTED') as any,
      submittedAt: new Date(),
    },
  });
}

export async function gradeSubmission(submissionId: string, graderId: string, score: number, feedback?: string | null) {
  const record = await prisma.activitySubmission.findUnique({
    where: { id: submissionId },
    include: { activity: { select: { id: true, maxScore: true, type: true, title: true } } },
  });
  if (!record) throw new Error('Entrega no encontrada');
  if (record.status === ('DRAFT' as any)) throw new Error('La entrega aún no ha sido enviada');

  const maxScore = record.maxScore ?? record.activity.maxScore;
  if (score < 0 || score > maxScore) throw new Error(`La calificación debe estar entre 0 y ${maxScore}`);

  const updated = await prisma.activitySubmission.update({
    where: { id: submissionId },
    data: {
      status: 'GRADED' as any,
      score,
      maxScore,
      feedback: feedback ?? null,
      gradedBy: graderId,
      gradedAt: new Date(),
    },
  });

  // Unify with existing teacher scoring table
  await ScoreService.upsertScore({
    graderId,
    userId: record.userId,
    entityType: 'CUSTOM',
    entityId: record.activity.id,
    points: score,
    maxPoints: maxScore,
    comments: feedback ?? `Actividad (${record.activity.type}): ${record.activity.title}`,
  });

  return updated;
}

export async function getStudentSubmissions(userId: string) {
  return prisma.activitySubmission.findMany({
    where: { userId },
    include: {
      activity: { select: { id: true, title: true, type: true, dueDate: true, maxScore: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });
}

export async function getSubmissionsForActivity(activityId: string, groupId?: string) {
  return prisma.activitySubmission.findMany({
    where: { activityId, ...(groupId ? { groupId } : {}) },
    include: {
      student: { select: { id: true, name: true, email: true } },
      grader: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ submittedAt: 'desc' }],
  });
}

export async function getSubmissionById(submissionId: string) {
  return prisma.activitySubmission.findUnique({
    where: { id: submissionId },
    include: {
      activity: { select: { id: true, title: true, type: true, instructions: true, maxScore: true } },
      student: { select: { id: true, name: true, email: true } },
      grader: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getSubmissionByActivity(activityId: string, userId: string) {
  return prisma.activitySubmission.findUnique({
    where: { activityId_userId: { activityId, userId } },
    include: {
      activity: { select: { id: true, title: true, type: true, maxScore: true } },
    },
  });
}

export async function resetSubmission(submissionId: string) {
  const record = await prisma.activitySubmission.findUnique({ where: { id: submissionId } });
  if (!record) throw new Error('Entrega no encontrada');
  await prisma.activitySubmission.delete({ where: { id: submissionId } });
}

