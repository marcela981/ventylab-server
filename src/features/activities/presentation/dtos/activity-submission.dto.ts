/*
 * Funcionalidad: DTOs de respuesta de entregas de actividades
 * Descripción: Serialización de entregas con los datos opcionales de su actividad, estudiante y calificador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { SUBMISSION_STATUS_VALUES } from "@/features/activities/domain/value-objects/submission-status";

export class SubmissionActivityDTO {
  @ApiProperty({ description: "Activity ID", example: "cm5activity01" })
  public id: string;

  @ApiProperty({ description: "Activity title", example: "Workshop on ventilation modes" })
  public title: string;

  @ApiProperty({ description: "Activity type", example: "TALLER" })
  public type: string;

  @ApiProperty({ description: "Instructions (detail only)", example: "Answer every question", nullable: true, type: String })
  public instructions: string | null;

  @ApiProperty({ description: "Due date (own submissions listing only)", example: "2026-11-30T23:59:59.000Z", nullable: true, type: Date })
  public dueDate: Date | null;

  @ApiProperty({ description: "Maximum score", example: 100 })
  public maxScore: number;

  public constructor({
    id,
    title,
    type,
    instructions,
    dueDate,
    maxScore,
  }: {
    id: string;
    title: string;
    type: string;
    instructions: string | null;
    dueDate: Date | null;
    maxScore: number;
  }) {
    this.id = id;
    this.title = title;
    this.type = type;
    this.instructions = instructions;
    this.dueDate = dueDate;
    this.maxScore = maxScore;
  }
}

export class SubmissionPersonDTO {
  @ApiProperty({ description: "User ID", example: "cm5student01" })
  public id: string;

  @ApiProperty({ description: "User name", example: "Ana Pérez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "User email", example: "ana@example.com" })
  public email: string;

  public constructor({ id, name, email }: { id: string; name: string | null; email: string }) {
    this.id = id;
    this.name = name;
    this.email = email;
  }
}

export class ActivitySubmissionDTO {
  @ApiProperty({ description: "Submission ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Activity ID", example: "cm5activity01" })
  public activityId: string;

  @ApiProperty({ description: "Student ID", example: "cm5student01" })
  public userId: string;

  @ApiProperty({ description: "Group the submission was made through", example: "cm5group01", nullable: true, type: String })
  public groupId: string | null;

  @ApiProperty({ description: "Submission status", enum: SUBMISSION_STATUS_VALUES, example: "DRAFT" })
  public status: string;

  @ApiProperty({ description: "Submission content (free JSON)", example: { answers: ["A", "C"] }, nullable: true, type: Object })
  public content: unknown;

  @ApiProperty({ description: "Submission date", example: "2026-11-20T10:00:00.000Z", nullable: true, type: Date })
  public submittedAt: Date | null;

  @ApiProperty({ description: "Score", example: 85, nullable: true, type: Number })
  public score: number | null;

  @ApiProperty({ description: "Maximum score", example: 100, nullable: true, type: Number })
  public maxScore: number | null;

  @ApiProperty({ description: "Teacher feedback", example: "Good analysis", nullable: true, type: String })
  public feedback: string | null;

  @ApiProperty({ description: "Grader user ID", example: "cm5teacher01", nullable: true, type: String })
  public gradedBy: string | null;

  @ApiProperty({ description: "Grading date", example: "2026-11-22T10:00:00.000Z", nullable: true, type: Date })
  public gradedAt: Date | null;

  @ApiProperty({ description: "Creation date", example: "2026-11-19T10:00:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Last update date", example: "2026-11-20T10:00:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Activity data, when the endpoint includes it", type: SubmissionActivityDTO, nullable: true })
  public activity: SubmissionActivityDTO | null;

  @ApiProperty({ description: "Student data, when the endpoint includes it", type: SubmissionPersonDTO, nullable: true })
  public student: SubmissionPersonDTO | null;

  @ApiProperty({ description: "Grader data, when the endpoint includes it", type: SubmissionPersonDTO, nullable: true })
  public grader: SubmissionPersonDTO | null;

  public constructor({
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
    activity,
    student,
    grader,
  }: {
    id: string;
    activityId: string;
    userId: string;
    groupId: string | null;
    status: string;
    content: unknown;
    submittedAt: Date | null;
    score: number | null;
    maxScore: number | null;
    feedback: string | null;
    gradedBy: string | null;
    gradedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    activity: SubmissionActivityDTO | null;
    student: SubmissionPersonDTO | null;
    grader: SubmissionPersonDTO | null;
  }) {
    this.id = id;
    this.activityId = activityId;
    this.userId = userId;
    this.groupId = groupId;
    this.status = status;
    this.content = content;
    this.submittedAt = submittedAt;
    this.score = score;
    this.maxScore = maxScore;
    this.feedback = feedback;
    this.gradedBy = gradedBy;
    this.gradedAt = gradedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.activity = activity;
    this.student = student;
    this.grader = grader;
  }
}
