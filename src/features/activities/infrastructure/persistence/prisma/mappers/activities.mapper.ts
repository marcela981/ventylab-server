/*
 * Funcionalidad: Mapper de persistencia de actividades
 * Descripción: Traduce entre el modelo unificado de evaluaciones (evaluations con legacySource 'activity', evaluation_assignments y student_evaluation_attempts con legacySource 'activity_submission') y los agregados y vistas heredados de actividades, asignaciones y entregas: tipo y estado (ARCHIVED/READY/DRAFT) con el mismo mapeo de la migración, estado de entrega (IN_PROGRESS/PENDING_REVIEW+isLate/GRADED) y legacyPayload {content, feedback, gradedBy, gradedAt, status, groupId}
 * Versión: 2.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type EvaluationAssignment as EvaluationAssignmentModel,
  type EvaluationAttemptStatus,
  type EvaluationStatus,
  type EvaluationType,
  Prisma,
} from "@prisma/client";

import { ActivityAssignment } from "@/features/activities/domain/entities/activity-assignment.entity";
import { ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import { Activity } from "@/features/activities/domain/entities/activity.entity";
import {
  type AssignmentWindowView,
  type SubmissionActivityView,
  type SubmissionBriefView,
  type SubmissionPersonView,
} from "@/features/activities/domain/read-models/activity.read-model";
import { type ActivityTypeValue } from "@/features/activities/domain/value-objects/activity-type";
import {
  DRAFT_SUBMISSION_STATUS,
  GRADED_SUBMISSION_STATUS,
  LATE_SUBMISSION_STATUS,
  SUBMITTED_SUBMISSION_STATUS,
  type SubmissionStatusValue,
} from "@/features/activities/domain/value-objects/submission-status";

export const ACTIVITY_LEGACY_SOURCE: string = "activity";
export const ACTIVITY_SUBMISSION_LEGACY_SOURCE: string = "activity_submission";
export const RESET_ACTIVITY_SUBMISSION_LEGACY_SOURCE: string = "activity_submission_reset";

const ARCHIVED_STATUS: EvaluationStatus = "ARCHIVED";
const READY_STATUS: EvaluationStatus = "READY";
const DRAFT_STATUS: EvaluationStatus = "DRAFT";

const IN_PROGRESS_ATTEMPT_STATUS: EvaluationAttemptStatus = "IN_PROGRESS";
const PENDING_REVIEW_ATTEMPT_STATUS: EvaluationAttemptStatus = "PENDING_REVIEW";
const GRADED_ATTEMPT_STATUS: EvaluationAttemptStatus = "GRADED";

const ISO_TIMEZONE_SUFFIX: RegExp = /(Z|[+-]\d{2}:?\d{2})$/;

export const ACTIVE_LEGACY_ASSIGNMENT_WHERE: Prisma.EvaluationAssignmentWhereInput = {
  OR: [{ legacyIsActive: true }, { legacyIsActive: null }],
};

export const QUESTION_POINTS_INCLUDE: { questions: { select: { points: true } } } = { questions: { select: { points: true } } };

export interface QuestionPointsRow {
  points: number;
}

export interface ActivityEvaluationRow {
  id: string;
  type: EvaluationType;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  status: EvaluationStatus;
  createdById: string | null;
  legacyType: string | null;
  legacyMaxScore: number | null;
  legacyDueDate: Date | null;
  legacyInstructions: string | null;
  createdAt: Date;
  updatedAt: Date;
  questions: QuestionPointsRow[];
}

export interface AssignmentWindowRow {
  id?: string;
  groupId: string;
  startsAt: Date;
  endsAt: Date | null;
}

export interface AttemptRow {
  id: string;
  evaluationId: string;
  userId: string;
  status: EvaluationAttemptStatus;
  isLate: boolean;
  submittedAt: Date | null;
  score: number | null;
  maxScore: number | null;
  gradePublishedAt: Date | null;
  legacyPayload: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  assignment?: { groupId: string } | null;
}

export type SubmissionBriefRow = Pick<AttemptRow, "id" | "status" | "isLate" | "score" | "maxScore" | "submittedAt" | "gradePublishedAt" | "legacyPayload">;

export interface PersonRow {
  id: string;
  name: string | null;
  email: string;
}

export interface SubmissionActivityFields {
  instructions: boolean;
  dueDate: boolean;
}

interface LegacySubmissionPayload {
  content?: unknown;
  feedback?: unknown;
  gradedBy?: unknown;
  gradedAt?: unknown;
  groupId?: unknown;
}

function asPayload(value: Prisma.JsonValue): LegacySubmissionPayload {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

// The migration copied TIMESTAMP(3) UTC values into JSON without a zone designator; read them as UTC, not local time.
function parseLegacyDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  const date: Date = new Date(ISO_TIMEZONE_SUFFIX.test(value) ? value : `${value}Z`);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

interface AttemptGradeFields {
  score: number | null;
  maxScore: number | null;
  grade: number | null;
  gradePublishedAt: Date | null;
}

function gradeFieldsOf(submission: ActivitySubmission): AttemptGradeFields {
  const score: number | null = submission.score ?? null;
  const maxScore: number | null = submission.maxScore ?? null;

  return {
    score,
    maxScore,
    grade: score !== null && maxScore !== null && maxScore > 0 ? roundOneDecimal((5 * score) / maxScore) : null,
    gradePublishedAt: submission.status === GRADED_SUBMISSION_STATUS ? (submission.gradedAt ?? null) : null,
  };
}

export class ActivitiesMapper {
  public static toEvaluationType(type: ActivityTypeValue): EvaluationType {
    if (type === "EXAM" || type === "QUIZ") {
      return type;
    }

    return "WORKSHOP";
  }

  public static toEvaluationStatus(isActive: boolean, isPublished: boolean): EvaluationStatus {
    if (!isActive) {
      return ARCHIVED_STATUS;
    }

    return isPublished ? READY_STATUS : DRAFT_STATUS;
  }

  public static maxScoreOf(row: Pick<ActivityEvaluationRow, "legacyMaxScore" | "questions">): number {
    return row.legacyMaxScore ?? row.questions.reduce((total: number, question: QuestionPointsRow) => total + question.points, 0);
  }

  public static toActivity(row: ActivityEvaluationRow): Activity {
    return Activity.reconstitute({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      instructions: row.legacyInstructions ?? undefined,
      type: (row.legacyType ?? row.type) as ActivityTypeValue,
      maxScore: ActivitiesMapper.maxScoreOf(row),
      timeLimit: row.durationMinutes ?? undefined,
      dueDate: row.legacyDueDate ?? undefined,
      isPublished: row.status === READY_STATUS,
      isActive: row.status !== ARCHIVED_STATUS,
      createdBy: row.createdById ?? "",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toEvaluationUpdate(activity: Activity): Prisma.EvaluationUncheckedUpdateInput {
    return {
      type: ActivitiesMapper.toEvaluationType(activity.type),
      title: activity.title,
      description: activity.description ?? null,
      durationMinutes: activity.timeLimit ?? null,
      status: ActivitiesMapper.toEvaluationStatus(activity.isActive, activity.isPublished),
      createdById: activity.createdBy.length > 0 ? activity.createdBy : null,
      legacyType: activity.type,
      legacyMaxScore: activity.maxScore,
      legacyDueDate: activity.dueDate ?? null,
      legacyInstructions: activity.instructions ?? null,
      updatedAt: activity.updatedAt,
    };
  }

  public static toEvaluationCreate(activity: Activity): Prisma.EvaluationUncheckedCreateInput {
    return {
      id: activity.id,
      type: ActivitiesMapper.toEvaluationType(activity.type),
      title: activity.title,
      description: activity.description ?? null,
      durationMinutes: activity.timeLimit ?? null,
      maxAttempts: 1,
      shuffleQuestions: false,
      showResultsImmediately: false,
      status: ActivitiesMapper.toEvaluationStatus(activity.isActive, activity.isPublished),
      order: 0,
      createdById: activity.createdBy.length > 0 ? activity.createdBy : null,
      legacySource: ACTIVITY_LEGACY_SOURCE,
      legacyType: activity.type,
      legacyMaxScore: activity.maxScore,
      legacyDueDate: activity.dueDate ?? null,
      legacyInstructions: activity.instructions ?? null,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }

  public static toAssignment(row: EvaluationAssignmentModel): ActivityAssignment {
    return ActivityAssignment.reconstitute({
      id: row.id,
      activityId: row.evaluationId,
      groupId: row.groupId,
      assignedBy: row.assignedById ?? "",
      visibleFrom: row.startsAt,
      dueDate: row.endsAt ?? undefined,
      isActive: row.legacyIsActive ?? true,
      createdAt: row.createdAt,
      auditLogs: [],
    });
  }

  public static toAssignmentPersistence(
    assignment: ActivityAssignment,
    activityDueDate: Date | null,
  ): Prisma.EvaluationAssignmentUncheckedCreateInput {
    return {
      id: assignment.id,
      evaluationId: assignment.activityId,
      groupId: assignment.groupId,
      startsAt: assignment.visibleFrom ?? assignment.createdAt,
      endsAt: assignment.dueDate ?? activityDueDate,
      assignedById: assignment.assignedBy.length > 0 ? assignment.assignedBy : null,
      legacyIsActive: assignment.isActive,
      createdAt: assignment.createdAt,
    };
  }

  public static toAssignmentWindow(row: AssignmentWindowRow): AssignmentWindowView {
    return {
      id: row.id,
      groupId: row.groupId,
      dueDate: row.endsAt ?? undefined,
      visibleFrom: row.startsAt,
    };
  }

  public static toSubmissionStatus(status: EvaluationAttemptStatus, isLate: boolean): SubmissionStatusValue {
    if (status === IN_PROGRESS_ATTEMPT_STATUS) {
      return DRAFT_SUBMISSION_STATUS;
    }

    if (status === GRADED_ATTEMPT_STATUS) {
      return GRADED_SUBMISSION_STATUS;
    }

    return isLate ? LATE_SUBMISSION_STATUS : SUBMITTED_SUBMISSION_STATUS;
  }

  public static toAttemptStatus(status: SubmissionStatusValue): EvaluationAttemptStatus {
    if (status === DRAFT_SUBMISSION_STATUS) {
      return IN_PROGRESS_ATTEMPT_STATUS;
    }

    return status === GRADED_SUBMISSION_STATUS ? GRADED_ATTEMPT_STATUS : PENDING_REVIEW_ATTEMPT_STATUS;
  }

  public static gradedAtOf(row: Pick<AttemptRow, "gradePublishedAt" | "legacyPayload">): Date | undefined {
    return row.gradePublishedAt ?? parseLegacyDate(asPayload(row.legacyPayload).gradedAt);
  }

  public static toSubmission(row: AttemptRow): ActivitySubmission {
    const payload: LegacySubmissionPayload = asPayload(row.legacyPayload);

    return ActivitySubmission.reconstitute({
      id: row.id,
      activityId: row.evaluationId,
      userId: row.userId,
      groupId: asString(payload.groupId) ?? row.assignment?.groupId ?? undefined,
      status: ActivitiesMapper.toSubmissionStatus(row.status, row.isLate),
      content: payload.content ?? undefined,
      submittedAt: row.submittedAt ?? undefined,
      score: row.score ?? undefined,
      maxScore: row.maxScore ?? undefined,
      feedback: asString(payload.feedback),
      gradedBy: asString(payload.gradedBy),
      gradedAt: ActivitiesMapper.gradedAtOf(row),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toLegacyPayload(submission: ActivitySubmission): Prisma.InputJsonObject {
    return {
      content: submission.content ?? null,
      feedback: submission.feedback ?? null,
      gradedBy: submission.gradedBy ?? null,
      gradedAt: submission.gradedAt?.toISOString() ?? null,
      status: submission.status,
      groupId: submission.groupId ?? null,
    };
  }

  public static toAttemptUpdate(submission: ActivitySubmission): Prisma.StudentEvaluationAttemptUncheckedUpdateInput {
    const graded: boolean = submission.status === GRADED_SUBMISSION_STATUS;

    return {
      status: ActivitiesMapper.toAttemptStatus(submission.status),
      // A graded LATE submission keeps the isLate flag it already has.
      ...(graded ? {} : { isLate: submission.status === LATE_SUBMISSION_STATUS }),
      submittedAt: submission.submittedAt ?? null,
      ...gradeFieldsOf(submission),
      legacyPayload: ActivitiesMapper.toLegacyPayload(submission),
      updatedAt: submission.updatedAt,
    };
  }

  public static toAttemptCreate(
    submission: ActivitySubmission,
    attemptNumber: number,
    assignmentId: string | null,
  ): Prisma.StudentEvaluationAttemptUncheckedCreateInput {
    return {
      id: submission.id,
      evaluationId: submission.activityId,
      assignmentId,
      userId: submission.userId,
      attemptNumber,
      status: ActivitiesMapper.toAttemptStatus(submission.status),
      startedAt: submission.createdAt,
      submittedAt: submission.submittedAt ?? null,
      deadlineAt: null,
      ...gradeFieldsOf(submission),
      isLate: submission.status === LATE_SUBMISSION_STATUS,
      legacySource: ACTIVITY_SUBMISSION_LEGACY_SOURCE,
      legacyPayload: ActivitiesMapper.toLegacyPayload(submission),
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  public static toSubmissionBrief(row: SubmissionBriefRow): SubmissionBriefView {
    return {
      id: row.id,
      status: ActivitiesMapper.toSubmissionStatus(row.status, row.isLate),
      score: row.score ?? undefined,
      maxScore: row.maxScore ?? undefined,
      submittedAt: row.submittedAt ?? undefined,
      gradedAt: ActivitiesMapper.gradedAtOf(row),
    };
  }

  public static toSubmissionActivity(row: ActivityEvaluationRow, fields: SubmissionActivityFields): SubmissionActivityView {
    return {
      id: row.id,
      title: row.title,
      type: row.legacyType ?? row.type,
      instructions: fields.instructions ? (row.legacyInstructions ?? undefined) : undefined,
      dueDate: fields.dueDate ? (row.legacyDueDate ?? undefined) : undefined,
      maxScore: ActivitiesMapper.maxScoreOf(row),
    };
  }

  public static toPerson(row: PersonRow | null | undefined): SubmissionPersonView | undefined {
    return row ? { id: row.id, name: row.name ?? undefined, email: row.email } : undefined;
  }
}
