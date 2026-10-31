/*
 * Funcionalidad: DTOs de respuesta de evaluaciones del estudiante
 * Descripción: Contratos HTTP propios del estudiante (no reutilizan los de gestión): inicio de intento, detalle del intento con preguntas, opciones y respuestas guardadas (respuestas correctas, explicaciones, rúbricas, retroalimentación de opciones y puntaje por pregunta solo cuando la nota está publicada; nota parcial de las cerradas mientras espera revisión), resultado de la entrega y listado de evaluaciones asignadas con sus intentos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { EVALUATION_ASSIGNMENT_STATE_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";
import { EVALUATION_ATTEMPT_STATUS_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";
import { EVALUATION_QUESTION_TYPE_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-question-type";
import { EVALUATION_TYPE_VALUES } from "@/features/evaluation/domain/value-objects/evaluation-type";
import { EvaluationMediaDTO } from "@/features/evaluation/presentation/dtos/evaluation.dto";

export interface PublishedGradeFields {
  score?: number;
  maxScore?: number;
  grade?: number;
  passed?: boolean;
}

export class StudentAttemptStartDTO {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Evaluation ID", example: "cm5evaluation01" })
  public evaluationId: string;

  @ApiProperty({ description: "Assignment ID", example: "cm5assignment01", nullable: true, type: String })
  public assignmentId: string | null;

  @ApiProperty({ description: "Attempt number for this evaluation", example: 1 })
  public attemptNumber: number;

  @ApiProperty({ description: "Attempt status", enum: EVALUATION_ATTEMPT_STATUS_VALUES, example: "IN_PROGRESS" })
  public status: string;

  @ApiProperty({ description: "When the attempt started", example: "2026-10-06T08:00:00.000Z" })
  public startedAt: Date;

  @ApiProperty({ description: "Server-side deadline (submissions are accepted until 30 s after it)", example: "2026-10-06T08:30:00.000Z", nullable: true, type: Date })
  public deadlineAt: Date | null;

  @ApiProperty({ description: "Server time, to synchronize the client countdown", example: "2026-10-06T08:00:00.000Z" })
  public serverNow: Date;

  @ApiProperty({ description: "Whether this call created the attempt (false: the attempt in progress was returned)", example: true })
  public created: boolean;

  public constructor(fields: {
    id: string;
    evaluationId: string;
    assignmentId: string | null;
    attemptNumber: number;
    status: string;
    startedAt: Date;
    deadlineAt: Date | null;
    serverNow: Date;
    created: boolean;
  }) {
    this.id = fields.id;
    this.evaluationId = fields.evaluationId;
    this.assignmentId = fields.assignmentId;
    this.attemptNumber = fields.attemptNumber;
    this.status = fields.status;
    this.startedAt = fields.startedAt;
    this.deadlineAt = fields.deadlineAt;
    this.serverNow = fields.serverNow;
    this.created = fields.created;
  }
}

export class StudentAnswerDTO {
  @ApiProperty({ description: "Selected option IDs", example: ["cm5option01"], type: [String] })
  public selectedOptionIds: string[];

  @ApiProperty({ description: "Text answer", example: "Raise PEEP", nullable: true, type: String })
  public textAnswer: string | null;

  @ApiProperty({ description: "Simulator session ID", example: "cm5session01", nullable: true, type: String })
  public simulationSessionId: string | null;

  public constructor({ selectedOptionIds, textAnswer, simulationSessionId }: { selectedOptionIds: string[]; textAnswer: string | null; simulationSessionId: string | null }) {
    this.selectedOptionIds = selectedOptionIds;
    this.textAnswer = textAnswer;
    this.simulationSessionId = simulationSessionId;
  }
}

export class StudentOptionDTO {
  @ApiProperty({ description: "Option ID", example: "cm5option01" })
  public id: string;

  @ApiProperty({ description: "Position within the question", example: 0 })
  public order: number;

  @ApiProperty({ description: "Option text", example: "5 cmH2O" })
  public content: string;

  @ApiProperty({ description: "Option media", nullable: true, type: EvaluationMediaDTO })
  public media: EvaluationMediaDTO | null;

  @ApiPropertyOptional({ description: "Whether the option is correct (only once the grade is published)", example: true })
  public isCorrect?: boolean;

  @ApiPropertyOptional({ description: "Option feedback (only once the grade is published)", example: "Correct", nullable: true, type: String })
  public feedback?: string | null;

  public constructor(fields: { id: string; order: number; content: string; media: EvaluationMediaDTO | null; isCorrect?: boolean; feedback?: string | null }) {
    this.id = fields.id;
    this.order = fields.order;
    this.content = fields.content;
    this.media = fields.media;

    if (fields.isCorrect !== undefined) {
      this.isCorrect = fields.isCorrect;
      this.feedback = fields.feedback ?? null;
    }
  }
}

export class StudentScenarioDTO {
  @ApiProperty({ description: "Scenario ID", example: "cm5scenario01" })
  public id: string;

  @ApiProperty({ description: "Position within the evaluation", example: 0 })
  public order: number;

  @ApiProperty({ description: "Scenario content (Tiptap document)", type: Object })
  public content: Record<string, unknown>;

  @ApiProperty({ description: "Scenario media", type: [EvaluationMediaDTO] })
  public media: EvaluationMediaDTO[];

  public constructor({ id, order, content, media }: { id: string; order: number; content: Record<string, unknown>; media: EvaluationMediaDTO[] }) {
    this.id = id;
    this.order = order;
    this.content = content;
    this.media = media;
  }
}

export class CheckEvaluationAnswerResponseDTO {
  @ApiProperty({ description: "Whether the selected options are exactly the correct ones", example: true })
  public isCorrect: boolean;

  @ApiProperty({ description: "Correct option IDs", example: ["cm5option01"], type: [String] })
  public correctOptionIds: string[];

  @ApiProperty({ description: "Teacher explanation", example: "PEEP keeps the alveoli open", nullable: true, type: String })
  public explanation: string | null;

  public constructor({ isCorrect, correctOptionIds, explanation }: { isCorrect: boolean; correctOptionIds: string[]; explanation: string | null }) {
    this.isCorrect = isCorrect;
    this.correctOptionIds = correctOptionIds;
    this.explanation = explanation;
  }
}

export class StudentAnswerRevealDTO {
  @ApiProperty({ description: "When the answer was checked (it is locked since then)", example: "2026-10-06T08:05:00.000Z" })
  public revealedAt: Date;

  @ApiProperty({ description: "Whether the checked answer is correct", example: false })
  public isCorrect: boolean;

  @ApiProperty({ description: "Correct option IDs", example: ["cm5option01"], type: [String] })
  public correctOptionIds: string[];

  @ApiProperty({ description: "Teacher explanation", example: "PEEP keeps the alveoli open", nullable: true, type: String })
  public explanation: string | null;

  public constructor(fields: { revealedAt: Date; isCorrect: boolean; correctOptionIds: string[]; explanation: string | null }) {
    this.revealedAt = fields.revealedAt;
    this.isCorrect = fields.isCorrect;
    this.correctOptionIds = fields.correctOptionIds;
    this.explanation = fields.explanation;
  }
}

export class StudentQuestionDTO {
  @ApiProperty({ description: "Question ID", example: "cm5question01" })
  public id: string;

  @ApiProperty({ description: "Scenario the question belongs to", example: "cm5scenario01", nullable: true, type: String })
  public scenarioId: string | null;

  @ApiProperty({ description: "Position in this attempt (shuffled per attempt when the evaluation shuffles questions)", example: 0 })
  public position: number;

  @ApiProperty({ description: "Question type", enum: EVALUATION_QUESTION_TYPE_VALUES, example: "SINGLE_CHOICE" })
  public type: string;

  @ApiProperty({ description: "Question prompt (Tiptap document)", type: Object })
  public prompt: Record<string, unknown>;

  @ApiProperty({ description: "Question media", type: [EvaluationMediaDTO] })
  public media: EvaluationMediaDTO[];

  @ApiProperty({ description: "Points of the question", example: 1 })
  public points: number;

  @ApiProperty({ description: "Clinical case to simulate (SIMULATION questions)", example: "cm5case01", nullable: true, type: String })
  public clinicalCaseId: string | null;

  @ApiProperty({ description: "Options (choice questions)", type: [StudentOptionDTO] })
  public options: StudentOptionDTO[];

  @ApiProperty({ description: "Saved answer", nullable: true, type: StudentAnswerDTO })
  public answer: StudentAnswerDTO | null;

  @ApiProperty({ description: "Hint shown on demand (WORKSHOP evaluations only; null otherwise)", example: "Think about the alveolar recruitment", nullable: true, type: String })
  public hint: string | null;

  @ApiProperty({
    description: "Correction of an answer the student checked for immediate feedback (QUIZ and WORKSHOP); null when the answer was not checked",
    nullable: true,
    type: StudentAnswerRevealDTO,
  })
  public reveal: StudentAnswerRevealDTO | null;

  @ApiPropertyOptional({ description: "Teacher explanation (only once the grade is published)", nullable: true, type: String })
  public explanation?: string | null;

  @ApiPropertyOptional({ description: "Rubric (only once the grade is published)", nullable: true, type: Object })
  public rubric?: unknown;

  @ApiPropertyOptional({ description: "Points earned (only once the grade is published; null while pending)", example: 1, nullable: true, type: Number })
  public earnedScore?: number | null;

  public constructor(fields: {
    id: string;
    scenarioId: string | null;
    position: number;
    type: string;
    prompt: Record<string, unknown>;
    media: EvaluationMediaDTO[];
    points: number;
    clinicalCaseId: string | null;
    options: StudentOptionDTO[];
    answer: StudentAnswerDTO | null;
    hint: string | null;
    reveal: StudentAnswerRevealDTO | null;
    published?: { explanation: string | null; rubric: unknown; earnedScore: number | null };
  }) {
    this.id = fields.id;
    this.scenarioId = fields.scenarioId;
    this.position = fields.position;
    this.type = fields.type;
    this.prompt = fields.prompt;
    this.media = fields.media;
    this.points = fields.points;
    this.clinicalCaseId = fields.clinicalCaseId;
    this.options = fields.options;
    this.answer = fields.answer;
    this.hint = fields.hint;
    this.reveal = fields.reveal;

    if (fields.published) {
      this.explanation = fields.published.explanation;
      this.rubric = fields.published.rubric;
      this.earnedScore = fields.published.earnedScore;
    }
  }
}

export class StudentAttemptEvaluationDTO {
  @ApiProperty({ description: "Evaluation ID", example: "cm5evaluation01" })
  public id: string;

  @ApiProperty({ description: "Evaluation title", example: "Mechanical ventilation midterm" })
  public title: string;

  @ApiProperty({ description: "Evaluation type", enum: EVALUATION_TYPE_VALUES, example: "EXAM" })
  public type: string;

  @ApiProperty({ description: "Description: plain text or a Tiptap document", nullable: true, oneOf: [{ type: "string" }, { type: "object" }] })
  public description: unknown;

  public constructor({ id, title, type, description }: { id: string; title: string; type: string; description: unknown }) {
    this.id = id;
    this.title = title;
    this.type = type;
    this.description = description;
  }
}

export class PartialClosedScoreDTO {
  @ApiProperty({ description: "Closed (choice) questions answered correctly", example: 3 })
  public correct: number;

  @ApiProperty({ description: "Closed (choice) questions in the evaluation", example: 4 })
  public total: number;

  public constructor({ correct, total }: { correct: number; total: number }) {
    this.correct = correct;
    this.total = total;
  }
}

function assignPublishedGrade(target: PublishedGradeFields, published: boolean, fields: PublishedGradeFields): void {
  if (!published) {
    return;
  }

  target.score = fields.score;
  target.maxScore = fields.maxScore;
  target.grade = fields.grade;
  target.passed = fields.passed;
}

export class StudentAttemptDetailDTO implements PublishedGradeFields {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Assignment ID", example: "cm5assignment01", nullable: true, type: String })
  public assignmentId: string | null;

  @ApiProperty({ description: "Attempt number", example: 1 })
  public attemptNumber: number;

  @ApiProperty({ description: "Attempt status", enum: EVALUATION_ATTEMPT_STATUS_VALUES, example: "IN_PROGRESS" })
  public status: string;

  @ApiProperty({ description: "When the attempt started", example: "2026-10-06T08:00:00.000Z" })
  public startedAt: Date;

  @ApiProperty({ description: "When the attempt was submitted or closed", example: null, nullable: true, type: Date })
  public submittedAt: Date | null;

  @ApiProperty({ description: "Effective server-side deadline", example: "2026-10-06T08:30:00.000Z", nullable: true, type: Date })
  public deadlineAt: Date | null;

  @ApiProperty({ description: "Server time, to synchronize the client countdown", example: "2026-10-06T08:05:00.000Z" })
  public serverNow: Date;

  @ApiProperty({ description: "Whether the grade is published (scores and correct answers are only included then)", example: false })
  public published: boolean;

  @ApiPropertyOptional({ description: "Score (published only)", example: 8 })
  public score?: number;

  @ApiPropertyOptional({ description: "Maximum score (published only)", example: 10 })
  public maxScore?: number;

  @ApiPropertyOptional({ description: "Grade 0.0–5.0 (published only)", example: 4 })
  public grade?: number;

  @ApiPropertyOptional({ description: "Whether the grade reaches the passing grade (published only)", example: true })
  public passed?: boolean;

  @ApiProperty({
    description: "Correct closed questions while open questions wait for the teacher (PENDING_REVIEW QUIZ or WORKSHOP attempts only; null otherwise)",
    nullable: true,
    type: PartialClosedScoreDTO,
  })
  public partialClosedScore: PartialClosedScoreDTO | null;

  @ApiProperty({ description: "Evaluation", type: StudentAttemptEvaluationDTO })
  public evaluation: StudentAttemptEvaluationDTO;

  @ApiProperty({ description: "Scenarios", type: [StudentScenarioDTO] })
  public scenarios: StudentScenarioDTO[];

  @ApiProperty({ description: "Questions in the order of this attempt", type: [StudentQuestionDTO] })
  public questions: StudentQuestionDTO[];

  public constructor(fields: {
    id: string;
    assignmentId: string | null;
    attemptNumber: number;
    status: string;
    startedAt: Date;
    submittedAt: Date | null;
    deadlineAt: Date | null;
    serverNow: Date;
    published: boolean;
    grade: PublishedGradeFields;
    partialClosedScore: PartialClosedScoreDTO | null;
    evaluation: StudentAttemptEvaluationDTO;
    scenarios: StudentScenarioDTO[];
    questions: StudentQuestionDTO[];
  }) {
    this.id = fields.id;
    this.assignmentId = fields.assignmentId;
    this.attemptNumber = fields.attemptNumber;
    this.status = fields.status;
    this.startedAt = fields.startedAt;
    this.submittedAt = fields.submittedAt;
    this.deadlineAt = fields.deadlineAt;
    this.serverNow = fields.serverNow;
    this.published = fields.published;
    assignPublishedGrade(this, fields.published, fields.grade);
    this.partialClosedScore = fields.partialClosedScore;
    this.evaluation = fields.evaluation;
    this.scenarios = fields.scenarios;
    this.questions = fields.questions;
  }
}

export class SubmitEvaluationAttemptResponseDTO implements PublishedGradeFields {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public attemptId: string;

  @ApiProperty({ description: "Attempt status after closing", enum: EVALUATION_ATTEMPT_STATUS_VALUES, example: "GRADED" })
  public status: string;

  @ApiProperty({ description: "When the attempt was closed (the deadline when it was closed after expiring)", example: "2026-10-06T08:20:00.000Z", nullable: true, type: Date })
  public submittedAt: Date | null;

  @ApiProperty({ description: "Whether the grade is published", example: true })
  public published: boolean;

  @ApiPropertyOptional({ description: "Score (published only)", example: 8 })
  public score?: number;

  @ApiPropertyOptional({ description: "Maximum score (published only)", example: 10 })
  public maxScore?: number;

  @ApiPropertyOptional({ description: "Grade 0.0–5.0 (published only)", example: 4 })
  public grade?: number;

  @ApiPropertyOptional({ description: "Whether the grade reaches the passing grade (published only)", example: true })
  public passed?: boolean;

  public constructor(fields: { attemptId: string; status: string; submittedAt: Date | null; published: boolean; grade: PublishedGradeFields }) {
    this.attemptId = fields.attemptId;
    this.status = fields.status;
    this.submittedAt = fields.submittedAt;
    this.published = fields.published;
    assignPublishedGrade(this, fields.published, fields.grade);
  }
}

export class MyEvaluationAttemptDTO implements PublishedGradeFields {
  @ApiProperty({ description: "Attempt ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Attempt number", example: 1 })
  public attemptNumber: number;

  @ApiProperty({ description: "Attempt status", enum: EVALUATION_ATTEMPT_STATUS_VALUES, example: "GRADED" })
  public status: string;

  @ApiProperty({ description: "When the attempt started", example: "2026-10-06T08:00:00.000Z" })
  public startedAt: Date;

  @ApiProperty({ description: "When the attempt was submitted", example: "2026-10-06T08:20:00.000Z", nullable: true, type: Date })
  public submittedAt: Date | null;

  @ApiProperty({ description: "Server-side deadline", example: "2026-10-06T08:30:00.000Z", nullable: true, type: Date })
  public deadlineAt: Date | null;

  @ApiProperty({ description: "Whether the grade is published", example: true })
  public published: boolean;

  @ApiPropertyOptional({ description: "Score (published only)", example: 8 })
  public score?: number;

  @ApiPropertyOptional({ description: "Maximum score (published only)", example: 10 })
  public maxScore?: number;

  @ApiPropertyOptional({ description: "Grade 0.0–5.0 (published only)", example: 4 })
  public grade?: number;

  @ApiPropertyOptional({ description: "Whether the grade reaches the passing grade (published only)", example: true })
  public passed?: boolean;

  public constructor(fields: {
    id: string;
    attemptNumber: number;
    status: string;
    startedAt: Date;
    submittedAt: Date | null;
    deadlineAt: Date | null;
    published: boolean;
    grade: PublishedGradeFields;
  }) {
    this.id = fields.id;
    this.attemptNumber = fields.attemptNumber;
    this.status = fields.status;
    this.startedAt = fields.startedAt;
    this.submittedAt = fields.submittedAt;
    this.deadlineAt = fields.deadlineAt;
    this.published = fields.published;
    assignPublishedGrade(this, fields.published, fields.grade);
  }
}

export class MyEvaluationSummaryDTO {
  @ApiProperty({ description: "Evaluation ID", example: "cm5evaluation01" })
  public id: string;

  @ApiProperty({ description: "Evaluation title", example: "Mechanical ventilation midterm" })
  public title: string;

  @ApiProperty({ description: "Evaluation type", enum: EVALUATION_TYPE_VALUES, example: "EXAM" })
  public type: string;

  @ApiProperty({ description: "Description: plain text or a Tiptap document", nullable: true, oneOf: [{ type: "string" }, { type: "object" }] })
  public description: unknown;

  @ApiProperty({ description: "Duration in minutes", example: 45, nullable: true, type: Number })
  public durationMinutes: number | null;

  @ApiProperty({ description: "Attempts allowed", example: 1 })
  public maxAttempts: number;

  @ApiProperty({ description: "Number of questions", example: 10 })
  public questionCount: number;

  @ApiProperty({ description: "Curriculum module of the evaluation", example: "cm5module01", nullable: true, type: String })
  public moduleId: string | null;

  @ApiProperty({ description: "Curriculum level (the evaluation's own, or its module's)", example: "cm5level01", nullable: true, type: String })
  public levelId: string | null;

  @ApiProperty({ description: "Title of that level", example: "Fundamentos de la ventilación mecánica", nullable: true, type: String })
  public levelTitle: string | null;

  @ApiProperty({ description: "Order of that level within its track", example: 1, nullable: true, type: Number })
  public levelOrder: number | null;

  @ApiProperty({ description: "Track (section slug) of that level", example: "mecanica", nullable: true, type: String })
  public track: string | null;

  public constructor(fields: {
    id: string;
    title: string;
    type: string;
    description: unknown;
    durationMinutes: number | null;
    maxAttempts: number;
    questionCount: number;
    moduleId: string | null;
    levelId: string | null;
    levelTitle: string | null;
    levelOrder: number | null;
    track: string | null;
  }) {
    this.id = fields.id;
    this.title = fields.title;
    this.type = fields.type;
    this.description = fields.description;
    this.durationMinutes = fields.durationMinutes;
    this.maxAttempts = fields.maxAttempts;
    this.questionCount = fields.questionCount;
    this.moduleId = fields.moduleId;
    this.levelId = fields.levelId;
    this.levelTitle = fields.levelTitle;
    this.levelOrder = fields.levelOrder;
    this.track = fields.track;
  }
}

export class MyEvaluationDTO {
  @ApiProperty({ description: "Assignment ID (used to start an attempt)", example: "cm5assignment01" })
  public assignmentId: string;

  @ApiProperty({ description: "Derived assignment state", enum: EVALUATION_ASSIGNMENT_STATE_VALUES, example: "ACTIVE" })
  public state: string;

  @ApiProperty({ description: "When the evaluation opens", example: "2026-10-06T08:00:00.000Z" })
  public startsAt: Date;

  @ApiProperty({ description: "When the evaluation closes", example: "2026-10-06T10:00:00.000Z", nullable: true, type: Date })
  public endsAt: Date | null;

  @ApiProperty({ description: "Evaluation summary", nullable: true, type: MyEvaluationSummaryDTO })
  public evaluation: MyEvaluationSummaryDTO | null;

  @ApiProperty({ description: "Own attempts for this evaluation, migrated ones included", type: [MyEvaluationAttemptDTO] })
  public attempts: MyEvaluationAttemptDTO[];

  @ApiProperty({ description: "Whether an attempt can be started or resumed now", example: true })
  public canStart: boolean;

  public constructor(fields: {
    assignmentId: string;
    state: string;
    startsAt: Date;
    endsAt: Date | null;
    evaluation: MyEvaluationSummaryDTO | null;
    attempts: MyEvaluationAttemptDTO[];
    canStart: boolean;
  }) {
    this.assignmentId = fields.assignmentId;
    this.state = fields.state;
    this.startsAt = fields.startsAt;
    this.endsAt = fields.endsAt;
    this.evaluation = fields.evaluation;
    this.attempts = fields.attempts;
    this.canStart = fields.canStart;
  }
}
