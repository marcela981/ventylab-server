/*
 * Funcionalidad: Repositorio Prisma de lectura de la calificación docente de evaluaciones
 * Descripción: Implementa IEvaluationGradingRepository con Prisma sobre student_evaluation_attempts: alcance del profesor (asignación en un grupo STUDENT creado o supervisado, o intento heredado sin asignación de una evaluación que creó), filtro por grupo (asignación del grupo, o intento sin asignación de un miembro del grupo) y por estudiante, cola PENDING_REVIEW paginada con evaluación y estudiante y su conteo (sin intentos heredados, que se califican por las rutas heredadas), intentos en curso vencidos por el plazo del intento o el fin de la asignación, intentos GRADED sin publicar, notas publicadas (las de un usuario, opcionalmente en el alcance de un profesor) y agregados por evaluación (opcionalmente acotados al alcance de intentos de analítica de un profesor o a las asignaciones de un grupo); exporta la selección, el filtro, el filtro de alcance de intentos de analítica y el mapeo de notas publicadas que reutiliza el repositorio de analítica
 * Versión: 1.5
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type EvaluationAttemptStatus, type EvaluationType, GroupType, type Prisma } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type AttemptStatusCountsView,
  type EvaluationGradeAggregateView,
  type GradingAttemptListItemView,
  type GradingQueueItemView,
  type PublishedGradeView,
} from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAttemptScope } from "@/features/evaluation/domain/repositories/evaluation-analytics.repository";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  type GetGradingAttemptsQuery,
  type GetGradingQueueQuery,
  type GradingAttemptFilter,
  type GradingAttemptKey,
  type IEvaluationGradingRepository,
} from "@/features/evaluation/domain/repositories/evaluation-grading.repository";
import {
  EVALUATION_ATTEMPT_STATUS_VALUES,
  type EvaluationAttemptStatusValue,
} from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";

const IN_PROGRESS_STATUS: EvaluationAttemptStatus = "IN_PROGRESS";
const PENDING_REVIEW_STATUS: EvaluationAttemptStatus = "PENDING_REVIEW";
const GRADED_STATUS: EvaluationAttemptStatus = "GRADED";

const NEW_FLOW_PENDING_REVIEW_WHERE: Prisma.StudentEvaluationAttemptWhereInput = { status: PENDING_REVIEW_STATUS, legacySource: null };

const QUEUE_SELECT: {
  id: true;
  evaluationId: true;
  assignmentId: true;
  attemptNumber: true;
  status: true;
  submittedAt: true;
  score: true;
  maxScore: true;
  legacySource: true;
  userId: true;
  evaluation: { select: { title: true; type: true } };
  user: { select: { name: true; email: true } };
} = {
  id: true,
  evaluationId: true,
  assignmentId: true,
  attemptNumber: true,
  status: true,
  submittedAt: true,
  score: true,
  maxScore: true,
  legacySource: true,
  userId: true,
  evaluation: { select: { title: true, type: true } },
  user: { select: { name: true, email: true } },
};

interface QueueRow {
  id: string;
  evaluationId: string;
  assignmentId: string | null;
  attemptNumber: number;
  status: EvaluationAttemptStatus;
  submittedAt: Date | null;
  score: number | null;
  maxScore: number | null;
  legacySource: string | null;
  userId: string;
  evaluation: { title: string; type: EvaluationType };
  user: { name: string | null; email: string };
}

interface StatusCountRow {
  status: EvaluationAttemptStatus;
  _count: { _all: number };
}

const NEW_FLOW_WHERE: Prisma.StudentEvaluationAttemptWhereInput = { legacySource: null };

const ATTEMPT_LIST_SELECT: {
  id: true;
  evaluationId: true;
  assignmentId: true;
  attemptNumber: true;
  status: true;
  startedAt: true;
  submittedAt: true;
  score: true;
  maxScore: true;
  grade: true;
  gradePublishedAt: true;
  isLate: true;
  userId: true;
  assignment: { select: { groupId: true } };
  user: { select: { name: true; email: true } };
} = {
  id: true,
  evaluationId: true,
  assignmentId: true,
  attemptNumber: true,
  status: true,
  startedAt: true,
  submittedAt: true,
  score: true,
  maxScore: true,
  grade: true,
  gradePublishedAt: true,
  isLate: true,
  userId: true,
  assignment: { select: { groupId: true } },
  user: { select: { name: true, email: true } },
};

interface AttemptListRow {
  id: string;
  evaluationId: string;
  assignmentId: string | null;
  attemptNumber: number;
  status: EvaluationAttemptStatus;
  startedAt: Date;
  submittedAt: Date | null;
  score: number | null;
  maxScore: number | null;
  grade: number | null;
  gradePublishedAt: Date | null;
  isLate: boolean;
  userId: string;
  assignment: { groupId: string } | null;
  user: { name: string | null; email: string };
}

export const PUBLISHED_SELECT: {
  id: true;
  evaluationId: true;
  userId: true;
  attemptNumber: true;
  score: true;
  maxScore: true;
  grade: true;
  gradePublishedAt: true;
  legacySource: true;
  evaluation: { select: { title: true; type: true; moduleId: true; module: { select: { title: true } } } };
} = {
  id: true,
  evaluationId: true,
  userId: true,
  attemptNumber: true,
  score: true,
  maxScore: true,
  grade: true,
  gradePublishedAt: true,
  legacySource: true,
  evaluation: { select: { title: true, type: true, moduleId: true, module: { select: { title: true } } } },
};

export interface PublishedRow {
  id: string;
  evaluationId: string;
  userId: string;
  attemptNumber: number;
  score: number | null;
  maxScore: number | null;
  grade: number | null;
  gradePublishedAt: Date | null;
  legacySource: string | null;
  evaluation: { title: string; type: EvaluationType; moduleId: string | null; module: { title: string } | null };
}

function scopeWhere(scope: EvaluationAssignmentScope): Prisma.StudentEvaluationAttemptWhereInput {
  return {
    OR: [
      {
        assignment: {
          group: {
            type: GroupType.STUDENT,
            OR: [{ createdBy: scope.teacherId }, { id: { in: [...scope.supervisedGroupIds] } }],
          },
        },
      },
      { assignmentId: null, evaluation: { createdById: scope.teacherId } },
    ],
  };
}

export function attemptScopeWhere(scope: EvaluationAttemptScope): Prisma.StudentEvaluationAttemptWhereInput {
  if (scope.assignedOnly) {
    return { assignment: { groupId: { in: [...scope.groupIds] } } };
  }

  return {
    OR: [
      { assignment: { groupId: { in: [...scope.groupIds] } } },
      { assignmentId: null, evaluation: { createdById: scope.teacherId } },
    ],
  };
}

function groupWhere(groupId: string): Prisma.StudentEvaluationAttemptWhereInput {
  return {
    OR: [{ assignment: { groupId } }, { assignmentId: null, user: { groupMembers: { some: { groupId } } } }],
  };
}

function filterConditions(filter: GradingAttemptFilter): Prisma.StudentEvaluationAttemptWhereInput[] {
  const conditions: Prisma.StudentEvaluationAttemptWhereInput[] = [];

  if (filter.evaluationId) conditions.push({ evaluationId: filter.evaluationId });
  if (filter.groupId) conditions.push(groupWhere(filter.groupId));
  if (filter.studentId) conditions.push({ userId: filter.studentId });
  if (filter.scope) conditions.push(scopeWhere(filter.scope));

  return conditions;
}

export function toPublishedView(row: PublishedRow): PublishedGradeView[] {
  if (row.grade === null || row.gradePublishedAt === null) {
    return [];
  }

  return [
    {
      attemptId: row.id,
      evaluationId: row.evaluationId,
      evaluationTitle: row.evaluation.title,
      evaluationType: row.evaluation.type,
      moduleId: row.evaluation.moduleId ?? undefined,
      moduleTitle: row.evaluation.module?.title,
      userId: row.userId,
      attemptNumber: row.attemptNumber,
      score: row.score ?? undefined,
      maxScore: row.maxScore ?? undefined,
      grade: row.grade,
      publishedAt: row.gradePublishedAt,
      legacy: row.legacySource !== null,
    },
  ];
}

export const PUBLISHED_WHERE: Prisma.StudentEvaluationAttemptWhereInput = { gradePublishedAt: { not: null }, grade: { not: null } };

@Injectable()
export class EvaluationGradingPrismaRepository implements IEvaluationGradingRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getQueue(query: GetGradingQueueQuery): Promise<Paginated<GradingQueueItemView>> {
    const where: Prisma.StudentEvaluationAttemptWhereInput = { AND: [NEW_FLOW_PENDING_REVIEW_WHERE, ...filterConditions(query)] };

    const [rows, total] = await Promise.all([
      this._prisma.studentEvaluationAttempt.findMany({
        where,
        select: QUEUE_SELECT,
        orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this._prisma.studentEvaluationAttempt.count({ where }),
    ]);

    return new Paginated<GradingQueueItemView>({
      items: rows.map((row: QueueRow) => ({
        attemptId: row.id,
        evaluationId: row.evaluationId,
        evaluationTitle: row.evaluation.title,
        evaluationType: row.evaluation.type,
        assignmentId: row.assignmentId ?? undefined,
        attemptNumber: row.attemptNumber,
        student: { id: row.userId, name: row.user.name ?? undefined, email: row.user.email },
        status: row.status,
        submittedAt: row.submittedAt ?? undefined,
        score: row.score ?? undefined,
        maxScore: row.maxScore ?? undefined,
        legacy: row.legacySource !== null,
      })),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  public async countQueue(filter: GradingAttemptFilter): Promise<number> {
    return await this._prisma.studentEvaluationAttempt.count({ where: { AND: [NEW_FLOW_PENDING_REVIEW_WHERE, ...filterConditions(filter)] } });
  }

  public async getAttempts(query: GetGradingAttemptsQuery): Promise<Paginated<GradingAttemptListItemView>> {
    const statuses: Prisma.StudentEvaluationAttemptWhereInput[] = query.statuses && query.statuses.length > 0 ? [{ status: { in: [...query.statuses] } }] : [];
    const where: Prisma.StudentEvaluationAttemptWhereInput = { AND: [NEW_FLOW_WHERE, ...statuses, ...filterConditions(query)] };

    const [rows, total] = await Promise.all([
      this._prisma.studentEvaluationAttempt.findMany({
        where,
        select: ATTEMPT_LIST_SELECT,
        orderBy: [{ user: { name: "asc" } }, { user: { email: "asc" } }, { attemptNumber: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this._prisma.studentEvaluationAttempt.count({ where }),
    ]);

    return new Paginated<GradingAttemptListItemView>({
      items: rows.map((row: AttemptListRow) => ({
        attemptId: row.id,
        evaluationId: row.evaluationId,
        assignmentId: row.assignmentId ?? undefined,
        groupId: row.assignment?.groupId,
        attemptNumber: row.attemptNumber,
        student: { id: row.userId, name: row.user.name ?? undefined, email: row.user.email },
        status: row.status,
        startedAt: row.startedAt,
        submittedAt: row.submittedAt ?? undefined,
        score: row.score ?? undefined,
        maxScore: row.maxScore ?? undefined,
        grade: row.grade ?? undefined,
        gradePublishedAt: row.gradePublishedAt ?? undefined,
        isLate: row.isLate,
      })),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  public async countAttemptsByStatus(filter: GradingAttemptFilter): Promise<AttemptStatusCountsView> {
    const where: Prisma.StudentEvaluationAttemptWhereInput = { AND: [NEW_FLOW_WHERE, ...filterConditions(filter)] };

    // The result is typed in the callback: annotating the awaited groupBy breaks Prisma's overload inference
    return await this._prisma.studentEvaluationAttempt
      .groupBy({ by: ["status"], where, _count: { _all: true } })
      .then((groups: StatusCountRow[]): AttemptStatusCountsView => {
        const counts: Record<EvaluationAttemptStatusValue, number> = Object.fromEntries(
          EVALUATION_ATTEMPT_STATUS_VALUES.map((status: EvaluationAttemptStatusValue) => [status, 0]),
        ) as Record<EvaluationAttemptStatusValue, number>;

        for (const group of groups) {
          counts[group.status] = group._count._all;
        }

        return counts;
      });
  }

  public async getExpiredInProgressAttemptIds(filter: GradingAttemptFilter, cutoff: Date, limit: number): Promise<string[]> {
    const rows: Array<{ id: string }> = await this._prisma.studentEvaluationAttempt.findMany({
      where: {
        AND: [
          { status: IN_PROGRESS_STATUS, legacySource: null },
          { OR: [{ deadlineAt: { lt: cutoff } }, { assignment: { endsAt: { lt: cutoff } } }] },
          ...filterConditions(filter),
        ],
      },
      select: { id: true },
      orderBy: [{ startedAt: "asc" }, { id: "asc" }],
      take: limit,
    });

    return rows.map((row: { id: string }) => row.id);
  }

  public async isAttemptInScope(attemptId: string, scope: EvaluationAssignmentScope): Promise<boolean> {
    const count: number = await this._prisma.studentEvaluationAttempt.count({ where: { AND: [{ id: attemptId }, scopeWhere(scope)] } });

    return count > 0;
  }

  public async isGroupInScope(groupId: string, scope: EvaluationAssignmentScope): Promise<boolean> {
    const count: number = await this._prisma.group.count({
      where: { id: groupId, type: GroupType.STUDENT, OR: [{ createdBy: scope.teacherId }, { id: { in: [...scope.supervisedGroupIds] } }] },
    });

    return count > 0;
  }

  public async getPublishableAttempts(filter: GradingAttemptFilter): Promise<GradingAttemptKey[]> {
    return await this._prisma.studentEvaluationAttempt.findMany({
      where: { AND: [{ status: GRADED_STATUS, gradePublishedAt: null, grade: { not: null } }, ...filterConditions(filter)] },
      select: { id: true, evaluationId: true, userId: true },
    });
  }

  public async getPublishedGradesOfUser(userId: string, scope?: EvaluationAssignmentScope): Promise<PublishedGradeView[]> {
    const rows: PublishedRow[] = await this._prisma.studentEvaluationAttempt.findMany({
      where: { AND: [{ userId }, PUBLISHED_WHERE, ...(scope ? [scopeWhere(scope)] : [])] },
      select: PUBLISHED_SELECT,
      orderBy: [{ gradePublishedAt: "desc" }, { id: "asc" }],
    });

    return rows.flatMap((row: PublishedRow) => toPublishedView(row));
  }

  public async getPublishedGradesOfGroup(groupId: string, evaluationId?: string): Promise<PublishedGradeView[]> {
    const rows: PublishedRow[] = await this._prisma.studentEvaluationAttempt.findMany({
      where: { AND: [groupWhere(groupId), PUBLISHED_WHERE, ...(evaluationId ? [{ evaluationId }] : [])] },
      select: PUBLISHED_SELECT,
      orderBy: [{ evaluationId: "asc" }, { userId: "asc" }, { attemptNumber: "asc" }],
    });

    return rows.flatMap((row: PublishedRow) => toPublishedView(row));
  }

  public async getEvaluationStats(evaluationId: string, passingGrade: number, scope?: EvaluationAttemptScope): Promise<EvaluationGradeAggregateView> {
    const all: Prisma.StudentEvaluationAttemptWhereInput = { AND: [{ evaluationId }, ...(scope ? [attemptScopeWhere(scope)] : [])] };
    const graded: Prisma.StudentEvaluationAttemptWhereInput = { AND: [all, { status: GRADED_STATUS, grade: { not: null } }] };

    const [byStatus, gradeAggregate, publishedCount, passedCount] = await Promise.all([
      this._prisma.studentEvaluationAttempt.groupBy({ by: ["status"], where: all, _count: { _all: true } }),
      this._prisma.studentEvaluationAttempt.aggregate({
        where: graded,
        _count: { _all: true },
        _avg: { grade: true },
        _min: { grade: true },
        _max: { grade: true },
      }),
      this._prisma.studentEvaluationAttempt.count({ where: { AND: [all, PUBLISHED_WHERE] } }),
      this._prisma.studentEvaluationAttempt.count({ where: { AND: [graded, { grade: { gte: passingGrade } }] } }),
    ]);

    const attemptsByStatus: Record<EvaluationAttemptStatusValue, number> = Object.fromEntries(
      EVALUATION_ATTEMPT_STATUS_VALUES.map((status: EvaluationAttemptStatusValue) => [status, 0]),
    ) as Record<EvaluationAttemptStatusValue, number>;

    for (const group of byStatus) {
      attemptsByStatus[group.status] = group._count._all;
    }

    return {
      evaluationId,
      attemptsByStatus,
      publishedCount,
      gradedCount: gradeAggregate._count._all,
      averageGrade: gradeAggregate._avg.grade ?? undefined,
      minGrade: gradeAggregate._min.grade ?? undefined,
      maxGrade: gradeAggregate._max.grade ?? undefined,
      passedCount,
    };
  }

  public async countPendingReview(scope?: EvaluationAssignmentScope): Promise<number> {
    return await this._prisma.studentEvaluationAttempt.count({
      where: { AND: [NEW_FLOW_PENDING_REVIEW_WHERE, ...(scope ? [scopeWhere(scope)] : [])] },
    });
  }
}
