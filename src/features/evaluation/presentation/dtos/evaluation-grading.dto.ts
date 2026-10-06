/*
 * Funcionalidad: DTOs de respuesta de la calificación docente de evaluaciones
 * Descripción: Respuestas documentadas con Swagger de la cola de revisión, la vista de calificación de un intento (evaluación con respuestas correctas, respuestas del estudiante con puntajes y desglose práctico), la calificación de una pregunta, la publicación individual y masiva y las notas publicadas del estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { EVALUATION_ATTEMPT_STATUS_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";
import { EVALUATION_TYPE_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-type";
import { EvaluationQuestionDTO, EvaluationScenarioDTO } from "@/features/evaluation/presentation/dtos/evaluation.dto";

export class GradingStudentDTO {
  @ApiProperty({ description: "Student user ID", example: "cm5student01" })
  public id: string;

  @ApiProperty({ description: "Student name", example: "Ana Gómez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "Student email", example: "ana@example.com" })
  public email: string;

  public constructor(fields: { id: string; name: string | null; email: string }) {
    this.id = fields.id;
    this.name = fields.name;
    this.email = fields.email;
  }
}

export class GradingQueueItemDTO {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public attemptId: string;

  @ApiProperty({ description: "Evaluation ID", example: "cm5evaluation01" })
  public evaluationId: string;

  @ApiProperty({ description: "Evaluation title", example: "Midterm" })
  public evaluationTitle: string;

  @ApiProperty({ description: "Evaluation type", enum: EVALUATION_TYPE_VALUES, example: "EXAM" })
  public evaluationType: string;

  @ApiProperty({ description: "Assignment ID (null for legacy attempts)", example: "cm5assignment01", nullable: true, type: String })
  public assignmentId: string | null;

  @ApiProperty({ description: "Attempt number", example: 1 })
  public attemptNumber: number;

  @ApiProperty({ description: "Student", type: GradingStudentDTO })
  public student: GradingStudentDTO;

  @ApiProperty({ description: "Attempt status", enum: EVALUATION_ATTEMPT_STATUS_VALUES, example: "PENDING_REVIEW" })
  public status: string;

  @ApiProperty({ description: "When the attempt was submitted or closed", example: "2026-10-06T08:30:00.000Z", nullable: true, type: Date })
  public submittedAt: Date | null;

  @ApiProperty({ description: "Points earned so far", example: 3, nullable: true, type: Number })
  public score: number | null;

  @ApiProperty({ description: "Total points", example: 5, nullable: true, type: Number })
  public maxScore: number | null;

  @ApiProperty({ description: "Whether the attempt was migrated from the legacy model", example: false })
  public legacy: boolean;

  public constructor(fields: {
    attemptId: string;
    evaluationId: string;
    evaluationTitle: string;
    evaluationType: string;
    assignmentId: string | null;
    attemptNumber: number;
    student: GradingStudentDTO;
    status: string;
    submittedAt: Date | null;
    score: number | null;
    maxScore: number | null;
    legacy: boolean;
  }) {
    this.attemptId = fields.attemptId;
    this.evaluationId = fields.evaluationId;
    this.evaluationTitle = fields.evaluationTitle;
    this.evaluationType = fields.evaluationType;
    this.assignmentId = fields.assignmentId;
    this.attemptNumber = fields.attemptNumber;
    this.student = fields.student;
    this.status = fields.status;
    this.submittedAt = fields.submittedAt;
    this.score = fields.score;
    this.maxScore = fields.maxScore;
    this.legacy = fields.legacy;
  }
}

export class PracticalScoreDTO {
  @ApiProperty({ description: "Whether the simulator session could be scored", example: true })
  public available: boolean;

  @ApiProperty({ description: "Practical score between 0 and 1", example: 0.75, nullable: true, type: Number })
  public score: number | null;

  @ApiProperty({ description: "Per-parameter comparison against the expert configuration", type: "array", items: { type: "object" }, example: [] })
  public breakdown: unknown[];

  @ApiProperty({ description: "Why the session could not be scored", example: null, nullable: true, type: String })
  public reason: string | null;

  public constructor(fields: { available: boolean; score: number | null; breakdown: unknown[]; reason: string | null }) {
    this.available = fields.available;
    this.score = fields.score;
    this.breakdown = fields.breakdown;
    this.reason = fields.reason;
  }
}

export class GradingAnswerDTO {
  @ApiProperty({ description: "Question ID", example: "cm5question01" })
  public questionId: string;

  @ApiProperty({ description: "Answer ID (null when the student did not answer)", example: "cm5answer01", nullable: true, type: String })
  public answerId: string | null;

  @ApiProperty({ description: "Selected option IDs", type: [String], example: ["cm5option01"] })
  public selectedOptionIds: string[];

  @ApiProperty({ description: "Open text answer", example: "Raise PEEP to 8", nullable: true, type: String })
  public textAnswer: string | null;

  @ApiProperty({ description: "Simulator session of a SIMULATION answer", example: null, nullable: true, type: String })
  public simulationSessionId: string | null;

  @ApiProperty({ description: "Automatic score", example: 1, nullable: true, type: Number })
  public autoScore: number | null;

  @ApiProperty({ description: "Manual score set by a teacher (takes precedence)", example: null, nullable: true, type: Number })
  public manualScore: number | null;

  @ApiProperty({ description: "Score that counts (manual, else automatic)", example: 1, nullable: true, type: Number })
  public earnedScore: number | null;

  @ApiProperty({ description: "Whether the question still needs manual grading", example: false })
  public pending: boolean;

  @ApiProperty({ description: "Teacher comment", example: null, nullable: true, type: String })
  public teacherComment: string | null;

  @ApiProperty({ description: "User who set the manual score", example: null, nullable: true, type: String })
  public gradedById: string | null;

  @ApiProperty({ description: "Practical score recomputed on demand for SIMULATION answers", type: PracticalScoreDTO, nullable: true })
  public practicalScore: PracticalScoreDTO | null;

  public constructor(fields: {
    questionId: string;
    answerId: string | null;
    selectedOptionIds: string[];
    textAnswer: string | null;
    simulationSessionId: string | null;
    autoScore: number | null;
    manualScore: number | null;
    earnedScore: number | null;
    pending: boolean;
    teacherComment: string | null;
    gradedById: string | null;
    practicalScore: PracticalScoreDTO | null;
  }) {
    this.questionId = fields.questionId;
    this.answerId = fields.answerId;
    this.selectedOptionIds = fields.selectedOptionIds;
    this.textAnswer = fields.textAnswer;
    this.simulationSessionId = fields.simulationSessionId;
    this.autoScore = fields.autoScore;
    this.manualScore = fields.manualScore;
    this.earnedScore = fields.earnedScore;
    this.pending = fields.pending;
    this.teacherComment = fields.teacherComment;
    this.gradedById = fields.gradedById;
    this.practicalScore = fields.practicalScore;
  }
}

export class GradingAttemptDTO {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Evaluation ID", example: "cm5evaluation01" })
  public evaluationId: string;

  @ApiProperty({ description: "Evaluation title", example: "Midterm" })
  public evaluationTitle: string;

  @ApiProperty({ description: "Evaluation type", enum: EVALUATION_TYPE_VALUES, example: "EXAM" })
  public evaluationType: string;

  @ApiProperty({ description: "Whether grades are published as soon as the attempt is fully graded", example: false })
  public showResultsImmediately: boolean;

  @ApiProperty({ description: "Assignment ID (null for legacy attempts)", example: "cm5assignment01", nullable: true, type: String })
  public assignmentId: string | null;

  @ApiProperty({ description: "Student user ID", example: "cm5student01" })
  public userId: string;

  @ApiProperty({ description: "Attempt number", example: 1 })
  public attemptNumber: number;

  @ApiProperty({ description: "Attempt status", enum: EVALUATION_ATTEMPT_STATUS_VALUES, example: "PENDING_REVIEW" })
  public status: string;

  @ApiProperty({ description: "When the attempt started", example: "2026-10-06T08:00:00.000Z" })
  public startedAt: Date;

  @ApiProperty({ description: "When the attempt was submitted or closed", example: "2026-10-06T08:30:00.000Z", nullable: true, type: Date })
  public submittedAt: Date | null;

  @ApiProperty({ description: "Points earned", example: 3, nullable: true, type: Number })
  public score: number | null;

  @ApiProperty({ description: "Total points", example: 5, nullable: true, type: Number })
  public maxScore: number | null;

  @ApiProperty({ description: "Grade on the 0.0–5.0 scale (only when GRADED)", example: 3, nullable: true, type: Number })
  public grade: number | null;

  @ApiProperty({ description: "Whether the grade reaches the passing grade", example: true, nullable: true, type: Boolean })
  public passed: boolean | null;

  @ApiProperty({ description: "Passing grade on the 0.0–5.0 scale", example: 3 })
  public passingGrade: number;

  @ApiProperty({ description: "When the grade was published to the student", example: null, nullable: true, type: Date })
  public gradePublishedAt: Date | null;

  @ApiProperty({ description: "Whether the attempt was migrated from the legacy model", example: false })
  public legacy: boolean;

  @ApiProperty({ description: "Scenarios", type: [EvaluationScenarioDTO] })
  public scenarios: EvaluationScenarioDTO[];

  @ApiProperty({ description: "Questions with correct options, explanations and rubrics", type: [EvaluationQuestionDTO] })
  public questions: EvaluationQuestionDTO[];

  @ApiProperty({ description: "One entry per question with the student answer and its scores", type: [GradingAnswerDTO] })
  public answers: GradingAnswerDTO[];

  public constructor(fields: {
    id: string;
    evaluationId: string;
    evaluationTitle: string;
    evaluationType: string;
    showResultsImmediately: boolean;
    assignmentId: string | null;
    userId: string;
    attemptNumber: number;
    status: string;
    startedAt: Date;
    submittedAt: Date | null;
    score: number | null;
    maxScore: number | null;
    grade: number | null;
    passed: boolean | null;
    passingGrade: number;
    gradePublishedAt: Date | null;
    legacy: boolean;
    scenarios: EvaluationScenarioDTO[];
    questions: EvaluationQuestionDTO[];
    answers: GradingAnswerDTO[];
  }) {
    this.id = fields.id;
    this.evaluationId = fields.evaluationId;
    this.evaluationTitle = fields.evaluationTitle;
    this.evaluationType = fields.evaluationType;
    this.showResultsImmediately = fields.showResultsImmediately;
    this.assignmentId = fields.assignmentId;
    this.userId = fields.userId;
    this.attemptNumber = fields.attemptNumber;
    this.status = fields.status;
    this.startedAt = fields.startedAt;
    this.submittedAt = fields.submittedAt;
    this.score = fields.score;
    this.maxScore = fields.maxScore;
    this.grade = fields.grade;
    this.passed = fields.passed;
    this.passingGrade = fields.passingGrade;
    this.gradePublishedAt = fields.gradePublishedAt;
    this.legacy = fields.legacy;
    this.scenarios = fields.scenarios;
    this.questions = fields.questions;
    this.answers = fields.answers;
  }
}

export class GradeEvaluationAnswerResponseDTO {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public attemptId: string;

  @ApiProperty({ description: "Graded question ID", example: "cm5question01" })
  public questionId: string;

  @ApiProperty({ description: "Attempt status after grading", enum: EVALUATION_ATTEMPT_STATUS_VALUES, example: "GRADED" })
  public status: string;

  @ApiProperty({ description: "Points earned", example: 4, nullable: true, type: Number })
  public score: number | null;

  @ApiProperty({ description: "Total points", example: 5, nullable: true, type: Number })
  public maxScore: number | null;

  @ApiProperty({ description: "Grade on the 0.0–5.0 scale (only when GRADED)", example: 4, nullable: true, type: Number })
  public grade: number | null;

  @ApiProperty({ description: "Whether the grade is published to the student", example: false })
  public published: boolean;

  @ApiProperty({ description: "Whether an existing score was overridden (audited)", example: false })
  public override: boolean;

  public constructor(fields: {
    attemptId: string;
    questionId: string;
    status: string;
    score: number | null;
    maxScore: number | null;
    grade: number | null;
    published: boolean;
    override: boolean;
  }) {
    this.attemptId = fields.attemptId;
    this.questionId = fields.questionId;
    this.status = fields.status;
    this.score = fields.score;
    this.maxScore = fields.maxScore;
    this.grade = fields.grade;
    this.published = fields.published;
    this.override = fields.override;
  }
}

export class PublishAttemptGradeResponseDTO {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public attemptId: string;

  @ApiProperty({ description: "When the grade was published", example: "2026-10-06T10:00:00.000Z" })
  public publishedAt: Date;

  @ApiProperty({ description: "Whether it was already published (nothing changed)", example: false })
  public alreadyPublished: boolean;

  public constructor(fields: { attemptId: string; publishedAt: Date; alreadyPublished: boolean }) {
    this.attemptId = fields.attemptId;
    this.publishedAt = fields.publishedAt;
    this.alreadyPublished = fields.alreadyPublished;
  }
}

export class PublishGradesResponseDTO {
  @ApiProperty({ description: "Number of grades published by this call", example: 12 })
  public publishedCount: number;

  public constructor(publishedCount: number) {
    this.publishedCount = publishedCount;
  }
}

export class MyEvaluationGradeDTO {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public attemptId: string;

  @ApiProperty({ description: "Evaluation ID", example: "cm5evaluation01" })
  public evaluationId: string;

  @ApiProperty({ description: "Evaluation title", example: "Midterm" })
  public evaluationTitle: string;

  @ApiProperty({ description: "Evaluation type", enum: EVALUATION_TYPE_VALUES, example: "EXAM" })
  public evaluationType: string;

  @ApiProperty({ description: "Attempt number", example: 1 })
  public attemptNumber: number;

  @ApiProperty({ description: "Points earned", example: 4, nullable: true, type: Number })
  public score: number | null;

  @ApiProperty({ description: "Total points", example: 5, nullable: true, type: Number })
  public maxScore: number | null;

  @ApiProperty({ description: "Grade on the 0.0–5.0 scale", example: 4 })
  public grade: number;

  @ApiProperty({ description: "Whether the grade reaches the passing grade", example: true })
  public passed: boolean;

  @ApiProperty({ description: "When the grade was published", example: "2026-10-06T10:00:00.000Z" })
  public publishedAt: Date;

  @ApiProperty({ description: "Whether the attempt was migrated from the legacy model", example: false })
  public legacy: boolean;

  public constructor(fields: {
    attemptId: string;
    evaluationId: string;
    evaluationTitle: string;
    evaluationType: string;
    attemptNumber: number;
    score: number | null;
    maxScore: number | null;
    grade: number;
    passed: boolean;
    publishedAt: Date;
    legacy: boolean;
  }) {
    this.attemptId = fields.attemptId;
    this.evaluationId = fields.evaluationId;
    this.evaluationTitle = fields.evaluationTitle;
    this.evaluationType = fields.evaluationType;
    this.attemptNumber = fields.attemptNumber;
    this.score = fields.score;
    this.maxScore = fields.maxScore;
    this.grade = fields.grade;
    this.passed = fields.passed;
    this.publishedAt = fields.publishedAt;
    this.legacy = fields.legacy;
  }
}
