/*
 * Funcionalidad: DTOs de respuesta de evaluaciones
 * Descripción: Serialización del listado de gestión, del detalle de gestión (escenarios, preguntas y opciones con respuestas correctas, medios con URL firmada, conteos de uso, problemas de preparación y bloqueo estructural), del id creado y del resultado del borrado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { EVALUATION_QUESTION_TYPE_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-question-type";
import { EVALUATION_STATUS_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-status";
import { EVALUATION_TYPE_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-type";

const TIPTAP_EXAMPLE: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Which PEEP would you set?" }] }],
};

export class EvaluationIdDTO {
  @ApiProperty({ description: "Identifier of the created resource", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  public constructor({ id }: { id: string }) {
    this.id = id;
  }
}

export class DeleteEvaluationResultDTO {
  @ApiProperty({ description: "deleted when removed, archived when it had attempts or assignments", enum: ["deleted", "archived"], example: "archived" })
  public outcome: string;

  public constructor({ outcome }: { outcome: string }) {
    this.outcome = outcome;
  }
}

export class EvaluationMediaDTO {
  @ApiProperty({ description: "Media ID", example: "cm5media01" })
  public mediaId: string;

  @ApiProperty({ description: "Signed download URL", example: "https://storage.example.com/media/curve.png?signature=abc" })
  public url: string;

  @ApiProperty({ description: "MIME type", example: "image/png" })
  public mimeType: string;

  @ApiProperty({ description: "Media kind", enum: ["IMAGE", "VIDEO", "FILE"], example: "IMAGE" })
  public kind: string;

  @ApiProperty({ description: "When the signed URL expires", example: "2026-10-05T12:00:00.000Z", nullable: true, type: Date })
  public expiresAt: Date | null;

  public constructor({ mediaId, url, mimeType, kind, expiresAt }: { mediaId: string; url: string; mimeType: string; kind: string; expiresAt: Date | null }) {
    this.mediaId = mediaId;
    this.url = url;
    this.mimeType = mimeType;
    this.kind = kind;
    this.expiresAt = expiresAt;
  }
}

export class EvaluationOptionDTO {
  @ApiProperty({ description: "Option ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Position within the question", example: 0 })
  public order: number;

  @ApiProperty({ description: "Option text", example: "8 cmH2O" })
  public content: string;

  @ApiProperty({ description: "Whether the option is correct", example: true })
  public isCorrect: boolean;

  @ApiProperty({ description: "Media ID", example: "cm5media02", nullable: true, type: String })
  public mediaId: string | null;

  @ApiProperty({ description: "Resolved media, when storage is available", type: EvaluationMediaDTO, nullable: true })
  public media: EvaluationMediaDTO | null;

  @ApiProperty({ description: "Per-option feedback carried over from legacy quizzes", example: "Correct, it keeps the alveoli open", nullable: true, type: String })
  public feedback: string | null;

  public constructor(data: EvaluationOptionDTO) {
    this.id = data.id;
    this.order = data.order;
    this.content = data.content;
    this.isCorrect = data.isCorrect;
    this.mediaId = data.mediaId;
    this.media = data.media;
    this.feedback = data.feedback;
  }
}

export class EvaluationQuestionDTO {
  @ApiProperty({ description: "Question ID (legacy questions look like <evaluationId>:q1)", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Scenario the question belongs to", example: null, nullable: true, type: String })
  public scenarioId: string | null;

  @ApiProperty({ description: "Position within the evaluation", example: 0 })
  public order: number;

  @ApiProperty({ description: "Question type", enum: EVALUATION_QUESTION_TYPE_VALUES, example: "SINGLE_CHOICE" })
  public type: string;

  @ApiProperty({ description: "Prompt as a Tiptap JSON document", type: "object", additionalProperties: true, example: TIPTAP_EXAMPLE })
  public prompt: Record<string, unknown>;

  @ApiProperty({ description: "Media IDs", type: [String], example: ["cm5media01"] })
  public mediaIds: string[];

  @ApiProperty({ description: "Resolved media, when storage is available", type: [EvaluationMediaDTO] })
  public media: EvaluationMediaDTO[];

  @ApiProperty({ description: "Points awarded", example: 1 })
  public points: number;

  @ApiProperty({ description: "Explanation shown with the results", example: "A PEEP of 8 keeps the alveoli open", nullable: true, type: String })
  public explanation: string | null;

  @ApiProperty({ description: "Clinical case of a SIMULATION question", example: null, nullable: true, type: String })
  public clinicalCaseId: string | null;

  @ApiProperty({ description: "Rubric of a SIMULATION question", type: "object", additionalProperties: true, nullable: true, example: null })
  public rubric: unknown;

  @ApiProperty({ description: "Options, in order, with the correct answers", type: [EvaluationOptionDTO] })
  public options: EvaluationOptionDTO[];

  public constructor(data: EvaluationQuestionDTO) {
    this.id = data.id;
    this.scenarioId = data.scenarioId;
    this.order = data.order;
    this.type = data.type;
    this.prompt = data.prompt;
    this.mediaIds = data.mediaIds;
    this.media = data.media;
    this.points = data.points;
    this.explanation = data.explanation;
    this.clinicalCaseId = data.clinicalCaseId;
    this.rubric = data.rubric;
    this.options = data.options;
  }
}

export class EvaluationScenarioDTO {
  @ApiProperty({ description: "Scenario ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Position within the evaluation", example: 0 })
  public order: number;

  @ApiProperty({ description: "Content as a Tiptap JSON document", type: "object", additionalProperties: true, example: TIPTAP_EXAMPLE })
  public content: Record<string, unknown>;

  @ApiProperty({ description: "Media IDs", type: [String], example: ["cm5media01"] })
  public mediaIds: string[];

  @ApiProperty({ description: "Resolved media, when storage is available", type: [EvaluationMediaDTO] })
  public media: EvaluationMediaDTO[];

  public constructor(data: EvaluationScenarioDTO) {
    this.id = data.id;
    this.order = data.order;
    this.content = data.content;
    this.mediaIds = data.mediaIds;
    this.media = data.media;
  }
}

export class EvaluationReadinessIssueDTO {
  @ApiProperty({ description: "Issue code", example: "correct_option_required" })
  public code: string;

  @ApiProperty({ description: "Question with the issue", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f", nullable: true, type: String })
  public questionId: string | null;

  @ApiProperty({ description: "Extra details (rubric errors)", type: [String], example: [] })
  public details: string[];

  public constructor({ code, questionId, details }: { code: string; questionId: string | null; details: string[] }) {
    this.code = code;
    this.questionId = questionId;
    this.details = details;
  }
}

export class EvaluationUsageDTO {
  @ApiProperty({ description: "Attempts of any status", example: 12 })
  public attempts: number;

  @ApiProperty({ description: "Submitted, pending review or graded attempts (they lock the structure)", example: 10 })
  public submittedAttempts: number;

  @ApiProperty({ description: "Group assignments", example: 2 })
  public assignments: number;

  public constructor({ attempts, submittedAttempts, assignments }: { attempts: number; submittedAttempts: number; assignments: number }) {
    this.attempts = attempts;
    this.submittedAttempts = submittedAttempts;
    this.assignments = assignments;
  }
}

export class EvaluationSummaryDTO {
  @ApiProperty({ description: "Evaluation ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Type", enum: EVALUATION_TYPE_VALUES, example: "QUIZ" })
  public type: string;

  @ApiProperty({ description: "Title", example: "Ventilation basics" })
  public title: string;

  @ApiProperty({ description: "Status", enum: EVALUATION_STATUS_VALUES, example: "READY" })
  public status: string;

  @ApiProperty({ description: "Module ID", example: "module-01", nullable: true, type: String })
  public moduleId: string | null;

  @ApiProperty({ description: "Level ID", example: null, nullable: true, type: String })
  public levelId: string | null;

  @ApiProperty({ description: "Lesson ID", example: "lesson-01", nullable: true, type: String })
  public lessonId: string | null;

  @ApiProperty({ description: "Time limit in minutes", example: 30, nullable: true, type: Number })
  public durationMinutes: number | null;

  @ApiProperty({ description: "Maximum attempts per student", example: 1 })
  public maxAttempts: number;

  @ApiProperty({ description: "Results shown right after submitting", example: true })
  public showResultsImmediately: boolean;

  @ApiProperty({ description: "Creator user ID (null for legacy content)", example: "cm5teacher01", nullable: true, type: String })
  public createdById: string | null;

  @ApiProperty({ description: "Creator name", example: "Laura Gómez", nullable: true, type: String })
  public createdByName: string | null;

  @ApiProperty({ description: "Legacy origin (quiz or activity) of migrated content", example: "quiz", nullable: true, type: String })
  public legacySource: string | null;

  @ApiProperty({ description: "Number of questions", example: 10 })
  public questionCount: number;

  @ApiProperty({ description: "Number of scenarios", example: 1 })
  public scenarioCount: number;

  @ApiProperty({ description: "Number of group assignments", example: 2 })
  public assignmentCount: number;

  @ApiProperty({ description: "Whether the caller can edit it", example: true })
  public canManage: boolean;

  @ApiProperty({ description: "Creation date", example: "2026-10-01T10:00:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Last update", example: "2026-10-02T10:00:00.000Z" })
  public updatedAt: Date;

  public constructor(data: EvaluationSummaryDTO) {
    this.id = data.id;
    this.type = data.type;
    this.title = data.title;
    this.status = data.status;
    this.moduleId = data.moduleId;
    this.levelId = data.levelId;
    this.lessonId = data.lessonId;
    this.durationMinutes = data.durationMinutes;
    this.maxAttempts = data.maxAttempts;
    this.showResultsImmediately = data.showResultsImmediately;
    this.createdById = data.createdById;
    this.createdByName = data.createdByName;
    this.legacySource = data.legacySource;
    this.questionCount = data.questionCount;
    this.scenarioCount = data.scenarioCount;
    this.assignmentCount = data.assignmentCount;
    this.canManage = data.canManage;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export class EvaluationDetailDTO {
  @ApiProperty({ description: "Evaluation ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Type", enum: EVALUATION_TYPE_VALUES, example: "EXAM" })
  public type: string;

  @ApiProperty({ description: "Title", example: "Mechanical ventilation midterm" })
  public title: string;

  @ApiProperty({ description: "Plain text or Tiptap JSON document", oneOf: [{ type: "string" }, { type: "object" }], nullable: true, example: TIPTAP_EXAMPLE })
  public description: string | Record<string, unknown> | null;

  @ApiProperty({ description: "Status", enum: EVALUATION_STATUS_VALUES, example: "DRAFT" })
  public status: string;

  @ApiProperty({ description: "Module ID", example: "module-01", nullable: true, type: String })
  public moduleId: string | null;

  @ApiProperty({ description: "Level ID", example: null, nullable: true, type: String })
  public levelId: string | null;

  @ApiProperty({ description: "Lesson ID", example: "lesson-01", nullable: true, type: String })
  public lessonId: string | null;

  @ApiProperty({ description: "Time limit in minutes", example: 45, nullable: true, type: Number })
  public durationMinutes: number | null;

  @ApiProperty({ description: "Maximum attempts per student", example: 1 })
  public maxAttempts: number;

  @ApiProperty({ description: "Shuffle questions for each attempt", example: false })
  public shuffleQuestions: boolean;

  @ApiProperty({ description: "Results shown right after submitting", example: false })
  public showResultsImmediately: boolean;

  @ApiProperty({ description: "Display order", example: 0 })
  public order: number;

  @ApiProperty({ description: "Creator user ID (null for legacy content)", example: "cm5teacher01", nullable: true, type: String })
  public createdById: string | null;

  @ApiProperty({ description: "Legacy origin (quiz or activity) of migrated content", example: null, nullable: true, type: String })
  public legacySource: string | null;

  @ApiProperty({ description: "Legacy activity type (EXAM or TALLER)", example: null, nullable: true, type: String })
  public legacyType: string | null;

  @ApiProperty({ description: "Scenarios in order", type: [EvaluationScenarioDTO] })
  public scenarios: EvaluationScenarioDTO[];

  @ApiProperty({ description: "Questions in order, with correct answers", type: [EvaluationQuestionDTO] })
  public questions: EvaluationQuestionDTO[];

  @ApiProperty({ description: "Attempts and assignments", type: EvaluationUsageDTO })
  public usage: EvaluationUsageDTO;

  @ApiProperty({ description: "Whether submitted attempts lock structural changes", example: false })
  public structureLocked: boolean;

  @ApiProperty({ description: "Issues that prevent moving to READY (empty when ready)", type: [EvaluationReadinessIssueDTO] })
  public readinessIssues: EvaluationReadinessIssueDTO[];

  @ApiProperty({ description: "Whether the caller can edit it", example: true })
  public canManage: boolean;

  @ApiProperty({ description: "Creation date", example: "2026-10-01T10:00:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Last update", example: "2026-10-02T10:00:00.000Z" })
  public updatedAt: Date;

  public constructor(data: EvaluationDetailDTO) {
    this.id = data.id;
    this.type = data.type;
    this.title = data.title;
    this.description = data.description;
    this.status = data.status;
    this.moduleId = data.moduleId;
    this.levelId = data.levelId;
    this.lessonId = data.lessonId;
    this.durationMinutes = data.durationMinutes;
    this.maxAttempts = data.maxAttempts;
    this.shuffleQuestions = data.shuffleQuestions;
    this.showResultsImmediately = data.showResultsImmediately;
    this.order = data.order;
    this.createdById = data.createdById;
    this.legacySource = data.legacySource;
    this.legacyType = data.legacyType;
    this.scenarios = data.scenarios;
    this.questions = data.questions;
    this.usage = data.usage;
    this.structureLocked = data.structureLocked;
    this.readinessIssues = data.readinessIssues;
    this.canManage = data.canManage;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
