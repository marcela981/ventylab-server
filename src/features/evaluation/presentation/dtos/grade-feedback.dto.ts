/*
 * Funcionalidad: DTOs de retroalimentación de calificación
 * Descripción: Respuestas HTTP de la retroalimentación de un intento: vista del estudiante (id de la fila para valorarla, estado, contenido y origen solo cuando está lista, sin proveedor ni modelo), vista del docente (con proveedor, modelo y estado) y aceptación de una regeneración (estado PENDING)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { GRADE_FEEDBACK_STATUS_VALUES } from "@/features/evaluation/domain/value-objects/grade-feedback-status";

const GRADE_FEEDBACK_SOURCE_VALUES: readonly string[] = ["LLM", "DETERMINISTIC"];

export class GradeFeedbackMyRatingDTO {
  @ApiProperty({ description: "Rating id", example: "0192f0c4-7b1e-7a3d-9c2b-3f4e5d6a7b8c" })
  public id: string;

  @ApiPropertyOptional({ description: "Surface where the feedback was rated", example: "EVALUATION_FEEDBACK" })
  public surface?: string;

  @ApiProperty({ description: "Whether the feedback was helpful", example: true })
  public helpful: boolean;

  @ApiPropertyOptional({ description: "Free-text comment", example: "Me ayudó a entender la PEEP" })
  public comment?: string;

  @ApiPropertyOptional({ description: "Overall quality (1–5)", example: 4 })
  public quality?: number;

  @ApiPropertyOptional({ description: "Understanding of the answer (1–5)", example: 5 })
  public understanding?: number;

  @ApiPropertyOptional({ description: "Expression style and clarity (1–5)", example: 4 })
  public expression?: number;

  @ApiPropertyOptional({ description: "Safety and harm avoidance (1–5)", example: 5 })
  public safety?: number;

  @ApiPropertyOptional({ description: "Trust and confidence (1–5)", example: 3 })
  public trust?: number;

  @ApiProperty({ description: "First rated at", example: "2026-10-05T12:00:00.000Z" })
  public createdAt: string;

  @ApiProperty({ description: "Last edited at", example: "2026-10-05T12:05:00.000Z" })
  public updatedAt: string;
}

export class StudentGradeFeedbackItemDTO {
  @ApiProperty({ description: "Feedback ID (target ID when rating this feedback)", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Question ID, or null for the overall feedback", example: "cm5question01", nullable: true, type: String })
  public questionId: string | null;

  @ApiProperty({ description: "Generation status", enum: GRADE_FEEDBACK_STATUS_VALUES, example: "READY" })
  public status: string;

  @ApiProperty({ description: "Origin of the feedback, only when READY", enum: GRADE_FEEDBACK_SOURCE_VALUES, example: "LLM", nullable: true, type: String })
  public source: string | null;

  @ApiProperty({ description: "Feedback text, only when READY", example: "Buen manejo de la PEEP.", nullable: true, type: String })
  public content: string | null;

  @ApiProperty({ description: "The caller's own rating of this block (target GRADE_FEEDBACK with this id), or null when not rated", nullable: true, type: GradeFeedbackMyRatingDTO })
  public myRating: GradeFeedbackMyRatingDTO | null;

  public constructor({
    id,
    questionId,
    status,
    source,
    content,
    myRating,
  }: {
    id: string;
    questionId: string | null;
    status: string;
    source: string | null;
    content: string | null;
    myRating: GradeFeedbackMyRatingDTO | null;
  }) {
    this.id = id;
    this.questionId = questionId;
    this.status = status;
    this.source = source;
    this.content = content;
    this.myRating = myRating;
  }
}

export class StudentGradeFeedbackDTO {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public attemptId: string;

  @ApiProperty({ description: "Overall feedback, or null when none was generated", type: StudentGradeFeedbackItemDTO, nullable: true })
  public overall: StudentGradeFeedbackItemDTO | null;

  @ApiProperty({ description: "Feedback per question", type: StudentGradeFeedbackItemDTO, isArray: true })
  public questions: StudentGradeFeedbackItemDTO[];

  public constructor({ attemptId, overall, questions }: { attemptId: string; overall: StudentGradeFeedbackItemDTO | null; questions: StudentGradeFeedbackItemDTO[] }) {
    this.attemptId = attemptId;
    this.overall = overall;
    this.questions = questions;
  }
}

export class GradeFeedbackItemDTO {
  @ApiProperty({ description: "Feedback ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Question ID, or null for the overall feedback", example: "cm5question01", nullable: true, type: String })
  public questionId: string | null;

  @ApiProperty({ description: "Generation status", enum: GRADE_FEEDBACK_STATUS_VALUES, example: "READY" })
  public status: string;

  @ApiProperty({ description: "Origin of the feedback, only when READY", enum: GRADE_FEEDBACK_SOURCE_VALUES, example: "LLM", nullable: true, type: String })
  public source: string | null;

  @ApiProperty({ description: "Language model provider", example: "gemini", nullable: true, type: String })
  public provider: string | null;

  @ApiProperty({ description: "Language model", example: "gemini-2.0-flash", nullable: true, type: String })
  public model: string | null;

  @ApiProperty({ description: "Feedback text (empty while PENDING or FAILED)", example: "Buen manejo de la PEEP." })
  public content: string;

  @ApiProperty({ description: "Last update", example: "2026-10-06T08:31:00.000Z" })
  public updatedAt: Date;

  public constructor({
    id,
    questionId,
    status,
    source,
    provider,
    model,
    content,
    updatedAt,
  }: {
    id: string;
    questionId: string | null;
    status: string;
    source: string | null;
    provider: string | null;
    model: string | null;
    content: string;
    updatedAt: Date;
  }) {
    this.id = id;
    this.questionId = questionId;
    this.status = status;
    this.source = source;
    this.provider = provider;
    this.model = model;
    this.content = content;
    this.updatedAt = updatedAt;
  }
}

export class GradeFeedbackDTO {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public attemptId: string;

  @ApiProperty({ description: "Overall feedback, or null when none was generated", type: GradeFeedbackItemDTO, nullable: true })
  public overall: GradeFeedbackItemDTO | null;

  @ApiProperty({ description: "Feedback per question", type: GradeFeedbackItemDTO, isArray: true })
  public questions: GradeFeedbackItemDTO[];

  public constructor({ attemptId, overall, questions }: { attemptId: string; overall: GradeFeedbackItemDTO | null; questions: GradeFeedbackItemDTO[] }) {
    this.attemptId = attemptId;
    this.overall = overall;
    this.questions = questions;
  }
}

export class GradeFeedbackRegenerationDTO {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public attemptId: string;

  @ApiProperty({ description: "Status of the new feedback", enum: GRADE_FEEDBACK_STATUS_VALUES, example: "PENDING" })
  public status: string;

  public constructor({ attemptId, status }: { attemptId: string; status: string }) {
    this.attemptId = attemptId;
    this.status = status;
  }
}
