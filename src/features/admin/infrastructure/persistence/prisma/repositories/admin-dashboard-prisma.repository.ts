/*
 * Funcionalidad: Repositorio Prisma de lectura del panel de administración
 * Descripción: Modelo de lectura que agrega en consultas directas tablas de varias features (users, group_members, groups, user_progress, lesson_completions, lessons, modules, evaluation_attempts, student_evaluation_attempts de evaluaciones QUIZ en lugar de la tabla congelada quiz_attempts, simulator_sessions, scores, clinical_cases y ventilator_reservations), igual que el servicio de administración original; no escribe en ninguna
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma, ReservationStatus } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type AdminStudentActivity,
  type AdminStudentListItem,
  type AdminStudentProfile,
  type AdminTeacherItem,
  type GetAdminStudentsQuery,
  type PlatformCounts,
} from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import { type IAdminDashboardRepository } from "@/features/admin/domain/repositories/admin-dashboard.repository";
import { type ModuleProgressSummary, sortStudentsByComputedField, summarizeModuleProgress } from "@/features/admin/domain/services/admin-dashboard-calculator";
import {
  QUIZ_RESULT_ATTEMPT_SCOPE,
  QUIZ_RESULT_ATTEMPT_SELECT,
  type QuizResult,
  toQuizResult,
} from "@/features/progress/infrastructure/persistence/prisma/quiz-results";
import { type QuizAttemptRow } from "@/features/quizzes/infrastructure/persistence/prisma/mappers/quizzes.mapper";

const TEACHER_MEMBER_ROLE: string = "TEACHER";
const STUDENT_MEMBER_ROLE: string = "STUDENT";
const ACTIVE_RESERVATION_STATUS: ReservationStatus = ReservationStatus.ACTIVE;
const RECENT_COMPLETIONS_LIMIT: number = 10;
const LESSON_COMPLETIONS_LIMIT: number = 50;
const QUIZ_ATTEMPTS_LIMIT: number = 30;

interface StudentListRow {
  id: string;
  name: string | null;
  email: string;
  groupMembers: { group: { name: string } }[];
  userProgress: { progressPercentage: number; isModuleCompleted: boolean; lastAccessedAt: Date }[];
}

interface QuizAttemptActivityRow extends QuizAttemptRow {
  startedAt: Date;
  evaluation: { legacyPassingScore: number | null; title: string };
}

interface TeacherRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: Date;
  groupMembers: { group: { id: string; name: string } }[];
  _count: { createdGroups: number };
}

@Injectable()
export class AdminDashboardPrismaRepository implements IAdminDashboardRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getStudents(query: GetAdminStudentsQuery): Promise<Paginated<AdminStudentListItem>> {
    const skip: number = (query.page - 1) * query.limit;
    const where: Prisma.UserWhereInput = { role: "STUDENT" };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.groupId) {
      where.groupMembers = { some: { groupId: query.groupId } };
    } else if (query.teacherId) {
      const teacherGroupIds: string[] = await this._getTeacherGroupIds(query.teacherId);

      if (teacherGroupIds.length > 0) {
        where.groupMembers = { some: { groupId: { in: teacherGroupIds } } };
      }
    }

    const sortsInMemory: boolean = query.sortBy === "lastActivity" || query.sortBy === "progress";
    const orderBy: Prisma.UserOrderByWithRelationInput = sortsInMemory
      ? { name: "asc" }
      : query.sortBy === "email"
        ? { email: query.sortOrder }
        : { name: query.sortOrder };

    const [rows, total]: [StudentListRow[], number] = await Promise.all([
      this._prisma.user.findMany({
        where,
        ...(sortsInMemory ? {} : { skip, take: query.limit }),
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          groupMembers: { select: { group: { select: { name: true } } } },
          userProgress: { select: { progressPercentage: true, isModuleCompleted: true, lastAccessedAt: true } },
        },
      }),
      this._prisma.user.count({ where }),
    ]);

    let students: AdminStudentListItem[] = rows.map((row: StudentListRow): AdminStudentListItem => {
      const summary: ModuleProgressSummary = summarizeModuleProgress(row.userProgress);

      return {
        id: row.id,
        name: row.name ?? undefined,
        email: row.email,
        lastActivity: summary.lastActivity,
        overallProgress: summary.overallProgress,
        completedModules: summary.completedModules,
        totalModules: summary.totalModules,
        groupName: row.groupMembers[0]?.group.name,
      };
    });

    if (sortsInMemory) {
      students = sortStudentsByComputedField(students, query.sortBy, query.sortOrder).slice(skip, skip + query.limit);
    }

    return new Paginated({ items: students, total, page: query.page, limit: query.limit });
  }

  public async getStudentProfile(userId: string): Promise<AdminStudentProfile | undefined> {
    const row: {
      id: string;
      name: string | null;
      email: string;
      role: string;
      image: string | null;
      createdAt: Date;
      groupMembers: { role: string; group: { id: string; name: string; depth: number } }[];
    } | null = await this._prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        groupMembers: { select: { role: true, group: { select: { id: true, name: true, depth: true } } } },
      },
    });

    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      name: row.name ?? undefined,
      email: row.email,
      role: row.role,
      image: row.image ?? undefined,
      createdAt: row.createdAt,
      groups: row.groupMembers.map((member: { role: string; group: { id: string; name: string; depth: number } }) => ({
        id: member.group.id,
        name: member.group.name,
        depth: member.group.depth,
        memberRole: member.role,
      })),
    };
  }

  public async getStudentActivity(userId: string): Promise<AdminStudentActivity> {
    const [moduleProgress, lessonCompletions, evaluationAttempts, simulatorSessions, quizAttempts, scores] = await Promise.all([
      this._prisma.userProgress.findMany({
        where: { userId },
        include: { module: { select: { id: true, title: true, level: { select: { title: true } } } } },
        orderBy: { lastAccessedAt: "desc" },
      }),
      this._prisma.lessonCompletion.findMany({
        where: { userId },
        include: { lesson: { select: { id: true, title: true, moduleId: true } } },
        orderBy: { updatedAt: "desc" },
        take: LESSON_COMPLETIONS_LIMIT,
      }),
      this._prisma.evaluationAttempt.findMany({
        where: { userId },
        include: { clinicalCase: { select: { id: true, title: true, difficulty: true, pathology: true } } },
        orderBy: { startedAt: "desc" },
      }),
      this._prisma.simulatorSession.findMany({
        where: { userId },
        select: { id: true, isRealVentilator: true, startedAt: true, completedAt: true, clinicalCaseId: true },
        orderBy: { startedAt: "desc" },
      }),
      this._findQuizAttempts(userId),
      this._prisma.score.findMany({
        where: { userId },
        include: { grader: { select: { id: true, name: true, email: true } } },
        orderBy: [{ entityType: "asc" }, { createdAt: "desc" }],
      }),
    ]);

    return {
      moduleProgress: moduleProgress.map((progress: (typeof moduleProgress)[number]) => ({
        moduleId: progress.moduleId,
        moduleTitle: progress.module.title,
        levelTitle: progress.module.level?.title,
        status: progress.status,
        progressPercentage: progress.progressPercentage,
        completedLessons: progress.completedLessonsCount,
        totalLessons: progress.totalLessons,
        timeSpentSeconds: progress.timeSpent,
        lastAccessedAt: progress.lastAccessedAt,
        completedAt: progress.completedAt ?? undefined,
        isModuleCompleted: progress.isModuleCompleted,
      })),
      lessonCompletions: lessonCompletions.map((completion: (typeof lessonCompletions)[number]) => ({
        lessonId: completion.lessonId,
        lessonTitle: completion.lesson.title,
        moduleId: completion.lesson.moduleId,
        isCompleted: completion.isCompleted,
        currentStepIndex: completion.currentStepIndex,
        totalSteps: completion.totalSteps,
        timeSpentSeconds: completion.timeSpent,
        completedAt: completion.completedAt ?? undefined,
      })),
      evaluationAttempts: evaluationAttempts.map((attempt: (typeof evaluationAttempts)[number]) => ({
        attemptId: attempt.id,
        caseId: attempt.clinicalCaseId,
        caseTitle: attempt.clinicalCase.title,
        difficulty: attempt.clinicalCase.difficulty,
        pathology: attempt.clinicalCase.pathology,
        score: attempt.score,
        isSuccessful: attempt.isSuccessful,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt ?? undefined,
      })),
      quizAttempts: quizAttempts.map((attempt: QuizAttemptActivityRow) => {
        const result: QuizResult = toQuizResult(attempt);

        return {
          quizId: attempt.evaluationId,
          quizTitle: attempt.evaluation.title,
          score: result.percent,
          passed: result.passed,
          startedAt: attempt.startedAt,
        };
      }),
      simulatorSessions: simulatorSessions.map((session: (typeof simulatorSessions)[number]) => ({
        sessionId: session.id,
        isRealVentilator: session.isRealVentilator,
        startedAt: session.startedAt,
        completedAt: session.completedAt ?? undefined,
        clinicalCaseId: session.clinicalCaseId ?? undefined,
      })),
      scores: scores.map((score: (typeof scores)[number]) => ({
        id: score.id,
        entityType: score.entityType,
        entityId: score.entityId,
        points: score.points,
        maxPoints: score.maxPoints,
        comments: score.comments ?? undefined,
        grader: { id: score.grader.id, name: score.grader.name ?? undefined, email: score.grader.email },
        createdAt: score.createdAt,
      })),
    };
  }

  public async getTeachers(search?: string): Promise<AdminTeacherItem[]> {
    const where: Prisma.UserWhereInput = { role: { in: ["TEACHER", "ADMIN"] } };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const rows: TeacherRow[] = await this._prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        groupMembers: { where: { role: TEACHER_MEMBER_ROLE }, select: { group: { select: { id: true, name: true } } } },
        _count: { select: { createdGroups: true } },
      },
      orderBy: { name: "asc" },
    });

    const studentCounts: Map<string, number> = await this._countStudentsInGroups(
      rows.flatMap((row: TeacherRow) => row.groupMembers.map((member: { group: { id: string } }) => member.group.id)),
    );

    return rows.map((row: TeacherRow): AdminTeacherItem => {
      const groupIds: Set<string> = new Set(row.groupMembers.map((member: { group: { id: string } }) => member.group.id));

      return {
        id: row.id,
        name: row.name ?? undefined,
        email: row.email,
        role: row.role,
        image: row.image ?? undefined,
        createdAt: row.createdAt,
        groups: row.groupMembers.map((member: { group: { id: string; name: string } }) => member.group),
        studentCount: [...groupIds].reduce((sum: number, groupId: string) => sum + (studentCounts.get(groupId) ?? 0), 0),
        groupsCreated: row._count.createdGroups,
      };
    });
  }

  public async getPlatformCounts(todayStart: Date, activeSince: Date): Promise<PlatformCounts> {
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
      activeReservation,
      activeStudents,
      studentsWithCompletedModule,
      averageProgress,
      recentCompletions,
    ] = await Promise.all([
      this._prisma.user.count({ where: { role: "STUDENT" } }),
      this._prisma.user.count({ where: { role: "TEACHER" } }),
      this._prisma.user.count({ where: { role: "ADMIN" } }),
      this._prisma.group.count({ where: { isActive: true } }),
      this._prisma.module.count({ where: { isActive: true } }),
      this._prisma.lesson.count({ where: { isActive: true } }),
      this._prisma.clinicalCase.count({ where: { isActive: true } }),
      this._prisma.simulatorSession.count(),
      this._prisma.lessonCompletion.count({ where: { isCompleted: true, completedAt: { gte: todayStart } } }),
      this._prisma.ventilatorReservation.findFirst({
        where: { status: ACTIVE_RESERVATION_STATUS },
        select: { userId: true, groupId: true, leaderId: true },
      }),
      this._prisma.user.count({ where: { role: "STUDENT", userProgress: { some: { lastAccessedAt: { gte: activeSince } } } } }),
      this._prisma.user.count({ where: { role: "STUDENT", userProgress: { some: { isModuleCompleted: true } } } }),
      this._prisma.userProgress.aggregate({ _avg: { progressPercentage: true } }),
      this._prisma.lessonCompletion.findMany({
        where: { isCompleted: true },
        orderBy: { completedAt: "desc" },
        take: RECENT_COMPLETIONS_LIMIT,
        select: { userId: true, completedAt: true, user: { select: { name: true } }, lesson: { select: { title: true } } },
      }),
    ]);

    return {
      totalStudents,
      activeStudents,
      totalTeachers,
      totalAdmins,
      totalGroups,
      totalModules,
      totalLessons,
      totalEvaluations,
      totalSimulatorSessions,
      completionsToday,
      studentsWithCompletedModule,
      averageProgressPercentage: averageProgress._avg.progressPercentage ?? undefined,
      recentCompletions: recentCompletions.map((completion: (typeof recentCompletions)[number]) => ({
        userId: completion.userId,
        userName: completion.user.name ?? undefined,
        lessonTitle: completion.lesson.title,
        completedAt: completion.completedAt ?? undefined,
      })),
      activeReservation: activeReservation
        ? {
          userId: activeReservation.userId,
          groupId: activeReservation.groupId ?? undefined,
          leaderId: activeReservation.leaderId ?? undefined,
        }
        : undefined,
    };
  }

  private async _getTeacherGroupIds(teacherId: string): Promise<string[]> {
    const memberships: { groupId: string }[] = await this._prisma.groupMember.findMany({
      where: { userId: teacherId, role: TEACHER_MEMBER_ROLE },
      select: { groupId: true },
    });

    return memberships.map((membership: { groupId: string }) => membership.groupId);
  }

  private async _countStudentsInGroups(groupIds: string[]): Promise<Map<string, number>> {
    if (groupIds.length === 0) {
      return new Map<string, number>();
    }

    const memberships: { groupId: string }[] = await this._prisma.groupMember.findMany({
      where: { groupId: { in: [...new Set(groupIds)] }, role: STUDENT_MEMBER_ROLE },
      select: { groupId: true },
    });
    const counts: Map<string, number> = new Map<string, number>();

    for (const membership of memberships) {
      counts.set(membership.groupId, (counts.get(membership.groupId) ?? 0) + 1);
    }

    return counts;
  }

  private async _findQuizAttempts(userId: string): Promise<QuizAttemptActivityRow[]> {
    return await this._prisma.studentEvaluationAttempt.findMany({
      where: { AND: [QUIZ_RESULT_ATTEMPT_SCOPE, { userId }] },
      select: { ...QUIZ_RESULT_ATTEMPT_SELECT, startedAt: true, evaluation: { select: { legacyPassingScore: true, title: true } } },
      orderBy: { startedAt: "desc" },
      take: QUIZ_ATTEMPTS_LIMIT,
    });
  }
}
