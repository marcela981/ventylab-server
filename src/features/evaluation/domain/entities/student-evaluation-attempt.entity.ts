/*
 * Funcionalidad: Agregado StudentEvaluationAttempt
 * Descripción: Intento de un estudiante en una evaluación con sus respuestas por pregunta: inicio con número de intento y plazo del servidor, autoguardado (solo en curso y no heredado), cierre con la calificación automática (puntaje por pregunta, estado GRADED o PENDING_REVIEW, nota, publicación inmediata opcional) y eventos de intento calificado y nota publicada; calificación docente por pregunta (puntaje manual 0–puntos, comentario obligatorio al sobrescribir un puntaje existente, recálculo de puntaje, estado y nota con eventos de calificado, publicado o actualizado) y publicación idempotente de la nota; los intentos heredados (legacySource) son de solo lectura para el estudiante pero el profesor puede calificarlos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { generateId } from "@/common/domain/utils/generate-id";
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import {
  EvaluationAttemptNotGradableError,
  EvaluationAttemptNotGradedError,
  EvaluationAttemptNotInProgressError,
  EvaluationAttemptReadOnlyError,
  EvaluationQuestionNotFoundError,
  GradeOverrideCommentRequiredError,
  InvalidManualScoreError,
} from "@/features/evaluation/domain/evaluation.errors";
import {
  EvaluationAttemptGradedEvent,
  EvaluationGradePublishedEvent,
  EvaluationGradeUpdatedEvent,
} from "@/features/evaluation/domain/events/evaluation-attempt.events";
import { type ValidatedEvaluationAnswer } from "@/features/evaluation/domain/services/evaluation-answer-validation";
import {
  type AttemptScoreSummary,
  type EvaluationAttemptGrading,
  hasPassedEvaluation,
  type QuestionGrade,
  roundTo,
  summarizeAttemptScores,
} from "@/features/evaluation/domain/services/evaluation-attempt-grader";
import {
  type EvaluationAttemptStatusValue,
  GRADED_ATTEMPT_STATUS,
  IN_PROGRESS_ATTEMPT_STATUS,
  isClosedAttemptStatus,
  PENDING_REVIEW_ATTEMPT_STATUS,
} from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";

export const EVALUATION_ANSWER_AUDIT_TARGET: string = "evaluation_answers";

export interface EvaluationAnswerRecord {
  readonly id: string;
  readonly questionId: string;
  readonly selectedOptionIds: ReadonlyArray<string>;
  readonly textAnswer?: string;
  readonly simulationSessionId?: string;
  readonly autoScore?: number;
  readonly manualScore?: number;
  readonly teacherComment?: string;
  readonly gradedById?: string;
}

export interface StudentEvaluationAttemptProps {
  id: string;
  evaluationId: string;
  assignmentId?: string;
  userId: string;
  attemptNumber: number;
  status: EvaluationAttemptStatusValue;
  startedAt: Date;
  submittedAt?: Date;
  deadlineAt?: Date;
  score?: number;
  maxScore?: number;
  grade?: number;
  gradePublishedAt?: Date;
  isLate: boolean;
  legacySource?: string;
  answers: EvaluationAnswerRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CloseAttemptInput {
  readonly grading: EvaluationAttemptGrading;
  readonly submittedAt: Date;
  readonly now: Date;
  readonly publishImmediately: boolean;
  readonly passingGrade: number;
}

export interface GradeAnswerInput {
  readonly questions: ReadonlyArray<EvaluationQuestionItem>;
  readonly questionId: string;
  readonly manualScore: number;
  readonly comment?: string;
  readonly graderId: string;
  readonly now: Date;
  readonly publishImmediately: boolean;
  readonly passingGrade: number;
}

export interface AnswerScoreState extends Record<string, unknown> {
  readonly autoScore: number | null;
  readonly manualScore: number | null;
  readonly teacherComment: string | null;
}

export interface AnswerGradeChange {
  readonly answerId: string;
  readonly override: boolean;
  readonly before: AnswerScoreState;
  readonly after: AnswerScoreState;
}

function scoreState(answer: EvaluationAnswerRecord | undefined): AnswerScoreState {
  return { autoScore: answer?.autoScore ?? null, manualScore: answer?.manualScore ?? null, teacherComment: answer?.teacherComment ?? null };
}

export class StudentEvaluationAttempt extends AggregateRoot {
  private readonly _props: StudentEvaluationAttemptProps;
  private readonly _answers: Map<string, EvaluationAnswerRecord>;
  private readonly _changedQuestionIds: Set<string> = new Set<string>();

  private constructor(props: StudentEvaluationAttemptProps) {
    super();
    this._props = { ...props };
    this._answers = new Map<string, EvaluationAnswerRecord>(props.answers.map((answer: EvaluationAnswerRecord) => [answer.questionId, answer]));
  }

  public get id(): string {
    return this._props.id;
  }

  public get evaluationId(): string {
    return this._props.evaluationId;
  }

  public get assignmentId(): string | undefined {
    return this._props.assignmentId;
  }

  public get userId(): string {
    return this._props.userId;
  }

  public get attemptNumber(): number {
    return this._props.attemptNumber;
  }

  public get status(): EvaluationAttemptStatusValue {
    return this._props.status;
  }

  public get startedAt(): Date {
    return this._props.startedAt;
  }

  public get submittedAt(): Date | undefined {
    return this._props.submittedAt;
  }

  public get deadlineAt(): Date | undefined {
    return this._props.deadlineAt;
  }

  public get score(): number | undefined {
    return this._props.score;
  }

  public get maxScore(): number | undefined {
    return this._props.maxScore;
  }

  public get grade(): number | undefined {
    return this._props.grade;
  }

  public get gradePublishedAt(): Date | undefined {
    return this._props.gradePublishedAt;
  }

  public get isLate(): boolean {
    return this._props.isLate;
  }

  public get legacySource(): string | undefined {
    return this._props.legacySource;
  }

  public get isLegacy(): boolean {
    return this._props.legacySource !== undefined;
  }

  public get isInProgress(): boolean {
    return this._props.status === IN_PROGRESS_ATTEMPT_STATUS;
  }

  public get isClosed(): boolean {
    return isClosedAttemptStatus(this._props.status);
  }

  public get isPublished(): boolean {
    return this._props.gradePublishedAt !== undefined;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  public get answers(): ReadonlyArray<EvaluationAnswerRecord> {
    return [...this._answers.values()];
  }

  public get changedAnswers(): ReadonlyArray<EvaluationAnswerRecord> {
    return [...this._changedQuestionIds].flatMap((questionId: string) => {
      const answer: EvaluationAnswerRecord | undefined = this._answers.get(questionId);

      return answer ? [answer] : [];
    });
  }

  public answerFor(questionId: string): EvaluationAnswerRecord | undefined {
    return this._answers.get(questionId);
  }

  public saveAnswer(questionId: string, answer: ValidatedEvaluationAnswer, now: Date): void {
    this._assertWritable();

    const current: EvaluationAnswerRecord | undefined = this._answers.get(questionId);

    this._answers.set(questionId, {
      id: current?.id ?? generateId(),
      questionId,
      selectedOptionIds: [...answer.selectedOptionIds],
      textAnswer: answer.textAnswer,
      simulationSessionId: answer.simulationSessionId,
    });

    this._changedQuestionIds.add(questionId);
    this._props.updatedAt = now;
  }

  public close({ grading, submittedAt, now, publishImmediately, passingGrade }: CloseAttemptInput): void {
    this._assertWritable();

    for (const questionGrade of grading.questions) {
      this._recordAutoScore(questionGrade);
    }

    const graded: boolean = grading.status === GRADED_ATTEMPT_STATUS && grading.grade !== undefined;
    const published: boolean = graded && publishImmediately;

    this._props.status = grading.status;
    this._props.submittedAt = submittedAt;
    this._props.score = grading.score;
    this._props.maxScore = grading.maxScore;
    this._props.grade = graded ? grading.grade : undefined;
    this._props.gradePublishedAt = published ? now : undefined;
    this._props.isLate = false;
    this._props.updatedAt = now;

    if (graded && grading.grade !== undefined) {
      const grade: number = grading.grade;

      this.publishEvent(
        new EvaluationAttemptGradedEvent({
          attemptId: this.id,
          evaluationId: this.evaluationId,
          userId: this.userId,
          score: grading.score,
          maxScore: grading.maxScore,
          grade,
          performedBy: this.userId,
        }),
      );

      if (published) {
        this.publishEvent(
          new EvaluationGradePublishedEvent({
            attemptId: this.id,
            evaluationId: this.evaluationId,
            userId: this.userId,
            score: grading.score,
            maxScore: grading.maxScore,
            grade,
            passed: hasPassedEvaluation(grade, passingGrade),
            publishedAt: now,
            performedBy: this.userId,
          }),
        );
      }
    }
  }

  public gradeAnswer({ questions, questionId, manualScore, comment, graderId, now, publishImmediately, passingGrade }: GradeAnswerInput): AnswerGradeChange {
    if (this.isInProgress) {
      throw new EvaluationAttemptNotGradableError();
    }

    const question: EvaluationQuestionItem | undefined = questions.find((item: EvaluationQuestionItem) => item.id === questionId);

    if (!question) {
      throw new EvaluationQuestionNotFoundError();
    }

    if (!Number.isFinite(manualScore) || manualScore < 0 || manualScore > question.points) {
      throw new InvalidManualScoreError(question.points);
    }

    const current: EvaluationAnswerRecord | undefined = this._answers.get(questionId);
    const override: boolean = current?.autoScore !== undefined || current?.manualScore !== undefined;
    const trimmedComment: string | undefined = comment?.trim() ? comment.trim() : undefined;

    if (override && trimmedComment === undefined) {
      throw new GradeOverrideCommentRequiredError();
    }

    const answer: EvaluationAnswerRecord = {
      id: current?.id ?? generateId(),
      questionId,
      selectedOptionIds: current?.selectedOptionIds ?? [],
      textAnswer: current?.textAnswer,
      simulationSessionId: current?.simulationSessionId,
      autoScore: current?.autoScore,
      manualScore: roundTo(manualScore, 2),
      teacherComment: trimmedComment ?? current?.teacherComment,
      gradedById: graderId,
    };

    this._answers.set(questionId, answer);
    this._changedQuestionIds.add(questionId);
    this._recompute(questions, { graderId, now, publishImmediately, passingGrade });

    return { answerId: answer.id, override, before: scoreState(current), after: scoreState(answer) };
  }

  public publishGrade(now: Date, passingGrade: number, performedBy: string): boolean {
    const grade: number | undefined = this._props.grade;

    if (this._props.status !== GRADED_ATTEMPT_STATUS || grade === undefined) {
      throw new EvaluationAttemptNotGradedError();
    }

    if (this.isPublished) {
      return false;
    }

    this._props.gradePublishedAt = now;
    this._props.updatedAt = now;
    this._publishGradePublished(grade, now, passingGrade, performedBy);

    return true;
  }

  public toSnapshot(): StudentEvaluationAttemptProps {
    return { ...this._props, answers: this.answers.map((answer: EvaluationAnswerRecord) => ({ ...answer, selectedOptionIds: [...answer.selectedOptionIds] })) };
  }

  public static start({
    evaluationId,
    assignmentId,
    userId,
    attemptNumber,
    startedAt,
    deadlineAt,
  }: {
    evaluationId: string;
    assignmentId: string;
    userId: string;
    attemptNumber: number;
    startedAt: Date;
    deadlineAt?: Date;
  }): StudentEvaluationAttempt {
    return new StudentEvaluationAttempt({
      id: generateId(),
      evaluationId,
      assignmentId,
      userId,
      attemptNumber,
      status: IN_PROGRESS_ATTEMPT_STATUS,
      startedAt,
      deadlineAt,
      isLate: false,
      answers: [],
      createdAt: startedAt,
      updatedAt: startedAt,
    });
  }

  public static reconstitute(props: StudentEvaluationAttemptProps): StudentEvaluationAttempt {
    return new StudentEvaluationAttempt(props);
  }

  private _recompute(
    questions: ReadonlyArray<EvaluationQuestionItem>,
    { graderId, now, publishImmediately, passingGrade }: { graderId: string; now: Date; publishImmediately: boolean; passingGrade: number },
  ): void {
    const wasGraded: boolean = this._props.status === GRADED_ATTEMPT_STATUS;
    const summary: AttemptScoreSummary = summarizeAttemptScores(questions, this._answers);

    this._props.score = summary.score;
    this._props.maxScore = summary.maxScore;
    this._props.updatedAt = now;

    if (summary.grade === undefined) {
      this._props.status = PENDING_REVIEW_ATTEMPT_STATUS;
      this._props.grade = undefined;

      return;
    }

    const grade: number = summary.grade;

    this._props.status = GRADED_ATTEMPT_STATUS;
    this._props.grade = grade;

    if (wasGraded) {
      this.publishEvent(
        new EvaluationGradeUpdatedEvent({
          attemptId: this.id,
          evaluationId: this.evaluationId,
          userId: this.userId,
          score: summary.score,
          maxScore: summary.maxScore,
          grade,
          passed: hasPassedEvaluation(grade, passingGrade),
          publishedAt: this._props.gradePublishedAt,
          performedBy: graderId,
        }),
      );

      return;
    }

    this.publishEvent(
      new EvaluationAttemptGradedEvent({
        attemptId: this.id,
        evaluationId: this.evaluationId,
        userId: this.userId,
        score: summary.score,
        maxScore: summary.maxScore,
        grade,
        performedBy: graderId,
      }),
    );

    if (publishImmediately && !this.isPublished) {
      this._props.gradePublishedAt = now;
      this._publishGradePublished(grade, now, passingGrade, graderId);
    }
  }

  private _publishGradePublished(grade: number, publishedAt: Date, passingGrade: number, performedBy: string): void {
    this.publishEvent(
      new EvaluationGradePublishedEvent({
        attemptId: this.id,
        evaluationId: this.evaluationId,
        userId: this.userId,
        score: this._props.score ?? 0,
        maxScore: this._props.maxScore ?? 0,
        grade,
        passed: hasPassedEvaluation(grade, passingGrade),
        publishedAt,
        performedBy,
      }),
    );
  }

  private _recordAutoScore(questionGrade: QuestionGrade): void {
    const current: EvaluationAnswerRecord | undefined = this._answers.get(questionGrade.questionId);

    this._answers.set(questionGrade.questionId, {
      id: current?.id ?? generateId(),
      questionId: questionGrade.questionId,
      selectedOptionIds: current?.selectedOptionIds ?? [],
      textAnswer: current?.textAnswer,
      simulationSessionId: current?.simulationSessionId,
      autoScore: questionGrade.autoScore,
      manualScore: current?.manualScore,
      teacherComment: current?.teacherComment,
      gradedById: current?.gradedById,
    });

    this._changedQuestionIds.add(questionGrade.questionId);
  }

  private _assertWritable(): void {
    if (this.isLegacy) {
      throw new EvaluationAttemptReadOnlyError();
    }

    if (!this.isInProgress) {
      throw new EvaluationAttemptNotInProgressError();
    }
  }
}
