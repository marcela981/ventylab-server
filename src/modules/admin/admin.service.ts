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
  /** Supported: 'name' | 'email' | 'lastActivity' | 'progress' */
  sortBy?: 'name' | 'email' | 'lastActivity' | 'progress';
  sortOrder?: 'asc' | 'desc';
}

/** Shape returned per student — matches the admin panel API contract */
export interface StudentListDTO {
  id: string;
  name: string | null;
  email: string;
  lastActivity: Date | null;
  overallProgress: number;
  completedModules: number;
  totalModules: number;
  groupName: string | null;
}

export interface StudentListResult {
  students: StudentListDTO[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getStudents(options: GetStudentsOptions = {}): Promise<StudentListResult> {
  const {
    groupId, teacherId, search,
    page = 1, limit = 20,
    sortBy = 'name', sortOrder = 'asc',
  } = options;
  const skip = (page - 1) * limit;

  // ── where clause ──────────────────────────────────────────────────────────
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

  // ── sorting strategy ──────────────────────────────────────────────────────
  // lastActivity and progress sort on computed/relation fields → sort in memory.
  // name and email sort are handled directly in DB for efficiency.
  const needsMemorySort = sortBy === 'lastActivity' || sortBy === 'progress';

  const dbOrderBy: any = needsMemorySort
    ? { name: 'asc' }                             // stable fallback during fetch
    : sortBy === 'email' ? { email: sortOrder }
    : { name: sortOrder };                         // default: name

  // ── fetch ─────────────────────────────────────────────────────────────────
  const [rawUsers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      // For memory-sorted queries, fetch ALL matching rows then slice.
      // Admin dashboards typically have < 1 000 students — acceptable.
      ...(needsMemorySort ? {} : { skip, take: limit }),
      orderBy: dbOrderBy,
      select: {
        id: true,
        name: true,
        email: true,
        groupMembers: {
          select: { group: { select: { name: true } } },
        },
        userProgress: {
          select: {
            progressPercentage: true,
            isModuleCompleted: true,
            lastAccessedAt: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // ── map to DTO ────────────────────────────────────────────────────────────
  let students: StudentListDTO[] = rawUsers.map((s) => {
    const prog = s.userProgress;
    const totalModules = prog.length;
    const completedModules = prog.filter((p) => p.isModuleCompleted).length;
    const overallProgress = totalModules > 0
      ? Math.round(prog.reduce((sum, p) => sum + p.progressPercentage, 0) / totalModules)
      : 0;
    const lastActivity = prog
      .map((p) => p.lastAccessedAt)
      .filter((d): d is Date => d != null)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const groupName = s.groupMembers[0]?.group?.name ?? null;

    return { id: s.id, name: s.name, email: s.email, lastActivity, overallProgress, completedModules, totalModules, groupName };
  });

  // ── memory sort + paginate (for relation-based sorts) ─────────────────────
  if (needsMemorySort) {
    students.sort((a, b) => {
      const va = sortBy === 'lastActivity'
        ? (a.lastActivity?.getTime() ?? 0)
        : a.overallProgress;
      const vb = sortBy === 'lastActivity'
        ? (b.lastActivity?.getTime() ?? 0)
        : b.overallProgress;
      return sortOrder === 'asc' ? va - vb : vb - va;
    });
    students = students.slice(skip, skip + limit);
  }

  return {
    students,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
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
// Platform statistics (TEACHER+ can read, ADMIN+ for full access)
// ---------------------------------------------------------------------------

export async function getPlatformStatistics() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // "Active" = accessed the platform in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalStudents,
    totalTeachers,
    totalAdmins,
    totalGroups,
    totalModules,
    totalLessons,
    totalEvaluations,
    totalSimulatorSessions,
    completionsToday,
    activeRes,
    // New computed fields
    activeStudents,
    studentsWithAnyCompletion,
    avgProgressAgg,
    recentCompletions,
  ] = await Promise.all([
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
    // Students who accessed the platform in the last 30 days
    prisma.user.count({
      where: {
        role: UserRole.STUDENT,
        userProgress: { some: { lastAccessedAt: { gte: thirtyDaysAgo } } },
      },
    }),
    // Students who have completed at least one module
    prisma.user.count({
      where: {
        role: UserRole.STUDENT,
        userProgress: { some: { isModuleCompleted: true } },
      },
    }),
    // Average progress across all student module records
    prisma.userProgress.aggregate({ _avg: { progressPercentage: true } }),
    // Last 10 lesson completions with actor info
    prisma.lessonCompletion.findMany({
      where: { isCompleted: true },
      orderBy: { completedAt: 'desc' },
      take: 10,
      select: {
        userId: true,
        completedAt: true,
        user: { select: { name: true } },
        lesson: { select: { title: true } },
      },
    }),
  ]);

  const averageProgress = Math.round(avgProgressAgg._avg.progressPercentage ?? 0);
  const completionRate = totalStudents > 0
    ? Math.round((studentsWithAnyCompletion / totalStudents) * 100)
    : 0;

  const recentActivity = recentCompletions.map((c) => ({
    userId: c.userId,
    userName: c.user.name,
    action: `Completó la lección: ${c.lesson.title}`,
    timestamp: c.completedAt,
  }));

  return {
    // Core counts
    totalStudents,
    activeStudents,
    totalTeachers,
    totalAdmins,
    totalGroups,
    totalModules,
    publishedModules: totalModules,   // isActive === published in this schema
    totalLessons,
    totalEvaluations,
    totalSimulatorSessions,
    // Derived metrics
    averageProgress,
    completionRate,
    completionsToday,
    recentActivity,
    // Ventilator reservation status
    hasActiveReservation: !!activeRes,
    activeReservationUserId: activeRes?.userId ?? null,
    activeReservationGroupId: activeRes?.groupId ?? null,
    activeReservationLeaderId: activeRes?.leaderId ?? null,
    generatedAt: new Date(),
  };
}
