/*
 * Funcionalidad: DTOs de respuesta de quizzes
 * Descripción: Serialización de quizzes (resumen y detalle con preguntas), intentos y resultado calificado de un intento
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class QuizSummaryDTO {
  @ApiProperty({ description: "Quiz unique identifier", example: "cm5quiz01" })
  public id: string;

  @ApiProperty({ description: "Quiz title", example: "Fundamentals of mechanical ventilation" })
  public title: string;

  @ApiProperty({ description: "Quiz description", example: "Checks the basic concepts of the module", nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Module the quiz belongs to", example: "module-01", nullable: true, type: String })
  public moduleId: string | null;

  @ApiProperty({ description: "Minimum score (0-100) required to pass", example: 70 })
  public passingScore: number;

  @ApiProperty({ description: "Time limit in minutes", example: 15, nullable: true, type: Number })
  public timeLimit: number | null;

  @ApiProperty({ description: "Display order inside the module", example: 1 })
  public order: number;

  @ApiProperty({ description: "Creation date", example: "2026-01-15T10:00:00.000Z" })
  public createdAt: Date;

  public constructor({
    id,
    title,
    description,
    moduleId,
    passingScore,
    timeLimit,
    order,
    createdAt,
  }: {
    id: string;
    title: string;
    description: string | null;
    moduleId: string | null;
    passingScore: number;
    timeLimit: number | null;
    order: number;
    createdAt: Date;
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.moduleId = moduleId;
    this.passingScore = passingScore;
    this.timeLimit = timeLimit;
    this.order = order;
    this.createdAt = createdAt;
  }
}

export class QuizDetailDTO extends QuizSummaryDTO {
  @ApiProperty({ description: "Lesson the quiz evaluates", example: "lesson-01", nullable: true, type: String })
  public lessonId: string | null;

  @ApiProperty({
    description: "Questions. Before the user's attempt only id, type, text and options (id, text) are returned; after it, or for users who can manage quizzes, options also carry isCorrect and feedback and questions carry explanation",
    type: Object,
    isArray: true,
    example: [{ id: "q1", type: "multiple_choice", text: "What is PEEP?", options: [{ id: "q1-a", text: "Pressure", isCorrect: true }] }],
  })
  public questions: Record<string, unknown>[];

  @ApiProperty({ description: "Whether correct answers, feedback and explanations are included", example: false })
  public answersRevealed: boolean;

  @ApiProperty({ description: "Whether the quiz is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Last update date", example: "2026-01-15T10:00:00.000Z" })
  public updatedAt: Date;

  public constructor({
    lessonId,
    questions,
    answersRevealed,
    isActive,
    updatedAt,
    ...summary
  }: {
    id: string;
    title: string;
    description: string | null;
    moduleId: string | null;
    passingScore: number;
    timeLimit: number | null;
    order: number;
    createdAt: Date;
    lessonId: string | null;
    questions: Record<string, unknown>[];
    answersRevealed: boolean;
    isActive: boolean;
    updatedAt: Date;
  }) {
    super(summary);
    this.lessonId = lessonId;
    this.questions = questions;
    this.answersRevealed = answersRevealed;
    this.isActive = isActive;
    this.updatedAt = updatedAt;
  }
}

export class QuizAttemptSummaryDTO {
  @ApiProperty({ description: "Attempt unique identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Quiz identifier", example: "cm5quiz01" })
  public quizId: string;

  @ApiProperty({ description: "Score from 0 to 100", example: 80 })
  public score: number;

  @ApiProperty({ description: "Whether the attempt reached the passing score", example: true })
  public passed: boolean;

  @ApiProperty({ description: "Completion date", example: "2026-01-15T10:20:00.000Z", nullable: true, type: Date })
  public completedAt: Date | null;

  public constructor({
    id,
    quizId,
    score,
    passed,
    completedAt,
  }: {
    id: string;
    quizId: string;
    score: number;
    passed: boolean;
    completedAt: Date | null;
  }) {
    this.id = id;
    this.quizId = quizId;
    this.score = score;
    this.passed = passed;
    this.completedAt = completedAt;
  }
}

export class GradedQuestionDTO {
  @ApiProperty({ description: "Question identifier", example: "q1" })
  public questionId: string;

  @ApiProperty({ description: "Option selected by the user, empty when unanswered", example: "q1-b" })
  public selectedOptionId: string;

  @ApiProperty({ description: "Correct option identifier", example: "q1-a" })
  public correctOptionId: string;

  @ApiProperty({ description: "Whether the selected option is correct", example: false })
  public isCorrect: boolean;

  @ApiProperty({ description: "Question explanation", example: "PEEP keeps the alveoli open", nullable: true, type: String })
  public explanation: string | null;

  @ApiProperty({ description: "Feedback of the selected option", example: "Review the definition of PEEP", nullable: true, type: String })
  public feedback: string | null;

  public constructor({
    questionId,
    selectedOptionId,
    correctOptionId,
    isCorrect,
    explanation,
    feedback,
  }: {
    questionId: string;
    selectedOptionId: string;
    correctOptionId: string;
    isCorrect: boolean;
    explanation: string | null;
    feedback: string | null;
  }) {
    this.questionId = questionId;
    this.selectedOptionId = selectedOptionId;
    this.correctOptionId = correctOptionId;
    this.isCorrect = isCorrect;
    this.explanation = explanation;
    this.feedback = feedback;
  }
}

export class QuizAttemptResultDTO {
  @ApiProperty({ description: "Created attempt identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public attemptId: string;

  @ApiProperty({ description: "Score from 0 to 100", example: 80 })
  public score: number;

  @ApiProperty({ description: "Whether the attempt reached the passing score", example: true })
  public passed: boolean;

  @ApiProperty({ description: "Number of questions in the quiz", example: 5 })
  public totalQuestions: number;

  @ApiProperty({ description: "Number of correct answers", example: 4 })
  public correctAnswers: number;

  @ApiProperty({ description: "Per-question grading", type: GradedQuestionDTO, isArray: true })
  public gradedQuestions: GradedQuestionDTO[];

  public constructor({
    attemptId,
    score,
    passed,
    totalQuestions,
    correctAnswers,
    gradedQuestions,
  }: {
    attemptId: string;
    score: number;
    passed: boolean;
    totalQuestions: number;
    correctAnswers: number;
    gradedQuestions: GradedQuestionDTO[];
  }) {
    this.attemptId = attemptId;
    this.score = score;
    this.passed = passed;
    this.totalQuestions = totalQuestions;
    this.correctAnswers = correctAnswers;
    this.gradedQuestions = gradedQuestions;
  }
}
