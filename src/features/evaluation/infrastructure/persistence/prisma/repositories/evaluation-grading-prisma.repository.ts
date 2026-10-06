/*
 * Funcionalidad: Repositorio Prisma de lectura de la calificación docente de evaluaciones
 * Descripción: Implementa IEvaluationGradingRepository con Prisma sobre student_evaluation_attempts: alcance del profesor (asignación en un grupo STUDENT creado o supervisado, o intento heredado sin asignación de una evaluación que creó), filtro por grupo (asignación del grupo, o intento sin asignación de un miembro del grupo), cola PENDING_REVIEW paginada con evaluación y estudiante (sin intentos heredados, que se califican por las rutas heredadas), intentos en curso vencidos por el plazo del intento o el fin de la asignación, intentos GRADED sin publicar, notas publicadas y agregados por evaluación
 * Versión: 1.1
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
  type EvaluationGradeAggregateView,
  type GradingQueueItemView,
  type PublishedGradeView,
} from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { type EvaluationAssignmentScope } from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
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

const PUBLISHED_SELECT: {
  id: true;
  evaluationId: true;
  userId: true;
  attemptNumber: true;
  score: true;
  maxScore: true;
  grade: true;
  gradePublishedAt: true;
  legacySource: true;
  evaluation: { select: { title: true; type: true } };
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
  evaluation: { select: { title: true, type: true } },
};

interface PublishedRow {
  id: string;
  evaluationId: string;
  userId: string;
  attemptNumber: number;
  score: number | null;
  maxScore: number | null;
  grade: number | null;
  gradePublishedAt: Date | null;
  legacySource: string | null;
  evaluation: { title: string; type: EvaluationType };
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

function groupWhere(groupId: string): Prisma.StudentEvaluationAttemptWhereInput {
  return {
    OR: [{ assignment: { groupId } }, { assignmentId: null, user: { groupMembers: { some: { groupId } } } }],
  };
}

function filterConditions(filter: GradingAttemptFilter): Prisma.StudentEvaluationAttemptWhereInput[] {
  const conditions: Prisma.StudentEvaluationAttemptWhereInput[] = [];

  if (filter.evaluationId) conditions.push({ evaluationId: filter.evaluationId });
  if (filter.groupId) conditions.push(groupWhere(filter.groupId));
  if (filter.scope) conditions.push(scopeWhere(filter.scope));

  return conditions;
}

function toPublishedView(row: PublishedRow): PublishedGradeView[] {
  if (row.grade === null || row.gradePublishedAt === null) {
    return [];
  }

  return [
    {
      attemptId: row.id,
      evaluationId: row.evaluationId,
      evaluationTitle: row.evaluation.title,
      evaluationType: row.evaluation.type,
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

const PUBLISHED_WHERE: Prisma.StudentEvaluationAttemptWhereInput = { gradePublishedAt: { not: null }, grade: { not: null } };

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

  public async getPublishableAttempts(filter: GradingAttemptFilter): Promise<GradingAttemptKey[]> {
    return await this._prisma.studentEvaluationAttempt.findMany({
      where: { AND: [{ status: GRADED_STATUS, gradePublishedAt: null, grade: { not: null } }, ...filterConditions(filter)] },
      select: { id: true, evaluationId: true, userId: true },
    });
  }

  public async getPublishedGradesOfUser(userId: string): Promise<PublishedGradeView[]> {
    const rows: PublishedRow[] = await this._prisma.studentEvaluationAttempt.findMany({
      where: { AND: [{ userId }, PUBLISHED_WHERE] },
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

  public async getEvaluationStats(evaluationId: string, passingGrade: number): Promise<EvaluationGradeAggregateView> {
    const graded: Prisma.StudentEvaluationAttemptWhereInput = { evaluationId, status: GRADED_STATUS, grade: { not: null } };

    const [byStatus, gradeAggregate, publishedCount, passedCount] = await Promise.all([
      this._prisma.studentEvaluationAttempt.groupBy({ by: ["status"], where: { evaluationId }, _count: { _all: true } }),
      this._prisma.studentEvaluationAttempt.aggregate({
        where: graded,
        _count: { _all: true },
        _avg: { grade: true },
        _min: { grade: true },
        _max: { grade: true },
      }),
      this._prisma.studentEvaluationAttempt.count({ where: { evaluationId, ...PUBLISHED_WHERE } }),
      this._prisma.studentEvaluationAttempt.count({ where: { ...graded, grade: { gte: passingGrade } } }),
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
