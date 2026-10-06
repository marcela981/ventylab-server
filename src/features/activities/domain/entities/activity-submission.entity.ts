/*
 * Funcionalidad: Entidad ActivitySubmission
 * Descripción: Agregado de la entrega de un estudiante para una actividad con las transiciones DRAFT a SUBMITTED o LATE (según la fecha límite de la actividad) y a GRADED, guardado de borrador, calificación y reinicio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { generateId } from "@/common/domain/utils/generate-id";
import {
  ActivitySubmissionAlreadyCompletedError,
  ActivitySubmissionNotSubmittedError,
  InvalidActivitySubmissionScoreError,
} from "@/features/activities/domain/activities.errors";
import {
  ActivitySubmissionDraftSavedEvent,
  ActivitySubmissionGradedEvent,
  ActivitySubmissionResetEvent,
  ActivitySubmissionStartedEvent,
  ActivitySubmissionSubmittedEvent,
} from "@/features/activities/domain/events/activity-submission.events";
import {
  DRAFT_SUBMISSION_STATUS,
  GRADED_SUBMISSION_STATUS,
  LATE_SUBMISSION_STATUS,
  SUBMITTED_SUBMISSION_STATUS,
  type SubmissionStatusValue,
} from "@/features/activities/domain/value-objects/submission-status";

export const ACTIVITY_SUBMISSION_ENTITY_COLLECTION: string = "activity_submissions";
export const ACTIVITY_SUBMISSION_ENTITY_TYPE: string = "activity_submission";

export type ActivitySubmissionAuditAction =
  | "activity_submission_started"
  | "activity_submission_draft_saved"
  | "activity_submission_submitted"
  | "activity_submission_graded"
  | "activity_submission_reset";

export class ActivitySubmission extends AggregateRoot {
  private _id: string;
  private _activityId: string;
  private _userId: string;
  private _groupId?: string;
  private _status: SubmissionStatusValue;
  private _content?: unknown;
  private _submittedAt?: Date;
  private _score?: number;
  private _maxScore?: number;
  private _feedback?: string;
  private _gradedBy?: string;
  private _gradedAt?: Date;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<ActivitySubmissionAuditAction>[];

  private constructor({
    id,
    activityId,
    userId,
    groupId,
    status,
    content,
    submittedAt,
    score,
    maxScore,
    feedback,
    gradedBy,
    gradedAt,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    activityId: string;
    userId: string;
    groupId?: string;
    status: SubmissionStatusValue;
    content?: unknown;
    submittedAt?: Date;
    score?: number;
    maxScore?: number;
    feedback?: string;
    gradedBy?: string;
    gradedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ActivitySubmissionAuditAction>[];
  }) {
    super();
    this._id = id;
    this._activityId = activityId;
    this._userId = userId;
    this._groupId = groupId;
    this._status = status;
    this._content = content;
    this._submittedAt = submittedAt;
    this._score = score;
    this._maxScore = maxScore;
    this._feedback = feedback;
    this._gradedBy = gradedBy;
    this._gradedAt = gradedAt;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get activityId(): string {
    return this._activityId;
  }

  public get userId(): string {
    return this._userId;
  }

  public get groupId(): string | undefined {
    return this._groupId;
  }

  public get status(): SubmissionStatusValue {
    return this._status;
  }

  public get content(): unknown {
    return this._content;
  }

  public get submittedAt(): Date | undefined {
    return this._submittedAt;
  }

  public get score(): number | undefined {
    return this._score;
  }

  public get maxScore(): number | undefined {
    return this._maxScore;
  }

  public get feedback(): string | undefined {
    return this._feedback;
  }

  public get gradedBy(): string | undefined {
    return this._gradedBy;
  }

  public get gradedAt(): Date | undefined {
    return this._gradedAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<ActivitySubmissionAuditAction>> {
    return this._auditLogs;
  }

  public static start({
    activityId,
    userId,
    groupId,
    maxScore,
  }: {
    activityId: string;
    userId: string;
    groupId?: string;
    maxScore: number;
  }): ActivitySubmission {
    const now: Date = new Date();

    const submission: ActivitySubmission = new ActivitySubmission({
      id: generateId(),
      activityId,
      userId,
      groupId,
      status: DRAFT_SUBMISSION_STATUS,
      content: undefined,
      maxScore,
      createdAt: now,
      updatedAt: now,
      auditLogs: [
        AuditLog.create<ActivitySubmissionAuditAction>({
          action: "activity_submission_started",
          performedByUserId: userId,
          metadata: { activityId, groupId: groupId ?? null },
        }),
      ],
    });

    submission.publishEvent(new ActivitySubmissionStartedEvent({ entity: submission, performedBy: userId }));

    return submission;
  }

  public static reconstitute({
    id,
    activityId,
    userId,
    groupId,
    status,
    content,
    submittedAt,
    score,
    maxScore,
    feedback,
    gradedBy,
    gradedAt,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    activityId: string;
    userId: string;
    groupId?: string;
    status: SubmissionStatusValue;
    content?: unknown;
    submittedAt?: Date;
    score?: number;
    maxScore?: number;
    feedback?: string;
    gradedBy?: string;
    gradedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ActivitySubmissionAuditAction>[];
  }): ActivitySubmission {
    return new ActivitySubmission({
      id,
      activityId,
      userId,
      groupId,
      status,
      content,
      submittedAt,
      score,
      maxScore,
      feedback,
      gradedBy,
      gradedAt,
      createdAt,
      updatedAt,
      auditLogs,
    });
  }

  public isOwnedBy(userId: string): boolean {
    return this._userId === userId;
  }

  public isCompleted(): boolean {
    return this._status === SUBMITTED_SUBMISSION_STATUS || this._status === GRADED_SUBMISSION_STATUS;
  }

  public saveDraft(content: unknown, performedBy: string): void {
    if (this._status !== DRAFT_SUBMISSION_STATUS) {
      throw new ActivitySubmissionAlreadyCompletedError();
    }

    if (content !== undefined) {
      this._content = content;
    }

    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<ActivitySubmissionAuditAction>({
        action: "activity_submission_draft_saved",
        performedByUserId: performedBy,
      }),
    );

    this.publishEvent(new ActivitySubmissionDraftSavedEvent({ entity: this, performedBy }));
  }

  public submit(activityDueDate: Date | undefined, performedBy: string): void {
    if (this._status !== DRAFT_SUBMISSION_STATUS) {
      throw new ActivitySubmissionAlreadyCompletedError();
    }

    const now: Date = new Date();
    const status: SubmissionStatusValue = activityDueDate && now > activityDueDate ? LATE_SUBMISSION_STATUS : SUBMITTED_SUBMISSION_STATUS;

    this._status = status;
    this._submittedAt = now;
    this._updatedAt = now;

    this._auditLogs.push(
      AuditLog.create<ActivitySubmissionAuditAction>({
        action: "activity_submission_submitted",
        performedByUserId: performedBy,
        metadata: { changes: { status: { before: DRAFT_SUBMISSION_STATUS, after: status } } },
      }),
    );

    this.publishEvent(new ActivitySubmissionSubmittedEvent({ entity: this, performedBy }));
  }

  public grade({
    score,
    feedback,
    graderId,
    activityMaxScore,
    activityType,
    activityTitle,
  }: {
    score: number;
    feedback?: string;
    graderId: string;
    activityMaxScore: number;
    activityType: string;
    activityTitle: string;
  }): void {
    if (this._status === DRAFT_SUBMISSION_STATUS) {
      throw new ActivitySubmissionNotSubmittedError();
    }

    const maxScore: number = this._maxScore ?? activityMaxScore;

    if (score < 0 || score > maxScore) {
      throw new InvalidActivitySubmissionScoreError();
    }

    const now: Date = new Date();
    const previousStatus: SubmissionStatusValue = this._status;
    const previousScore: number | undefined = this._score;

    this._status = GRADED_SUBMISSION_STATUS;
    this._score = score;
    this._maxScore = maxScore;
    this._feedback = feedback;
    this._gradedBy = graderId;
    this._gradedAt = now;
    this._updatedAt = now;

    this._auditLogs.push(
      AuditLog.create<ActivitySubmissionAuditAction>({
        action: "activity_submission_graded",
        performedByUserId: graderId,
        metadata: {
          maxScore,
          changes: {
            status: { before: previousStatus, after: GRADED_SUBMISSION_STATUS },
            score: { before: previousScore ?? null, after: score },
          },
        },
      }),
    );

    this.publishEvent(new ActivitySubmissionGradedEvent({ entity: this, activityType, activityTitle, performedBy: graderId }));
  }

  public reset(performedBy: string): void {
    this._auditLogs.push(
      AuditLog.create<ActivitySubmissionAuditAction>({
        action: "activity_submission_reset",
        performedByUserId: performedBy,
        metadata: { activityId: this._activityId, userId: this._userId, status: this._status },
      }),
    );

    this.publishEvent(new ActivitySubmissionResetEvent({ entity: this, performedBy }));
  }
}
