/*
 * Funcionalidad: Repositorio Prisma de actividades
 * Descripción: Implementa IActivitiesRepository sobre evaluations con legacySource 'activity' (las tablas heredadas activities, activity_assignments y activity_submissions quedan congeladas): el detalle, los listados y el catálogo leen la evaluación con los puntos de sus preguntas, sus asignaciones activas en evaluation_assignments y las entregas de student_evaluation_attempts con legacySource 'activity_submission'; guardar crea o actualiza solo los campos que la ruta heredada administra; eliminar sigue siendo desactivar (status ARCHIVED), nunca un borrado físico
 * Versión: 2.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type EvaluationAssignment as EvaluationAssignmentModel, type Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type Activity, ACTIVITY_ENTITY_COLLECTION, ACTIVITY_ENTITY_TYPE } from "@/features/activities/domain/entities/activity.entity";
import { type ActivityDetailView, type ActivityListItemView } from "@/features/activities/domain/read-models/activity.read-model";
import { type GetActivityCatalogQuery, type IActivitiesRepository } from "@/features/activities/domain/repositories/activities.repository";
import {
  ACTIVE_LEGACY_ASSIGNMENT_WHERE,
  ActivitiesMapper,
  ACTIVITY_LEGACY_SOURCE,
  ACTIVITY_SUBMISSION_LEGACY_SOURCE,
  type ActivityEvaluationRow,
  type AssignmentWindowRow,
  QUESTION_POINTS_INCLUDE,
  type SubmissionBriefRow,
} from "@/features/activities/infrastructure/persistence/prisma/mappers/activities.mapper";

type ActivityWithAssignmentsRow = ActivityEvaluationRow & { assignments: EvaluationAssignmentModel[] };

type StudentActivityRow = ActivityEvaluationRow & {
  assignments: AssignmentWindowRow[];
  attempts: SubmissionBriefRow[];
};

type TeacherActivityRow = ActivityEvaluationRow & {
  assignments: AssignmentWindowRow[];
  _count: { attempts: number };
};

@Injectable()
export class ActivitiesPrismaRepository implements IActivitiesRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(activityId: string, transaction?: unknown): Promise<Activity | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: ActivityEvaluationRow | null = await client.evaluation.findFirst({
      where: { id: activityId, legacySource: ACTIVITY_LEGACY_SOURCE },
      include: QUESTION_POINTS_INCLUDE,
    });

    return row ? ActivitiesMapper.toActivity(row) : undefined;
  }

  public async getDetail(activityId: string): Promise<ActivityDetailView | undefined> {
    const row: ActivityWithAssignmentsRow | null = await this._prisma.evaluation.findFirst({
      where: { id: activityId, legacySource: ACTIVITY_LEGACY_SOURCE },
      include: { ...QUESTION_POINTS_INCLUDE, assignments: { where: ACTIVE_LEGACY_ASSIGNMENT_WHERE } },
    });

    if (!row) {
      return undefined;
    }

    return {
      activity: ActivitiesMapper.toActivity(row),
      assignments: row.assignments.map((assignment: EvaluationAssignmentModel) => ActivitiesMapper.toAssignment(assignment)),
    };
  }

  public async getStudentActivities(userId: string, groupIds: string[]): Promise<ActivityListItemView[]> {
    const rows: StudentActivityRow[] = await this._prisma.evaluation.findMany({
      where: {
        legacySource: ACTIVITY_LEGACY_SOURCE,
        status: "READY",
        assignments: { some: { groupId: { in: groupIds }, ...ACTIVE_LEGACY_ASSIGNMENT_WHERE } },
      },
      include: {
        ...QUESTION_POINTS_INCLUDE,
        assignments: {
          where: { groupId: { in: groupIds }, ...ACTIVE_LEGACY_ASSIGNMENT_WHERE },
          select: { groupId: true, startsAt: true, endsAt: true },
        },
        attempts: {
          where: { userId, legacySource: ACTIVITY_SUBMISSION_LEGACY_SOURCE },
          select: {
            id: true,
            status: true,
            isLate: true,
            score: true,
            maxScore: true,
            submittedAt: true,
            gradePublishedAt: true,
            legacyPayload: true,
          },
        },
      },
      orderBy: [{ legacyDueDate: "asc" }, { createdAt: "desc" }],
    });

    return rows.map((row: StudentActivityRow) => ({
      activity: ActivitiesMapper.toActivity(row),
      assignments: row.assignments.map((assignment: AssignmentWindowRow) => ActivitiesMapper.toAssignmentWindow(assignment)),
      submissions: row.attempts.map((attempt: SubmissionBriefRow) => ActivitiesMapper.toSubmissionBrief(attempt)),
    }));
  }

  public async getTeacherActivities(createdBy: string): Promise<ActivityListItemView[]> {
    const rows: TeacherActivityRow[] = await this._prisma.evaluation.findMany({
      where: { legacySource: ACTIVITY_LEGACY_SOURCE, createdById: createdBy, status: { not: "ARCHIVED" } },
      include: {
        ...QUESTION_POINTS_INCLUDE,
        assignments: {
          where: ACTIVE_LEGACY_ASSIGNMENT_WHERE,
          select: { id: true, groupId: true, startsAt: true, endsAt: true },
        },
        _count: { select: { attempts: { where: { legacySource: ACTIVITY_SUBMISSION_LEGACY_SOURCE } } } },
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    return rows.map((row: TeacherActivityRow) => ({
      activity: ActivitiesMapper.toActivity(row),
      assignments: row.assignments.map((assignment: AssignmentWindowRow) => ActivitiesMapper.toAssignmentWindow(assignment)),
      submissionsCount: row._count.attempts,
    }));
  }

  public async getCatalog(query: GetActivityCatalogQuery): Promise<Activity[]> {
    const where: Prisma.EvaluationWhereInput = { legacySource: ACTIVITY_LEGACY_SOURCE, status: { not: "ARCHIVED" } };

    if (query.type) where.legacyType = query.type;
    if (query.publishedOnly) where.status = "READY";

    const rows: ActivityEvaluationRow[] = await this._prisma.evaluation.findMany({
      where,
      include: QUESTION_POINTS_INCLUDE,
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row: ActivityEvaluationRow) => ActivitiesMapper.toActivity(row));
  }

  public async save(activity: Activity, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.evaluation.upsert({
      where: { id: activity.id },
      create: ActivitiesMapper.toEvaluationCreate(activity),
      update: ActivitiesMapper.toEvaluationUpdate(activity),
    });

    if (activity.auditLogs.length > 0) {
      await this._auditLogRepository.save(ACTIVITY_ENTITY_COLLECTION, ACTIVITY_ENTITY_TYPE, activity.id, activity.auditLogs, transaction);
    }
  }
}
