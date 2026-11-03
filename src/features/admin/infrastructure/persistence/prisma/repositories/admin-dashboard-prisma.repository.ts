/*
 * Funcionalidad: Repositorio Prisma de lectura del panel de administración
 * Descripción: Modelo de lectura que agrega en consultas directas tablas de varias features (users, group_members, groups, user_progress, lesson_completions, lessons, modules, evaluation_attempts, student_evaluation_attempts de evaluaciones QUIZ en lugar de la tabla congelada quiz_attempts, simulator_sessions, scores, clinical_cases y reservations, cuya reserva activa se deriva de la ventana SCHEDULED vigente), igual que el servicio de administración original; el listado de estudiantes filtra por nombre, correo o código y por grupos, y devuelve los grupos STUDENT activos y todos sus grupos STUDENT (para el alcance docente) sin calcular avance; no escribe en ninguna
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type GroupType, type Prisma, ReservationLifecycleStatus } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type AdminStudentActivity,
  type AdminStudentFilter,
  type AdminStudentPageRequest,
  type AdminStudentProfile,
  type AdminStudentRow,
  type AdminTeacherItem,
  type PlatformCounts,
} from "@/features/admin/domain/read-models/admin-dashboard.read-model";
import { type IAdminDashboardRepository } from "@/features/admin/domain/repositories/admin-dashboard.repository";
import {
  QUIZ_RESULT_ATTEMPT_SCOPE,
  QUIZ_RESULT_ATTEMPT_SELECT,
  type QuizResult,
  toQuizResult,
} from "@/features/progress/infrastructure/persistence/prisma/quiz-results";
import { type QuizAttemptRow } from "@/features/quizzes/infrastructure/persistence/prisma/mappers/quizzes.mapper";

const TEACHER_MEMBER_ROLE: string = "TEACHER";
const STUDENT_MEMBER_ROLE: string = "STUDENT";
const ACTIVE_RESERVATION_STATUS: ReservationLifecycleStatus = ReservationLifecycleStatus.SCHEDULED;
const RECENT_COMPLETIONS_LIMIT: number = 10;
const LESSON_COMPLETIONS_LIMIT: number = 50;
const QUIZ_ATTEMPTS_LIMIT: number = 30;

const STUDENT_GROUP_TYPE: GroupType = "STUDENT";

const STUDENT_ROW_SELECT: {
  id: true;
  name: true;
  email: true;
  studentCode: true;
  groupMembers: {
    where: Prisma.GroupMemberWhereInput;
    select: { group: { select: { id: true; name: true; isActive: true } } };
    orderBy: { joinedAt: "asc" };
  };
} = {
  id: true,
  name: true,
  email: true,
  studentCode: true,
  groupMembers: {
    where: { group: { type: STUDENT_GROUP_TYPE } },
    select: { group: { select: { id: true, name: true, isActive: true } } },
    orderBy: { joinedAt: "asc" },
  },
};

interface StudentListRow {
  id: string;
  name: string | null;
  email: string;
  studentCode: string | null;
  groupMembers: { group: { id: string; name: string; isActive: boolean } }[];
}

function toStudentRow(row: StudentListRow): AdminStudentRow {
  return {
    id: row.id,
    name: row.name ?? undefined,
    email: row.email,
    studentCode: row.studentCode ?? undefined,
    activeGroups: row.groupMembers.filter((member: StudentListRow["groupMembers"][number]) => member.group.isActive).map((member: StudentListRow["groupMembers"][number]) => ({ id: member.group.id, name: member.group.name })),
    groupIds: row.groupMembers.map((member: StudentListRow["groupMembers"][number]) => member.group.id),
  };
}

function studentWhere(filter: AdminStudentFilter): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = { role: "STUDENT" };

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { email: { contains: filter.search, mode: "insensitive" } },
      { studentCode: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  if (filter.groupIds !== undefined) {
    where.groupMembers = { some: { groupId: { in: [...filter.groupIds] } } };
  }

  return where;
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

  public async countStudents(filter: AdminStudentFilter): Promise<number> {
    return await this._prisma.user.count({ where: studentWhere(filter) });
  }

  public async getStudentPage(filter: AdminStudentFilter, page: AdminStudentPageRequest): Promise<AdminStudentRow[]> {
    const rows: StudentListRow[] = await this._prisma.user.findMany({
      where: studentWhere(filter),
      orderBy: [page.sortBy === "email" ? { email: page.sortOrder } : { name: page.sortOrder }, { id: "asc" }],
      skip: page.skip,
      take: page.take,
      select: STUDENT_ROW_SELECT,
    });

    return rows.map(toStudentRow);
  }

  public async getStudentIds(filter: AdminStudentFilter): Promise<string[]> {
    const rows: { id: string }[] = await this._prisma.user.findMany({
      where: studentWhere(filter),
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true },
    });

    return rows.map((row: { id: string }) => row.id);
  }

  public async getStudentRows(ids: readonly string[]): Promise<AdminStudentRow[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows: StudentListRow[] = await this._prisma.user.findMany({ where: { id: { in: [...ids] } }, select: STUDENT_ROW_SELECT });
    const byId: Map<string, AdminStudentRow> = new Map(rows.map((row: StudentListRow): [string, AdminStudentRow] => [row.id, toStudentRow(row)]));

    return ids.flatMap((id: string): AdminStudentRow[] => {
      const row: AdminStudentRow | undefined = byId.get(id);

      return row ? [row] : [];
    });
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
    const now: Date = new Date();

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
      this._prisma.reservation.findFirst({
        where: { status: ACTIVE_RESERVATION_STATUS, startsAt: { lte: now }, endsAt: { gt: now } },
        orderBy: { startsAt: "asc" },
        select: { userId: true, groupId: true, createdById: true },
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
          userId: activeReservation.userId ?? activeReservation.createdById,
          groupId: activeReservation.groupId ?? undefined,
          leaderId: undefined,
        }
        : undefined,
    };
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
