/*
 * Funcionalidad: Entidad QuizAttempt
 * Descripción: Agregado del intento único de un usuario en un quiz con su puntaje, aprobación y respuestas; publica QuizAttemptedEvent al crearse
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { generateId } from "@/common/domain/utils/generate-id";
import { QuizAttemptedEvent } from "@/features/quizzes/domain/events/quiz-attempt.events";
import { type QuizAnswer } from "@/features/quizzes/domain/read-models/quiz.read-model";

export const QUIZ_ATTEMPT_ENTITY_COLLECTION: string = "quiz_attempts";
export const QUIZ_ATTEMPT_ENTITY_TYPE: string = "quiz_attempt";

export type QuizAttemptAuditAction = "quiz_attempt_created";

export class QuizAttempt extends AggregateRoot {
  private _id: string;
  private _userId: string;
  private _quizId: string;
  private _score: number;
  private _passed: boolean;
  private _answers: QuizAnswer[];
  private _startedAt: Date;
  private _completedAt?: Date;
  private _auditLogs: AuditLog<QuizAttemptAuditAction>[];

  private constructor({
    id,
    userId,
    quizId,
    score,
    passed,
    answers,
    startedAt,
    completedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    quizId: string;
    score: number;
    passed: boolean;
    answers: QuizAnswer[];
    startedAt: Date;
    completedAt?: Date;
    auditLogs: AuditLog<QuizAttemptAuditAction>[];
  }) {
    super();
    this._id = id;
    this._userId = userId;
    this._quizId = quizId;
    this._score = score;
    this._passed = passed;
    this._answers = answers;
    this._startedAt = startedAt;
    this._completedAt = completedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get quizId(): string {
    return this._quizId;
  }

  public get score(): number {
    return this._score;
  }

  public get passed(): boolean {
    return this._passed;
  }

  public get answers(): ReadonlyArray<QuizAnswer> {
    return this._answers;
  }

  public get startedAt(): Date {
    return this._startedAt;
  }

  public get completedAt(): Date | undefined {
    return this._completedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<QuizAttemptAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    userId,
    quizId,
    score,
    passed,
    answers,
  }: {
    userId: string;
    quizId: string;
    score: number;
    passed: boolean;
    answers: QuizAnswer[];
  }): QuizAttempt {
    const now: Date = new Date();

    const attempt: QuizAttempt = new QuizAttempt({
      id: generateId(),
      userId,
      quizId,
      score,
      passed,
      answers,
      startedAt: now,
      completedAt: now,
      auditLogs: [
        AuditLog.create<QuizAttemptAuditAction>({
          action: "quiz_attempt_created",
          performedByUserId: userId,
          metadata: { quizId, score, passed },
        }),
      ],
    });

    attempt.publishEvent(new QuizAttemptedEvent({ entity: attempt, performedBy: userId }));

    return attempt;
  }

  public static reconstitute({
    id,
    userId,
    quizId,
    score,
    passed,
    answers,
    startedAt,
    completedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    quizId: string;
    score: number;
    passed: boolean;
    answers: QuizAnswer[];
    startedAt: Date;
    completedAt?: Date;
    auditLogs: AuditLog<QuizAttemptAuditAction>[];
  }): QuizAttempt {
    return new QuizAttempt({ id, userId, quizId, score, passed, answers, startedAt, completedAt, auditLogs });
  }
}
