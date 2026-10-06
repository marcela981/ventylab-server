/*
 * Funcionalidad: Repositorio Prisma de asignaciones de actividades
 * Descripción: Implementa IActivityAssignmentsRepository sobre evaluation_assignments de evaluaciones con legacySource 'activity' (visibleFrom = startsAt, dueDate = endsAt, isActive = legacyIsActive ?? true); al crear escribe startsAt = visibleFrom ?? creación y endsAt = dueDate ?? dueDate de la actividad, y conserva la unicidad heredada (actividad, grupo) bajo pg_advisory_xact_lock(hashtext('evaluations:structure:<id>')) con una verificación previa en la transacción que responde como la antigua restricción única (P2002, 409)
 * Versión: 2.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type EvaluationAssignment as EvaluationAssignmentModel, Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type ActivityAssignment,
  ACTIVITY_ASSIGNMENT_ENTITY_COLLECTION,
  ACTIVITY_ASSIGNMENT_ENTITY_TYPE,
} from "@/features/activities/domain/entities/activity-assignment.entity";
import { type ActivityAssignmentView, type AssignmentWindowView } from "@/features/activities/domain/read-models/activity.read-model";
import { type IActivityAssignmentsRepository } from "@/features/activities/domain/repositories/activity-assignments.repository";
import {
  ACTIVE_LEGACY_ASSIGNMENT_WHERE,
  ActivitiesMapper,
  ACTIVITY_LEGACY_SOURCE,
  type AssignmentWindowRow,
} from "@/features/activities/infrastructure/persistence/prisma/mappers/activities.mapper";

type AssignmentWithGroupRow = EvaluationAssignmentModel & {
  group: { id: string; name: string; parentGroupId: string | null; depth: number };
};

// Same key and hashing as the evaluation feature's structure lock, so legacy assignment writes serialize with its editor and activation.
function structureLockKey(evaluationId: string): string {
  return `evaluations:structure:${evaluationId}`;
}

function duplicateAssignmentError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed on the fields: (`evaluation_id`,`group_id`)", {
    code: "P2002",
    clientVersion: Prisma.prismaVersion.client,
    meta: { target: ["evaluation_id", "group_id"] },
  });
}

@Injectable()
export class ActivityAssignmentsPrismaRepository implements IActivityAssignmentsRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(assignmentId: string, transaction?: unknown): Promise<ActivityAssignment | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: EvaluationAssignmentModel | null = await client.evaluationAssignment.findFirst({
      where: { id: assignmentId, evaluation: { legacySource: ACTIVITY_LEGACY_SOURCE } },
    });

    return row ? ActivitiesMapper.toAssignment(row) : undefined;
  }

  public async getByActivityAndGroup(activityId: string, groupId: string, transaction?: unknown): Promise<ActivityAssignment | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: EvaluationAssignmentModel | null = await client.evaluationAssignment.findFirst({
      where: { evaluationId: activityId, groupId },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });

    return row ? ActivitiesMapper.toAssignment(row) : undefined;
  }

  public async getActiveForGroups(activityId: string, groupIds: string[], transaction?: unknown): Promise<AssignmentWindowView | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: AssignmentWindowRow | null = await client.evaluationAssignment.findFirst({
      where: { evaluationId: activityId, groupId: { in: groupIds }, ...ACTIVE_LEGACY_ASSIGNMENT_WHERE },
      select: { groupId: true, startsAt: true, endsAt: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });

    return row ? ActivitiesMapper.toAssignmentWindow(row) : undefined;
  }

  public async getActiveByActivity(activityId: string): Promise<ActivityAssignmentView[]> {
    const rows: AssignmentWithGroupRow[] = await this._prisma.evaluationAssignment.findMany({
      where: { evaluationId: activityId, ...ACTIVE_LEGACY_ASSIGNMENT_WHERE },
      include: { group: { select: { id: true, name: true, parentGroupId: true, depth: true } } },
      orderBy: [{ createdAt: "desc" }],
    });

    return rows.map((row: AssignmentWithGroupRow) => ({
      assignment: ActivitiesMapper.toAssignment(row),
      group: {
        id: row.group.id,
        name: row.group.name,
        parentGroupId: row.group.parentGroupId ?? undefined,
        depth: row.group.depth,
      },
    }));
  }

  public async save(assignment: ActivityAssignment, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const activity: { legacyDueDate: Date | null } | null = await client.evaluation.findUnique({
      where: { id: assignment.activityId },
      select: { legacyDueDate: true },
    });

    const data: Prisma.EvaluationAssignmentUncheckedCreateInput = ActivitiesMapper.toAssignmentPersistence(assignment, activity?.legacyDueDate ?? null);
    const existing: { id: string } | null = await client.evaluationAssignment.findUnique({ where: { id: assignment.id }, select: { id: true } });

    if (existing) {
      await client.evaluationAssignment.update({ where: { id: assignment.id }, data });
    } else {
      await this._create(client, data);
    }

    if (assignment.auditLogs.length > 0) {
      await this._auditLogRepository.save(
        ACTIVITY_ASSIGNMENT_ENTITY_COLLECTION,
        ACTIVITY_ASSIGNMENT_ENTITY_TYPE,
        assignment.id,
        assignment.auditLogs,
        transaction,
      );
    }
  }

  private async _create(client: PrismaExecutor, data: Prisma.EvaluationAssignmentUncheckedCreateInput): Promise<void> {
    // $executeRaw instead of $queryRaw: Prisma cannot deserialize the void column returned by pg_advisory_xact_lock
    await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${structureLockKey(data.evaluationId)}))`;

    const duplicate: { id: string } | null = await client.evaluationAssignment.findFirst({
      where: { evaluationId: data.evaluationId, groupId: data.groupId },
      select: { id: true },
    });

    if (duplicate) {
      throw duplicateAssignmentError();
    }

    await client.evaluationAssignment.create({ data });
  }
}
