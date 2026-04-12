/**
 * AdminService — student list, student progress, role management, statistics.
 *
 * Field names align with actual Prisma schema:
 *   User.groupMembers   (not groupMemberships)
 *   User.scoresReceived / scoresGiven
 *   User.ledGroups / createdGroups
 */

import { prisma } from '../../shared/infrastructure/database';
import { UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Student list
// ---------------------------------------------------------------------------

export interface GetStudentsOptions {
  groupId?: string;
  teacherId?: string;   // filter by teacher's groups
  myGroups?: boolean;   // alias for teacherId = caller
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export async function getStudents(options: GetStudentsOptions = {}) {
  const { groupId, teacherId, search, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = options;
  const skip = (page - 1) * limit;

  const where: any = { role: UserRole.STUDENT };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (groupId) {
    where.groupMembers = { some: { groupId } };
  } else if (teacherId) {
    const teacherGroupIds = (await prisma.groupMember.findMany({
      where: { userId: teacherId, role: 'TEACHER' },
      select: { groupId: true },
    })).map((m) => m.groupId);
    if (teacherGroupIds.length > 0) {
      where.groupMembers = { some: { groupId: { in: teacherGroupIds } } };
    }
  }

  const orderBy: any =
    sortBy === 'name' ? { name: sortOrder } :
    sortBy === 'email' ? { email: sortOrder } :
    { createdAt: sortOrder };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true, name: true, email: true, role: true, image: true, createdAt: true,
        groupMembers: {
          select: {
            role: true,
            joinedAt: true,
            group: { select: { id: true, name: true, depth: true } },
          },
        },
        userProgress: {
          select: { status: true, progressPercentage: true, isModuleCompleted: true, timeSpent: true, lastAccessedAt: true },
        },
        _count: { select: { evaluationAttempts: true, simulatorSessions: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const students = users.map((s) => {
    const prog = s.userProgress;
    const totalMods = prog.length;
    const completedMods = prog.filter((p) => p.isModuleCompleted).length;
    const overallProgress = totalMods > 0
      ? Math.round(prog.reduce((sum, p) => sum + p.progressPercentage, 0) / totalMods)
      : 0;
    const totalTime = prog.reduce((sum, p) => sum + p.timeSpent, 0);
    const lastActivity = prog.map((p) => p.lastAccessedAt).sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      id: s.id, name: s.name, email: s.email, role: s.role, image: s.image, createdAt: s.createdAt,
      groups: s.groupMembers.map((m) => ({ ...m.group, memberRole: m.role, joinedAt: m.joinedAt })),
      progress: { overallProgress, completedModules: completedMods, totalModules: totalMods, totalTimeSpentSeconds: totalTime, lastActivityAt: lastActivity ?? null },
      evaluationsTaken: s._count.evaluationAttempts,
      simulatorSessions: s._count.simulatorSessions,
    };
  });

  return { students, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ---------------------------------------------------------------------------
// Detailed student progress
// ---------------------------------------------------------------------------

export async function getStudentProgress(studentId: string) {
  const user = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true, name: true, email: true, role: true, image: true, createdAt: true,
      groupMembers: {
        select: { role: true, group: { select: { id: true, name: true, depth: true } } },
      },
    },
  });
  if (!user) throw new Error('Usuario no encontrado');
  if (user.role !== UserRole.STUDENT) throw new Error('El usuario no es un estudiante');

  const [moduleProgress, lessonCompletions, evaluationAttempts, simulatorSessions, quizAttempts, achievementCount, scores] =
    await Promise.all([
      prisma.userProgress.findMany({
        where: { userId: studentId },
        include: { module: { select: { id: true, title: true, description: true, level: { select: { id: true, title: true } } } } },
        orderBy: { lastAccessedAt: 'desc' },
      }),
      prisma.lessonCompletion.findMany({
        where: { userId: studentId },
        include: { lesson: { select: { id: true, title: true, moduleId: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      prisma.evaluationAttempt.findMany({
        where: { userId: studentId },
        include: { clinicalCase: { select: { id: true, title: true, difficulty: true, pathology: true } } },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.simulatorSession.findMany({
        where: { userId: studentId },
        select: { id: true, isRealVentilator: true, startedAt: true, completedAt: true, clinicalCaseId: true },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.quizAttempt.findMany({
        where: { userId: studentId },
        include: { quiz: { select: { id: true, title: true, passingScore: true } } },
        orderBy: { startedAt: 'desc' },
        take: 30,
      }),
      prisma.achievement.count({ where: { userId: studentId } }),
      prisma.score.findMany({
        where: { userId: studentId },
        include: { grader: { select: { id: true, name: true, email: true } } },
        orderBy: [{ entityType: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

  const completedModules = moduleProgress.filter((p) => p.isModuleCompleted).length;
  const totalModules = moduleProgress.length;
  const overallProgress = totalModules > 0
    ? Math.round(moduleProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / totalModules)
    : 0;
  const totalTimeSpent = moduleProgress.reduce((sum, p) => sum + p.timeSpent, 0);
  const passedEvals = evaluationAttempts.filter((e) => e.isSuccessful).length;
  const avgScore = evaluationAttempts.length > 0
    ? Math.round(evaluationAttempts.reduce((sum, e) => sum + e.score, 0) / evaluationAttempts.length)
    : 0;

  return {
    user: { ...user, groups: user.groupMembers.map((m) => ({ ...m.group, memberRole: m.role })) },
    moduleProgress: moduleProgress.map((p) => ({
      moduleId: p.moduleId, moduleTitle: p.module.title, levelTitle: p.module.level?.title ?? null,
      status: p.status, progressPercentage: p.progressPercentage,
      completedLessons: p.completedLessonsCount, totalLessons: p.totalLessons,
      timeSpentSeconds: p.timeSpent, lastAccessedAt: p.lastAccessedAt, completedAt: p.completedAt,
    })),
    lessonCompletions: lessonCompletions.map((lc) => ({
      lessonId: lc.lessonId, lessonTitle: lc.lesson.title, moduleId: lc.lesson.moduleId,
      isCompleted: lc.isCompleted, currentStepIndex: lc.currentStepIndex, totalSteps: lc.totalSteps,
      timeSpentSeconds: lc.timeSpent, completedAt: lc.completedAt,
    })),
    evaluationAttempts: evaluationAttempts.map((e) => ({
      attemptId: e.id, caseId: e.clinicalCaseId, caseTitle: e.clinicalCase.title,
      difficulty: e.clinicalCase.difficulty, pathology: e.clinicalCase.pathology,
      score: e.score, isSuccessful: e.isSuccessful, startedAt: e.startedAt, completedAt: e.completedAt,
    })),
    quizAttempts: quizAttempts.map((q) => ({
      quizId: q.quizId, quizTitle: q.quiz.title, score: q.score, passed: q.passed, startedAt: q.startedAt,
    })),
    simulatorSessions: simulatorSessions.map((s) => ({
      sessionId: s.id, isRealVentilator: s.isRealVentilator,
      startedAt: s.startedAt, completedAt: s.completedAt, clinicalCaseId: s.clinicalCaseId,
    })),
    scores: scores.map((sc) => ({
      id: sc.id, entityType: sc.entityType, entityId: sc.entityId,
      points: sc.points, maxPoints: sc.maxPoints, comments: sc.comments,
      grader: sc.grader, createdAt: sc.createdAt,
    })),
    statistics: {
      totalTimeSpentSeconds: totalTimeSpent, completedModules, totalModules, overallProgress,
      evaluationsTaken: evaluationAttempts.length, evaluationsPassed: passedEvals,
      evaluationsPassRate: evaluationAttempts.length > 0 ? Math.round((passedEvals / evaluationAttempts.length) * 100) : 0,
      averageEvaluationScore: avgScore,
      simulatorSessions: simulatorSessions.length,
      quizzesTaken: quizAttempts.length,
      achievementsUnlocked: achievementCount,
    },
  };
}

// ---------------------------------------------------------------------------
// Role management (ADMIN+)
// ---------------------------------------------------------------------------

export async function updateUserRole(targetUserId: string, newRole: UserRole, requesterId: string) {
  if (targetUserId === requesterId) throw new Error('No puedes cambiar tu propio rol');
  if (newRole === UserRole.SUPERUSER) throw new Error('No se puede asignar SUPERUSER por esta vía');
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error('Usuario no encontrado');
  return prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: { id: true, name: true, email: true, role: true },
  });
}

// ---------------------------------------------------------------------------
// Teachers list
// ---------------------------------------------------------------------------

export async function getTeachers(search?: string) {
  const where: any = { role: { in: [UserRole.TEACHER, UserRole.ADMIN] } };
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ];

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, name: true, email: true, role: true, image: true, createdAt: true,
      groupMembers: {
        where: { role: 'TEACHER' },
        select: { group: { select: { id: true, name: true } } },
      },
      _count: { select: { createdGroups: true } },
    },
    orderBy: { name: 'asc' },
  });

  // Count students in each teacher's groups
  const teacherIds = users.map(u => u.id);
  const studentCounts = await Promise.all(
    teacherIds.map(async (teacherId) => {
      const groupIds = (await prisma.groupMember.findMany({
        where: { userId: teacherId, role: 'TEACHER' },
        select: { groupId: true },
      })).map(m => m.groupId);

      if (!groupIds.length) return { teacherId, count: 0 };

      const count = await prisma.groupMember.count({
        where: { groupId: { in: groupIds }, role: 'STUDENT' },
      });
      return { teacherId, count };
    })
  );
  const studentCountMap = Object.fromEntries(studentCounts.map(s => [s.teacherId, s.count]));

  return users.map(u => ({
    id: u.id, name: u.name, email: u.email, role: u.role, image: u.image, createdAt: u.createdAt,
    groups: u.groupMembers.map(m => m.group),
    studentCount: studentCountMap[u.id] ?? 0,
    groupsCreated: u._count.createdGroups,
  }));
}

// ---------------------------------------------------------------------------
// Platform statistics (ADMIN+)
// ---------------------------------------------------------------------------

export async function getPlatformStatistics() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [students, teachers, admins, groups, modules, lessons, evaluations, sessions, completionsToday, activeRes] =
    await Promise.all([
      prisma.user.count({ where: { role: UserRole.STUDENT } }),
      prisma.user.count({ where: { role: UserRole.TEACHER } }),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
      prisma.group.count({ where: { isActive: true } }),
      prisma.module.count({ where: { isActive: true } }),
      prisma.lesson.count({ where: { isActive: true } }),
      prisma.clinicalCase.count({ where: { isActive: true } }),
      prisma.simulatorSession.count(),
      prisma.lessonCompletion.count({
        where: { isCompleted: true, completedAt: { gte: todayStart } },
      }),
      prisma.ventilatorReservation.findFirst({ where: { status: 'ACTIVE' } }),
    ]);

  return {
    totalStudents: students,
    totalTeachers: teachers,
    totalAdmins: admins,
    totalGroups: groups,
    totalModules: modules,
    totalLessons: lessons,
    totalEvaluations: evaluations,
    totalSimulatorSessions: sessions,
    completionsToday,
    hasActiveReservation: !!activeRes,
    activeReservationUserId: activeRes?.userId ?? null,
    activeReservationGroupId: activeRes?.groupId ?? null,
    activeReservationLeaderId: activeRes?.leaderId ?? null,
    generatedAt: new Date(),
  };
}
