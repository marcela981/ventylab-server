/**
 * ScoreService
 * Teacher-assigned grades per (teacher, student, entityType, entityId).
 * Scores are personal — multiple teachers can grade the same student independently.
 */

import { prisma } from '../../shared/infrastructure/database';

export type ScoreEntityType = 'MODULE' | 'LESSON' | 'QUIZ' | 'CASE' | 'CUSTOM';

export interface UpsertScoreInput {
  graderId: string;    // teacher userId
  userId: string;      // student userId
  entityType: ScoreEntityType;
  entityId: string;
  points: number;
  maxPoints?: number;
  comments?: string;
}

export async function upsertScore(input: UpsertScoreInput) {
  const { graderId, userId, entityType, entityId, points, maxPoints = 100, comments } = input;

  if (points < 0 || points > maxPoints) throw new Error(`La calificación debe estar entre 0 y ${maxPoints}`);

  const student = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!student) throw new Error('Estudiante no encontrado');

  return prisma.score.upsert({
    where: { graderId_userId_entityType_entityId: { graderId, userId, entityType, entityId } },
    create: { graderId, userId, entityType, entityId, points, maxPoints, comments },
    update: { points, maxPoints, comments },
    include: {
      user: { select: { id: true, name: true, email: true } },
      grader: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteScore(scoreId: string, requesterId: string) {
  const record = await prisma.score.findUnique({ where: { id: scoreId } });
  if (!record) throw new Error('Calificación no encontrada');
  if (record.graderId !== requesterId) throw new Error('Solo el profesor que creó la calificación puede eliminarla');
  await prisma.score.delete({ where: { id: scoreId } });
  return { deleted: true };
}

/** All scores for a student — teacher sees only their own unless ADMIN */
export async function getStudentScores(userId: string, requestingGraderId?: string) {
  return prisma.score.findMany({
    where: { userId, ...(requestingGraderId ? { graderId: requestingGraderId } : {}) },
    include: { grader: { select: { id: true, name: true, email: true } } },
    orderBy: [{ entityType: 'asc' }, { createdAt: 'desc' }],
  });
}

/** All scores given by a teacher */
export async function getGraderScores(graderId: string, userId?: string) {
  return prisma.score.findMany({
    where: { graderId, ...(userId ? { userId } : {}) },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ userId: 'asc' }, { entityType: 'asc' }, { createdAt: 'desc' }],
  });
}
