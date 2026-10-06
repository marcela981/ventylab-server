/*
 * Funcionalidad: DTOs de retroalimentación de calificación
 * Descripción: Respuestas HTTP de la retroalimentación de un intento: vista del estudiante (estado, contenido y origen solo cuando está lista, sin proveedor ni modelo), vista del docente (con proveedor, modelo y estado) y aceptación de una regeneración (estado PENDING)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { GRADE_FEEDBACK_STATUS_VALUES } from "@/features/evaluation/domain/value-objects/grade-feedback-status";

const GRADE_FEEDBACK_SOURCE_VALUES: readonly string[] = ["LLM", "DETERMINISTIC"];

export class StudentGradeFeedbackItemDTO {
  @ApiProperty({ description: "Question ID, or null for the overall feedback", example: "cm5question01", nullable: true, type: String })
  public questionId: string | null;

  @ApiProperty({ description: "Generation status", enum: GRADE_FEEDBACK_STATUS_VALUES, example: "READY" })
  public status: string;

  @ApiProperty({ description: "Origin of the feedback, only when READY", enum: GRADE_FEEDBACK_SOURCE_VALUES, example: "LLM", nullable: true, type: String })
  public source: string | null;

  @ApiProperty({ description: "Feedback text, only when READY", example: "Buen manejo de la PEEP.", nullable: true, type: String })
  public content: string | null;

  public constructor({ questionId, status, source, content }: { questionId: string | null; status: string; source: string | null; content: string | null }) {
    this.questionId = questionId;
    this.status = status;
    this.source = source;
    this.content = content;
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
