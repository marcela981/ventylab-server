/*
 * Funcionalidad: Repositorio Prisma de asignaciones de evaluación
 * Descripción: Implementa IEvaluationAssignmentsRepository con Prisma: carga, guarda y borra asignaciones, lee tipo y estado de los grupos destino, cuenta intentos, y arma las vistas por evaluación, del grupo de un estudiante y el listado paginado filtrando el estado derivado en la base con el instante de la consulta y el alcance del profesor (grupos STUDENT creados o supervisados)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type EvaluationAssignment as EvaluationAssignmentModel, type EvaluationAttemptStatus, GroupType, type Prisma } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import {
  type EvaluationAssignmentAttemptCounts,
  type EvaluationAssignmentGroupTarget,
  type EvaluationAssignmentView,
} from "@/features/evaluation/domain/read-models/evaluation-assignment.read-model";
import {
  type EvaluationAssignmentScope,
  type GetEvaluationAssignmentsQuery,
  type IEvaluationAssignmentsRepository,
} from "@/features/evaluation/domain/repositories/evaluation-assignments.repository";
import {
  ACTIVE_ASSIGNMENT_STATE,
  type EvaluationAssignmentStateValue,
  UPCOMING_ASSIGNMENT_STATE,
} from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";
import {
  EVALUATION_ASSIGNMENT_VIEW_INCLUDE,
  type EvaluationAssignmentViewRow,
  EvaluationAssignmentsMapper,
} from "@/features/evaluation/infrastructure/persistence/prisma/mappers/evaluation-assignments.mapper";

interface AttemptCountRow {
  assignmentId: string | null;
  status: EvaluationAttemptStatus;
  _count: { _all: number };
}

const ATTEMPT_COUNT_KEYS: Readonly<Record<EvaluationAttemptStatus, keyof EvaluationAssignmentAttemptCounts>> = {
  IN_PROGRESS: "inProgress",
  SUBMITTED: "submitted",
  PENDING_REVIEW: "pendingReview",
  GRADED: "graded",
};

function stateWhere(state: EvaluationAssignmentStateValue, now: Date): Prisma.EvaluationAssignmentWhereInput {
  const notDeactivated: Prisma.EvaluationAssignmentWhereInput = { OR: [{ legacyIsActive: null }, { legacyIsActive: true }] };
  const notEnded: Prisma.EvaluationAssignmentWhereInput = { OR: [{ endsAt: null }, { endsAt: { gte: now } }] };

  if (state === UPCOMING_ASSIGNMENT_STATE) {
    return { AND: [notDeactivated, notEnded, { startsAt: { gt: now } }] };
  }

  if (state === ACTIVE_ASSIGNMENT_STATE) {
    return { AND: [notDeactivated, notEnded, { startsAt: { lte: now } }] };
  }

  return { OR: [{ legacyIsActive: false }, { endsAt: { lt: now } }] };
}

function scopeWhere(scope: EvaluationAssignmentScope): Prisma.EvaluationAssignmentWhereInput {
  return {
    group: {
      type: GroupType.STUDENT,
      OR: [{ createdBy: scope.teacherId }, { id: { in: [...scope.supervisedGroupIds] } }],
    },
  };
}

@Injectable()
export class EvaluationAssignmentsPrismaRepository implements IEvaluationAssignmentsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getById(id: string, transaction?: unknown): Promise<EvaluationAssignment | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const row: EvaluationAssignmentModel | null = await client.evaluationAssignment.findUnique({ where: { id } });

    return row ? EvaluationAssignmentsMapper.toDomain(row) : undefined;
  }

  public async getByEvaluationAndGroups(evaluationId: string, groupIds: ReadonlyArray<string>, transaction?: unknown): Promise<EvaluationAssignment[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: EvaluationAssignmentModel[] = await client.evaluationAssignment.findMany({
      where: { evaluationId, groupId: { in: [...groupIds] } },
    });

    return rows.map((row: EvaluationAssignmentModel) => EvaluationAssignmentsMapper.toDomain(row));
  }

  public async getGroupTargets(groupIds: ReadonlyArray<string>, transaction?: unknown): Promise<EvaluationAssignmentGroupTarget[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    if (groupIds.length === 0) {
      return [];
    }

    return await client.group.findMany({
      where: { id: { in: [...groupIds] } },
      select: { id: true, name: true, type: true, isActive: true },
    });
  }

  public async countAttempts(assignmentId: string, transaction?: unknown): Promise<number> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.studentEvaluationAttempt.count({ where: { assignmentId } });
  }

  public async getViews(query: GetEvaluationAssignmentsQuery): Promise<Paginated<EvaluationAssignmentView>> {
    const { page, limit, ids, groupId, evaluationId, state, now, scope, createdAtFrom, createdAtTo, sortOrder } = query;

    const conditions: Prisma.EvaluationAssignmentWhereInput[] = [];

    if (ids && ids.length > 0) conditions.push({ id: { in: ids } });
    if (groupId) conditions.push({ groupId });
    if (evaluationId) conditions.push({ evaluationId });
    if (state) conditions.push(stateWhere(state, now));
    if (scope) conditions.push(scopeWhere(scope));

    if (createdAtFrom || createdAtTo) {
      conditions.push({ createdAt: { gte: createdAtFrom, lte: createdAtTo } });
    }

    const where: Prisma.EvaluationAssignmentWhereInput = { AND: conditions };

    const [rows, total] = await Promise.all([
      this._prisma.evaluationAssignment.findMany({
        where,
        include: EVALUATION_ASSIGNMENT_VIEW_INCLUDE,
        orderBy: [{ startsAt: sortOrder === "asc" ? "asc" : "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this._prisma.evaluationAssignment.count({ where }),
    ]);

    return new Paginated<EvaluationAssignmentView>({ items: await this._toViews(rows), total, page, limit });
  }

  public async getViewsByEvaluation(evaluationId: string, scope?: EvaluationAssignmentScope): Promise<EvaluationAssignmentView[]> {
    const conditions: Prisma.EvaluationAssignmentWhereInput[] = [{ evaluationId }];

    if (scope) {
      conditions.push(scopeWhere(scope));
    }

    const rows: EvaluationAssignmentViewRow[] = await this._prisma.evaluationAssignment.findMany({
      where: { AND: conditions },
      include: EVALUATION_ASSIGNMENT_VIEW_INCLUDE,
      orderBy: [{ startsAt: "desc" }, { id: "asc" }],
    });

    return await this._toViews(rows);
  }

  public async getStudentGroupViews(groupId: string): Promise<EvaluationAssignmentView[]> {
    const rows: EvaluationAssignmentViewRow[] = await this._prisma.evaluationAssignment.findMany({
      where: { groupId },
      include: EVALUATION_ASSIGNMENT_VIEW_INCLUDE,
      orderBy: [{ startsAt: "desc" }, { id: "asc" }],
    });

    return await this._toViews(rows);
  }

  public async save(assignment: EvaluationAssignment, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.EvaluationAssignmentUncheckedCreateInput = EvaluationAssignmentsMapper.toPersistence(assignment);

    await client.evaluationAssignment.upsert({ where: { id: assignment.id }, create: data, update: data });
  }

  public async delete(id: string, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.evaluationAssignment.delete({ where: { id } });
  }

  private async _toViews(rows: EvaluationAssignmentViewRow[]): Promise<EvaluationAssignmentView[]> {
    if (rows.length === 0) {
      return [];
    }

    const groups: AttemptCountRow[] = await this._prisma.studentEvaluationAttempt
      .groupBy({
        by: ["assignmentId", "status"],
        where: { assignmentId: { in: rows.map((row: EvaluationAssignmentViewRow) => row.id) } },
        _count: { _all: true },
      })
      .then((result: AttemptCountRow[]) => result);

    const counts: Map<string, EvaluationAssignmentAttemptCounts> = new Map<string, EvaluationAssignmentAttemptCounts>();

    for (const group of groups) {
      if (group.assignmentId === null) {
        continue;
      }

      const current: EvaluationAssignmentAttemptCounts = counts.get(group.assignmentId) ?? { inProgress: 0, submitted: 0, pendingReview: 0, graded: 0 };

      counts.set(group.assignmentId, { ...current, [ATTEMPT_COUNT_KEYS[group.status]]: group._count._all });
    }

    return rows.map((row: EvaluationAssignmentViewRow) => EvaluationAssignmentsMapper.toView(row, counts.get(row.id)));
  }
}
