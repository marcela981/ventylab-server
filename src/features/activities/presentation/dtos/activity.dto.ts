/*
 * Funcionalidad: DTOs de respuesta de actividades
 * Descripción: Serialización de actividades (base, ítem de listado con asignaciones y entregas o conteo, detalle), asignaciones con su grupo e identificador de recurso creado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { ACTIVITY_TYPE_VALUES } from "@/features/activities/domain/value-objects/activity-type";
import { SUBMISSION_STATUS_VALUES } from "@/features/activities/domain/value-objects/submission-status";

export interface ActivityDTOFields {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  type: string;
  maxScore: number;
  timeLimit: number | null;
  dueDate: Date | null;
  isPublished: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ResourceIdDTO {
  @ApiProperty({ description: "Identifier of the created or updated resource", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  public constructor({ id }: { id: string }) {
    this.id = id;
  }
}

export class ActivityDTO {
  @ApiProperty({ description: "Activity unique identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Activity title", example: "Workshop on ventilation modes" })
  public title: string;

  @ApiProperty({ description: "Activity description", example: "Practical workshop", nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Instructions for the student", example: "Answer every question", nullable: true, type: String })
  public instructions: string | null;

  @ApiProperty({ description: "Activity type", enum: ACTIVITY_TYPE_VALUES, example: "TALLER" })
  public type: string;

  @ApiProperty({ description: "Maximum score", example: 100 })
  public maxScore: number;

  @ApiProperty({ description: "Time limit in minutes", example: 60, nullable: true, type: Number })
  public timeLimit: number | null;

  @ApiProperty({ description: "Due date", example: "2026-11-30T23:59:59.000Z", nullable: true, type: Date })
  public dueDate: Date | null;

  @ApiProperty({ description: "Whether the activity is published", example: true })
  public isPublished: boolean;

  @ApiProperty({ description: "Whether the activity is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Creator user ID", example: "cm5teacher01" })
  public createdBy: string;

  @ApiProperty({ description: "Creation date", example: "2026-10-01T10:00:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Last update date", example: "2026-10-02T10:00:00.000Z" })
  public updatedAt: Date;

  public constructor(fields: ActivityDTOFields) {
    this.id = fields.id;
    this.title = fields.title;
    this.description = fields.description;
    this.instructions = fields.instructions;
    this.type = fields.type;
    this.maxScore = fields.maxScore;
    this.timeLimit = fields.timeLimit;
    this.dueDate = fields.dueDate;
    this.isPublished = fields.isPublished;
    this.isActive = fields.isActive;
    this.createdBy = fields.createdBy;
    this.createdAt = fields.createdAt;
    this.updatedAt = fields.updatedAt;
  }
}

export class AssignmentWindowDTO {
  @ApiProperty({ description: "Assignment ID (teacher listing only)", example: "cm5assign01", nullable: true, type: String })
  public id: string | null;

  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  public groupId: string;

  @ApiProperty({ description: "Due date for the group", example: "2026-11-30T23:59:59.000Z", nullable: true, type: Date })
  public dueDate: Date | null;

  @ApiProperty({ description: "Visible from", example: "2026-11-01T00:00:00.000Z", nullable: true, type: Date })
  public visibleFrom: Date | null;

  public constructor({ id, groupId, dueDate, visibleFrom }: { id: string | null; groupId: string; dueDate: Date | null; visibleFrom: Date | null }) {
    this.id = id;
    this.groupId = groupId;
    this.dueDate = dueDate;
    this.visibleFrom = visibleFrom;
  }
}

export class SubmissionBriefDTO {
  @ApiProperty({ description: "Submission ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Submission status", enum: SUBMISSION_STATUS_VALUES, example: "SUBMITTED" })
  public status: string;

  @ApiProperty({ description: "Score", example: 85, nullable: true, type: Number })
  public score: number | null;

  @ApiProperty({ description: "Maximum score", example: 100, nullable: true, type: Number })
  public maxScore: number | null;

  @ApiProperty({ description: "Submission date", example: "2026-11-20T10:00:00.000Z", nullable: true, type: Date })
  public submittedAt: Date | null;

  @ApiProperty({ description: "Grading date", example: "2026-11-22T10:00:00.000Z", nullable: true, type: Date })
  public gradedAt: Date | null;

  public constructor({
    id,
    status,
    score,
    maxScore,
    submittedAt,
    gradedAt,
  }: {
    id: string;
    status: string;
    score: number | null;
    maxScore: number | null;
    submittedAt: Date | null;
    gradedAt: Date | null;
  }) {
    this.id = id;
    this.status = status;
    this.score = score;
    this.maxScore = maxScore;
    this.submittedAt = submittedAt;
    this.gradedAt = gradedAt;
  }
}

export class ActivityListItemDTO extends ActivityDTO {
  @ApiProperty({ description: "Active assignments (student: only their groups)", type: AssignmentWindowDTO, isArray: true })
  public assignments: AssignmentWindowDTO[];

  @ApiProperty({ description: "Own submissions (student listing only)", type: SubmissionBriefDTO, isArray: true, nullable: true })
  public submissions: SubmissionBriefDTO[] | null;

  @ApiProperty({ description: "Number of submissions (teacher listing only)", example: 12, nullable: true, type: Number })
  public submissionsCount: number | null;

  public constructor({
    assignments,
    submissions,
    submissionsCount,
    ...fields
  }: ActivityDTOFields & {
    assignments: AssignmentWindowDTO[];
    submissions: SubmissionBriefDTO[] | null;
    submissionsCount: number | null;
  }) {
    super(fields);
    this.assignments = assignments;
    this.submissions = submissions;
    this.submissionsCount = submissionsCount;
  }
}

export class AssignmentGroupDTO {
  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  public id: string;

  @ApiProperty({ description: "Group name", example: "Group A" })
  public name: string;

  @ApiProperty({ description: "Parent group ID", example: "cm5group00", nullable: true, type: String })
  public parentGroupId: string | null;

  @ApiProperty({ description: "Hierarchy depth (0 to 2)", example: 1 })
  public depth: number;

  public constructor({ id, name, parentGroupId, depth }: { id: string; name: string; parentGroupId: string | null; depth: number }) {
    this.id = id;
    this.name = name;
    this.parentGroupId = parentGroupId;
    this.depth = depth;
  }
}

export class ActivityAssignmentDTO {
  @ApiProperty({ description: "Assignment ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Activity ID", example: "cm5activity01" })
  public activityId: string;

  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  public groupId: string;

  @ApiProperty({ description: "User who assigned it", example: "cm5teacher01" })
  public assignedBy: string;

  @ApiProperty({ description: "Visible from", example: "2026-11-01T00:00:00.000Z", nullable: true, type: Date })
  public visibleFrom: Date | null;

  @ApiProperty({ description: "Due date for the group", example: "2026-11-30T23:59:59.000Z", nullable: true, type: Date })
  public dueDate: Date | null;

  @ApiProperty({ description: "Whether the assignment is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Creation date", example: "2026-10-01T10:00:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Group (assignment listing only)", type: AssignmentGroupDTO, nullable: true })
  public group: AssignmentGroupDTO | null;

  public constructor({
    id,
    activityId,
    groupId,
    assignedBy,
    visibleFrom,
    dueDate,
    isActive,
    createdAt,
    group,
  }: {
    id: string;
    activityId: string;
    groupId: string;
    assignedBy: string;
    visibleFrom: Date | null;
    dueDate: Date | null;
    isActive: boolean;
    createdAt: Date;
    group: AssignmentGroupDTO | null;
  }) {
    this.id = id;
    this.activityId = activityId;
    this.groupId = groupId;
    this.assignedBy = assignedBy;
    this.visibleFrom = visibleFrom;
    this.dueDate = dueDate;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.group = group;
  }
}

export class ActivityDetailDTO extends ActivityDTO {
  @ApiProperty({ description: "Active assignments", type: ActivityAssignmentDTO, isArray: true })
  public assignments: ActivityAssignmentDTO[];

  public constructor({ assignments, ...fields }: ActivityDTOFields & { assignments: ActivityAssignmentDTO[] }) {
    super(fields);
    this.assignments = assignments;
  }
}
