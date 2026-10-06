/*
 * Funcionalidad: Repositorio Prisma de entregas de actividades
 * Descripción: Implementa IActivitySubmissionsRepository sobre student_evaluation_attempts con legacySource 'activity_submission' (contenido, retroalimentación, calificador, fecha de calificación, estado original y grupo en legacyPayload); crear toma pg_advisory_xact_lock(hashtext('evaluations:attempt:<evaluationId>:<userId>')), verifica en la transacción que no exista otra entrega del estudiante y numera el intento, y una carrera (P2002) responde con el 409 heredado; reiniciar borra la entrega como antes salvo si está calificada, en cuyo caso conserva la fila con legacySource 'activity_submission_reset' para no perder la nota; las vistas incluyen actividad, estudiante y calificador con los mismos campos que la implementación anterior
 * Versión: 2.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { ActivitySubmissionAlreadyCompletedError } from "@/features/activities/domain/activities.errors";
import {
  type ActivitySubmission,
  ACTIVITY_SUBMISSION_ENTITY_COLLECTION,
  ACTIVITY_SUBMISSION_ENTITY_TYPE,
} from "@/features/activities/domain/entities/activity-submission.entity";
import { type ActivitySubmissionView } from "@/features/activities/domain/read-models/activity.read-model";
import { type IActivitySubmissionsRepository } from "@/features/activities/domain/repositories/activity-submissions.repository";
import { GRADED_SUBMISSION_STATUS } from "@/features/activities/domain/value-objects/submission-status";
import {
  ACTIVE_LEGACY_ASSIGNMENT_WHERE,
  ActivitiesMapper,
  ACTIVITY_SUBMISSION_LEGACY_SOURCE,
  type ActivityEvaluationRow,
  type AttemptRow,
  type PersonRow,
  RESET_ACTIVITY_SUBMISSION_LEGACY_SOURCE,
  type SubmissionActivityFields,
} from "@/features/activities/infrastructure/persistence/prisma/mappers/activities.mapper";

type SubmissionViewRow = AttemptRow & {
  evaluation?: ActivityEvaluationRow;
  user?: PersonRow;
};

const PERSON_SELECT: { id: true; name: true; email: true } = { id: true, name: true, email: true };

const ASSIGNMENT_GROUP_INCLUDE: { assignment: { select: { groupId: true } } } = { assignment: { select: { groupId: true } } };

const EVALUATION_VIEW_INCLUDE: { evaluation: { include: { questions: { select: { points: true } } } } } = {
  evaluation: { include: { questions: { select: { points: true } } } },
};

const ID_ONLY_ACTIVITY: SubmissionActivityFields = { instructions: false, dueDate: false };

// Same key and hashing as the evaluation feature's attempt lock, so legacy and new attempt writes of a student serialize.
function attemptLockKey(evaluationId: string, userId: string): string {
  return `evaluations:attempt:${evaluationId}:${userId}`;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

@Injectable()
export class ActivitySubmissionsPrismaRepository implements IActivitySubmissionsRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(submissionId: string, transaction?: unknown): Promise<ActivitySubmission | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: AttemptRow | null = await client.studentEvaluationAttempt.findFirst({
      where: { id: submissionId, legacySource: ACTIVITY_SUBMISSION_LEGACY_SOURCE },
      include: ASSIGNMENT_GROUP_INCLUDE,
    });

    return row ? ActivitiesMapper.toSubmission(row) : undefined;
  }

  public async getByActivityAndUser(activityId: string, userId: string, transaction?: unknown): Promise<ActivitySubmission | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: AttemptRow | null = await client.studentEvaluationAttempt.findFirst({
      where: { evaluationId: activityId, userId, legacySource: ACTIVITY_SUBMISSION_LEGACY_SOURCE },
      include: ASSIGNMENT_GROUP_INCLUDE,
      orderBy: { attemptNumber: "desc" },
    });

    return row ? ActivitiesMapper.toSubmission(row) : undefined;
  }

  public async getViewById(submissionId: string): Promise<ActivitySubmissionView | undefined> {
    const row: SubmissionViewRow | null = await this._prisma.studentEvaluationAttempt.findFirst({
      where: { id: submissionId, legacySource: ACTIVITY_SUBMISSION_LEGACY_SOURCE },
      include: { ...ASSIGNMENT_GROUP_INCLUDE, ...EVALUATION_VIEW_INCLUDE, user: { select: PERSON_SELECT } },
    });

    if (!row) {
      return undefined;
    }

    const graders: Map<string, PersonRow> = await this._loadGraders([row]);

    return this._toView(row, graders, { instructions: true, dueDate: false });
  }

  public async getViewByActivityAndUser(activityId: string, userId: string): Promise<ActivitySubmissionView | undefined> {
    const row: SubmissionViewRow | null = await this._prisma.studentEvaluationAttempt.findFirst({
      where: { evaluationId: activityId, userId, legacySource: ACTIVITY_SUBMISSION_LEGACY_SOURCE },
      include: { ...ASSIGNMENT_GROUP_INCLUDE, ...EVALUATION_VIEW_INCLUDE },
      orderBy: { attemptNumber: "desc" },
    });

    return row ? this._toView(row, undefined, ID_ONLY_ACTIVITY) : undefined;
  }

  public async getViewsByUser(userId: string): Promise<ActivitySubmissionView[]> {
    const rows: SubmissionViewRow[] = await this._prisma.studentEvaluationAttempt.findMany({
      where: { userId, legacySource: ACTIVITY_SUBMISSION_LEGACY_SOURCE },
      include: { ...ASSIGNMENT_GROUP_INCLUDE, ...EVALUATION_VIEW_INCLUDE },
      orderBy: [{ updatedAt: "desc" }],
    });

    return rows.map((row: SubmissionViewRow) => this._toView(row, undefined, { instructions: false, dueDate: true }));
  }

  public async getViewsByActivity(activityId: string, groupId?: string): Promise<ActivitySubmissionView[]> {
    const rows: SubmissionViewRow[] = await this._prisma.studentEvaluationAttempt.findMany({
      where: {
        evaluationId: activityId,
        legacySource: ACTIVITY_SUBMISSION_LEGACY_SOURCE,
        ...(groupId ? { legacyPayload: { path: ["groupId"], equals: groupId } } : {}),
      },
      include: { ...ASSIGNMENT_GROUP_INCLUDE, user: { select: PERSON_SELECT } },
      orderBy: [{ submittedAt: "desc" }],
    });

    const graders: Map<string, PersonRow> = await this._loadGraders(rows);

    return rows.map((row: SubmissionViewRow) => this._toView(row, graders));
  }

  public async save(submission: ActivitySubmission, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const existing: { id: string } | null = await client.studentEvaluationAttempt.findUnique({
      where: { id: submission.id },
      select: { id: true },
    });

    if (existing) {
      await client.studentEvaluationAttempt.update({ where: { id: submission.id }, data: ActivitiesMapper.toAttemptUpdate(submission) });
    } else {
      await this._create(client, submission);
    }

    await this._saveAuditLogs(submission, transaction);
  }

  public async delete(submission: ActivitySubmission, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    if (submission.status === GRADED_SUBMISSION_STATUS) {
      await client.studentEvaluationAttempt.update({
        where: { id: submission.id },
        data: {
          legacySource: RESET_ACTIVITY_SUBMISSION_LEGACY_SOURCE,
          legacyPayload: { ...ActivitiesMapper.toLegacyPayload(submission), resetAt: new Date().toISOString() },
        },
      });
    } else {
      await client.studentEvaluationAttempt.delete({ where: { id: submission.id } });
    }

    await this._saveAuditLogs(submission, transaction);
  }

  private async _create(client: PrismaExecutor, submission: ActivitySubmission): Promise<void> {
    const evaluationId: string = submission.activityId;
    const userId: string = submission.userId;

    // $executeRaw instead of $queryRaw: Prisma cannot deserialize the void column returned by pg_advisory_xact_lock
    await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${attemptLockKey(evaluationId, userId)}))`;

    const current: { id: string } | null = await client.studentEvaluationAttempt.findFirst({
      where: { evaluationId, userId, legacySource: ACTIVITY_SUBMISSION_LEGACY_SOURCE },
      select: { id: true },
    });

    if (current) {
      throw new ActivitySubmissionAlreadyCompletedError();
    }

    const last: { _max: { attemptNumber: number | null } } = await client.studentEvaluationAttempt.aggregate({
      where: { evaluationId, userId },
      _max: { attemptNumber: true },
    });

    const assignment: { id: string } | null = submission.groupId
      ? await client.evaluationAssignment.findFirst({
        where: { evaluationId, groupId: submission.groupId, ...ACTIVE_LEGACY_ASSIGNMENT_WHERE },
        select: { id: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      })
      : null;

    try {
      await client.studentEvaluationAttempt.create({
        data: ActivitiesMapper.toAttemptCreate(submission, (last._max.attemptNumber ?? 0) + 1, assignment?.id ?? null),
      });
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new ActivitySubmissionAlreadyCompletedError();
      }

      throw error;
    }
  }

  private async _loadGraders(rows: AttemptRow[]): Promise<Map<string, PersonRow>> {
    const graderIds: string[] = [
      ...new Set(rows.flatMap((row: AttemptRow) => {
        const gradedBy: string | undefined = ActivitiesMapper.toSubmission(row).gradedBy;

        return gradedBy ? [gradedBy] : [];
      })),
    ];

    if (graderIds.length === 0) {
      return new Map<string, PersonRow>();
    }

    const graders: PersonRow[] = await this._prisma.user.findMany({ where: { id: { in: graderIds } }, select: PERSON_SELECT });

    return new Map<string, PersonRow>(graders.map((grader: PersonRow) => [grader.id, grader]));
  }

  private async _saveAuditLogs(submission: ActivitySubmission, transaction?: unknown): Promise<void> {
    if (submission.auditLogs.length > 0) {
      await this._auditLogRepository.save(
        ACTIVITY_SUBMISSION_ENTITY_COLLECTION,
        ACTIVITY_SUBMISSION_ENTITY_TYPE,
        submission.id,
        submission.auditLogs,
        transaction,
      );
    }
  }

  private _toView(row: SubmissionViewRow, graders?: Map<string, PersonRow>, activityFields?: SubmissionActivityFields): ActivitySubmissionView {
    const submission: ActivitySubmission = ActivitiesMapper.toSubmission(row);

    return {
      submission,
      activity: row.evaluation && activityFields ? ActivitiesMapper.toSubmissionActivity(row.evaluation, activityFields) : undefined,
      student: ActivitiesMapper.toPerson(row.user),
      grader: graders && submission.gradedBy ? ActivitiesMapper.toPerson(graders.get(submission.gradedBy)) : undefined,
    };
  }
}
