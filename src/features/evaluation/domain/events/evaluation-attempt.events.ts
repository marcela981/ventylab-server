/*
 * Funcionalidad: Eventos de dominio de intentos de evaluación
 * Descripción: Eventos emitidos al cerrar un intento: calificado por completo (gancho para la retroalimentación de E6) y nota publicada al estudiante (notificación en tiempo real grade:published), y nota recalculada por el profesor sobre un intento ya calificado (indica si la nota ya estaba publicada); la nota publicada se publica también como grade.published; intento concedido por un reinicio del docente (evaluation.attemptReset, notificación ATTEMPT_RESET)
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import {
  type CatalogDomainEvent,
  catalogMeta,
  type EvaluationAttemptResetPayload,
  type GradePublishedPayload,
} from "@/common/domain/events/domain-event-catalog";

export class EvaluationAttemptGradedEvent extends DomainEvent {
  public readonly attemptId: string;
  public readonly evaluationId: string;
  public readonly userId: string;
  public readonly score: number;
  public readonly maxScore: number;
  public readonly grade: number;

  public constructor({
    attemptId,
    evaluationId,
    userId,
    score,
    maxScore,
    grade,
    performedBy,
  }: {
    attemptId: string;
    evaluationId: string;
    userId: string;
    score: number;
    maxScore: number;
    grade: number;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.attemptId = attemptId;
    this.evaluationId = evaluationId;
    this.userId = userId;
    this.score = score;
    this.maxScore = maxScore;
    this.grade = grade;
  }
}

export class EvaluationGradePublishedEvent extends DomainEvent implements CatalogDomainEvent<"grade.published"> {
  public readonly attemptId: string;
  public readonly evaluationId: string;
  public readonly userId: string;
  public readonly score: number;
  public readonly maxScore: number;
  public readonly grade: number;
  public readonly passed: boolean;
  public readonly publishedAt: Date;

  public constructor({
    attemptId,
    evaluationId,
    userId,
    score,
    maxScore,
    grade,
    passed,
    publishedAt,
    performedBy,
  }: {
    attemptId: string;
    evaluationId: string;
    userId: string;
    score: number;
    maxScore: number;
    grade: number;
    passed: boolean;
    publishedAt: Date;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.attemptId = attemptId;
    this.evaluationId = evaluationId;
    this.userId = userId;
    this.score = score;
    this.maxScore = maxScore;
    this.grade = grade;
    this.passed = passed;
    this.publishedAt = publishedAt;
  }

  public get catalogName(): "grade.published" {
    return "grade.published";
  }

  public toCatalogPayload(): GradePublishedPayload {
    return {
      ...catalogMeta(this),
      attemptId: this.attemptId,
      evaluationId: this.evaluationId,
      userId: this.userId,
      score: this.score,
      maxScore: this.maxScore,
      grade: this.grade,
      passed: this.passed,
      publishedAt: this.publishedAt,
    };
  }
}

export class EvaluationGradeUpdatedEvent extends DomainEvent {
  public readonly attemptId: string;
  public readonly evaluationId: string;
  public readonly userId: string;
  public readonly score: number;
  public readonly maxScore: number;
  public readonly grade: number;
  public readonly passed: boolean;
  public readonly published: boolean;
  public readonly publishedAt?: Date;

  public constructor({
    attemptId,
    evaluationId,
    userId,
    score,
    maxScore,
    grade,
    passed,
    publishedAt,
    performedBy,
  }: {
    attemptId: string;
    evaluationId: string;
    userId: string;
    score: number;
    maxScore: number;
    grade: number;
    passed: boolean;
    publishedAt?: Date;
    performedBy?: string;
  }) {
    super({ performedBy });
    this.attemptId = attemptId;
    this.evaluationId = evaluationId;
    this.userId = userId;
    this.score = score;
    this.maxScore = maxScore;
    this.grade = grade;
    this.passed = passed;
    this.published = publishedAt !== undefined;
    this.publishedAt = publishedAt;
  }
}

export class EvaluationAttemptResetEvent extends DomainEvent implements CatalogDomainEvent<"evaluation.attemptReset"> {
  public readonly evaluationId: string;
  public readonly userId: string;
  public readonly title: string;
  public readonly extraAttempts: number;

  public constructor({
    evaluationId,
    userId,
    title,
    extraAttempts,
    performedBy,
  }: {
    evaluationId: string;
    userId: string;
    title: string;
    extraAttempts: number;
    performedBy: string;
  }) {
    super({ performedBy });
    this.evaluationId = evaluationId;
    this.userId = userId;
    this.title = title;
    this.extraAttempts = extraAttempts;
  }

  public get catalogName(): "evaluation.attemptReset" {
    return "evaluation.attemptReset";
  }

  public toCatalogPayload(): EvaluationAttemptResetPayload {
    return { ...catalogMeta(this), evaluationId: this.evaluationId, userId: this.userId, title: this.title, extraAttempts: this.extraAttempts };
  }
}
