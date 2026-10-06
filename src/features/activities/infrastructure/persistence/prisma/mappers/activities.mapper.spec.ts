/*
 * Funcionalidad: Pruebas del mapper de persistencia de actividades
 * Descripción: Verifica la traducción entre el modelo unificado de evaluaciones y los agregados heredados: tipo (TALLER → WORKSHOP con legacyType), estado ARCHIVED/READY/DRAFT de ida y vuelta, puntaje máximo heredado o suma de puntos, asignación (visibleFrom = startsAt, dueDate = endsAt con respaldo en el dueDate de la actividad, isActive = legacyIsActive ?? true), estado de entrega con isLate, legacyPayload, nota round(5·score/maxScore, 1) y gradedAt migrado sin zona leído como UTC
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAssignment as EvaluationAssignmentModel, type Prisma } from "@prisma/client";

import { ActivityAssignment } from "@/features/activities/domain/entities/activity-assignment.entity";
import { ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import { Activity } from "@/features/activities/domain/entities/activity.entity";
import { type SubmissionStatusValue } from "@/features/activities/domain/value-objects/submission-status";
import {
  ActivitiesMapper,
  type ActivityEvaluationRow,
  type AttemptRow,
} from "@/features/activities/infrastructure/persistence/prisma/mappers/activities.mapper";

const CREATED_AT: Date = new Date("2026-01-10T08:00:00.000Z");
const DUE_DATE: Date = new Date("2026-02-01T23:59:00.000Z");

function evaluationRow(overrides: Partial<ActivityEvaluationRow> = {}): ActivityEvaluationRow {
  return {
    id: "activity-1",
    type: "WORKSHOP",
    title: "Workshop",
    description: null,
    durationMinutes: 45,
    status: "READY",
    createdById: "teacher-1",
    legacyType: "TALLER",
    legacyMaxScore: 50,
    legacyDueDate: DUE_DATE,
    legacyInstructions: "Read the case",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    questions: [{ points: 2 }, { points: 3 }],
    ...overrides,
  };
}

function attemptRow(overrides: Partial<AttemptRow> = {}): AttemptRow {
  return {
    id: "submission-1",
    evaluationId: "activity-1",
    userId: "student-1",
    status: "PENDING_REVIEW",
    isLate: false,
    submittedAt: CREATED_AT,
    score: null,
    maxScore: 50,
    gradePublishedAt: null,
    legacyPayload: { content: { text: "answer" }, feedback: null, gradedBy: null, gradedAt: null, status: "SUBMITTED", groupId: "group-1" },
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    assignment: null,
    ...overrides,
  };
}

function submission(status: SubmissionStatusValue, overrides: Partial<Parameters<typeof ActivitySubmission.reconstitute>[0]> = {}): ActivitySubmission {
  return ActivitySubmission.reconstitute({
    id: "submission-1",
    activityId: "activity-1",
    userId: "student-1",
    groupId: "group-1",
    status,
    content: { text: "answer" },
    maxScore: 50,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    auditLogs: [],
    ...overrides,
  });
}

describe("ActivitiesMapper", () => {
  it("maps a legacy activity evaluation back to the Activity shape", () => {
    const activity: Activity = ActivitiesMapper.toActivity(evaluationRow());

    expect(activity).toMatchObject({
      type: "TALLER",
      maxScore: 50,
      timeLimit: 45,
      dueDate: DUE_DATE,
      instructions: "Read the case",
      isActive: true,
      isPublished: true,
      createdBy: "teacher-1",
    });
  });

  it("falls back to the sum of question points and derives isActive/isPublished from the status", () => {
    expect(ActivitiesMapper.toActivity(evaluationRow({ legacyMaxScore: null, status: "DRAFT" }))).toMatchObject({
      maxScore: 5,
      isActive: true,
      isPublished: false,
    });
    expect(ActivitiesMapper.toActivity(evaluationRow({ status: "ARCHIVED" }))).toMatchObject({ isActive: false, isPublished: false });
    expect(ActivitiesMapper.toActivity(evaluationRow({ legacyType: null, type: "EXAM" })).type).toBe("EXAM");
  });

  it("writes a new activity as a legacy evaluation with the migration's type and status mapping", () => {
    const activity: Activity = Activity.create({ title: "Lab", type: "TALLER", maxScore: 20, dueDate: DUE_DATE, instructions: "Do it", createdBy: "teacher-1" });

    const data: Prisma.EvaluationUncheckedCreateInput = ActivitiesMapper.toEvaluationCreate(activity);

    expect(data).toMatchObject({
      id: activity.id,
      type: "WORKSHOP",
      status: "DRAFT",
      legacySource: "activity",
      legacyType: "TALLER",
      legacyMaxScore: 20,
      legacyDueDate: DUE_DATE,
      legacyInstructions: "Do it",
      createdById: "teacher-1",
      maxAttempts: 1,
    });
    expect(ActivitiesMapper.toEvaluationStatus(false, true)).toBe("ARCHIVED");
    expect(ActivitiesMapper.toEvaluationStatus(true, true)).toBe("READY");
    expect(ActivitiesMapper.toEvaluationType("QUIZ")).toBe("QUIZ");
    expect(ActivitiesMapper.toEvaluationType("EXAM")).toBe("EXAM");
    expect(ActivitiesMapper.toEvaluationType("WORKSHOP")).toBe("WORKSHOP");
  });

  it("maps evaluation assignments to the legacy assignment shape and back", () => {
    const row: EvaluationAssignmentModel = {
      id: "assignment-1",
      evaluationId: "activity-1",
      groupId: "group-1",
      startsAt: CREATED_AT,
      endsAt: null,
      assignedById: "teacher-1",
      legacyIsActive: null,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    };

    expect(ActivitiesMapper.toAssignment(row)).toMatchObject({ activityId: "activity-1", visibleFrom: CREATED_AT, dueDate: undefined, isActive: true, assignedBy: "teacher-1" });
    expect(ActivitiesMapper.toAssignment({ ...row, legacyIsActive: false }).isActive).toBe(false);

    const assignment: ActivityAssignment = ActivityAssignment.create({ activityId: "activity-1", groupId: "group-1", assignedBy: "teacher-1" });

    expect(ActivitiesMapper.toAssignmentPersistence(assignment, DUE_DATE)).toMatchObject({
      evaluationId: "activity-1",
      startsAt: assignment.createdAt,
      endsAt: DUE_DATE,
      legacyIsActive: true,
    });
    expect(ActivitiesMapper.toAssignmentPersistence(assignment, null).endsAt).toBeNull();
  });

  it("maps attempt statuses back to submission statuses", () => {
    expect(ActivitiesMapper.toSubmissionStatus("IN_PROGRESS", false)).toBe("DRAFT");
    expect(ActivitiesMapper.toSubmissionStatus("PENDING_REVIEW", true)).toBe("LATE");
    expect(ActivitiesMapper.toSubmissionStatus("PENDING_REVIEW", false)).toBe("SUBMITTED");
    expect(ActivitiesMapper.toSubmissionStatus("SUBMITTED", false)).toBe("SUBMITTED");
    expect(ActivitiesMapper.toSubmissionStatus("GRADED", true)).toBe("GRADED");
  });

  it("reads content, feedback, grader and group from legacyPayload and a migrated gradedAt as UTC", () => {
    const graded: ActivitySubmission = ActivitiesMapper.toSubmission(
      attemptRow({
        status: "GRADED",
        score: 40,
        legacyPayload: { content: { text: "answer" }, feedback: "Good", gradedBy: "teacher-1", gradedAt: "2026-01-12T10:30:00.123", status: "GRADED", groupId: null },
        assignment: { groupId: "group-2" },
      }),
    );

    expect(graded).toMatchObject({
      status: "GRADED",
      content: { text: "answer" },
      feedback: "Good",
      gradedBy: "teacher-1",
      groupId: "group-2",
      score: 40,
      maxScore: 50,
    });
    expect(graded.gradedAt?.toISOString()).toBe("2026-01-12T10:30:00.123Z");
  });

  it("writes submission state with the grade, publication and late flag", () => {
    const gradedAt: Date = new Date("2026-01-15T12:00:00.000Z");

    const update: Prisma.StudentEvaluationAttemptUncheckedUpdateInput = ActivitiesMapper.toAttemptUpdate(
      submission("GRADED", { score: 37, feedback: "Ok", gradedBy: "teacher-1", gradedAt }),
    );

    expect(update).toMatchObject({
      status: "GRADED",
      score: 37,
      maxScore: 50,
      grade: 3.7,
      gradePublishedAt: gradedAt,
      legacyPayload: { content: { text: "answer" }, feedback: "Ok", gradedBy: "teacher-1", gradedAt: gradedAt.toISOString(), status: "GRADED", groupId: "group-1" },
    });
    expect(update).not.toHaveProperty("isLate");
    expect(ActivitiesMapper.toAttemptUpdate(submission("LATE"))).toMatchObject({ status: "PENDING_REVIEW", isLate: true, grade: null, gradePublishedAt: null });
    expect(ActivitiesMapper.toAttemptUpdate(submission("DRAFT"))).toMatchObject({ status: "IN_PROGRESS", isLate: false });
  });

  it("creates new attempts as activity_submission rows", () => {
    const data: Prisma.StudentEvaluationAttemptUncheckedCreateInput = ActivitiesMapper.toAttemptCreate(submission("DRAFT"), 2, "assignment-1");

    expect(data).toMatchObject({
      id: "submission-1",
      evaluationId: "activity-1",
      assignmentId: "assignment-1",
      attemptNumber: 2,
      status: "IN_PROGRESS",
      startedAt: CREATED_AT,
      legacySource: "activity_submission",
      isLate: false,
    });
  });
});
