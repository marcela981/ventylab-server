/*
 * Funcionalidad: Eventos de dominio de intentos de evaluación
 * Descripción: Eventos emitidos al cerrar un intento: calificado por completo (gancho para la retroalimentación de E6) y nota publicada al estudiante (notificación en tiempo real grade:published), y nota recalculada por el profesor sobre un intento ya calificado (indica si la nota ya estaba publicada)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";

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

export class EvaluationGradePublishedEvent extends DomainEvent {
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
