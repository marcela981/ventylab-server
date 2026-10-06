/*
 * Funcionalidad: DTOs de respuesta de asignaciones de evaluación
 * Descripción: Serialización de los ids creados al activar y de una asignación con evaluación, grupo, ventana, estado derivado y conteos de intentos por estado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { EVALUATION_ASSIGNMENT_STATE_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";
import { EVALUATION_STATUS_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-status";
import { EVALUATION_TYPE_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-type";

export class EvaluationAssignmentIdsDTO {
  @ApiProperty({ description: "IDs of the created assignments, one per group", example: ["01932e9f-1234-7abc-9def-1a2b3c4d5e6f"], type: [String] })
  public ids: string[];

  public constructor({ ids }: { ids: string[] }) {
    this.ids = ids;
  }
}

export class EvaluationAssignmentAttemptCountsDTO {
  @ApiProperty({ description: "Attempts in progress", example: 3 })
  public inProgress: number;

  @ApiProperty({ description: "Submitted attempts", example: 0 })
  public submitted: number;

  @ApiProperty({ description: "Attempts pending manual review", example: 2 })
  public pendingReview: number;

  @ApiProperty({ description: "Graded attempts", example: 10 })
  public graded: number;

  public constructor({ inProgress, submitted, pendingReview, graded }: { inProgress: number; submitted: number; pendingReview: number; graded: number }) {
    this.inProgress = inProgress;
    this.submitted = submitted;
    this.pendingReview = pendingReview;
    this.graded = graded;
  }
}

export class EvaluationAssignmentDTO {
  @ApiProperty({ description: "Assignment ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Evaluation ID", example: "cm5evaluation01" })
  public evaluationId: string;

  @ApiProperty({ description: "Evaluation title", example: "Mechanical ventilation midterm" })
  public evaluationTitle: string;

  @ApiProperty({ description: "Evaluation type", enum: EVALUATION_TYPE_VALUES, example: "EXAM" })
  public evaluationType: string;

  @ApiProperty({ description: "Evaluation status", enum: EVALUATION_STATUS_VALUES, example: "READY" })
  public evaluationStatus: string;

  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  public groupId: string;

  @ApiProperty({ description: "Group name", example: "ICU rotation 2026-2" })
  public groupName: string;

  @ApiProperty({ description: "Opening time", example: "2026-10-06T08:00:00.000Z", type: Date })
  public startsAt: Date;

  @ApiProperty({ description: "Closing time; null only for open-ended legacy assignments", example: "2026-10-06T10:00:00.000Z", nullable: true, type: Date })
  public endsAt: Date | null;

  @ApiProperty({ description: "State derived at request time", enum: EVALUATION_ASSIGNMENT_STATE_VALUES, example: "ACTIVE" })
  public state: string;

  @ApiProperty({ description: "User who activated it", example: "cm5teacher01", nullable: true, type: String })
  public assignedById: string | null;

  @ApiProperty({ description: "Active flag carried over from the legacy assignment; false means closed", example: null, nullable: true, type: Boolean })
  public legacyIsActive: boolean | null;

  @ApiProperty({ description: "Attempt counts by status", type: EvaluationAssignmentAttemptCountsDTO })
  public attemptCounts: EvaluationAssignmentAttemptCountsDTO;

  @ApiProperty({ description: "Creation time", example: "2026-10-05T12:00:00.000Z", type: Date })
  public createdAt: Date;

  @ApiProperty({ description: "Last update time", example: "2026-10-05T12:00:00.000Z", type: Date })
  public updatedAt: Date;

  public constructor(props: {
    id: string;
    evaluationId: string;
    evaluationTitle: string;
    evaluationType: string;
    evaluationStatus: string;
    groupId: string;
    groupName: string;
    startsAt: Date;
    endsAt: Date | null;
    state: string;
    assignedById: string | null;
    legacyIsActive: boolean | null;
    attemptCounts: EvaluationAssignmentAttemptCountsDTO;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.evaluationId = props.evaluationId;
    this.evaluationTitle = props.evaluationTitle;
    this.evaluationType = props.evaluationType;
    this.evaluationStatus = props.evaluationStatus;
    this.groupId = props.groupId;
    this.groupName = props.groupName;
    this.startsAt = props.startsAt;
    this.endsAt = props.endsAt;
    this.state = props.state;
    this.assignedById = props.assignedById;
    this.legacyIsActive = props.legacyIsActive;
    this.attemptCounts = props.attemptCounts;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
