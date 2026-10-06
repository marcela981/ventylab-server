/*
 * Funcionalidad: Entidad Score
 * Descripción: Agregado de calificación que un profesor asigna a un estudiante por elemento (tipo e ID), con puntaje, puntaje máximo y comentarios; valida que el puntaje esté entre 0 y el máximo y registra auditoría y eventos
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
import { ScoreDeletedEvent, ScoreRecordedEvent, ScoreUpdatedEvent } from "@/features/scores/domain/events/score.events";
import { InvalidScorePointsError } from "@/features/scores/domain/scores.errors";
import { type ScoreEntityTypeValue } from "@/features/scores/domain/value-objects/score-entity-type";

export const SCORE_ENTITY_COLLECTION: string = "scores";
export const SCORE_ENTITY_TYPE: string = "score";

export type ScoreAuditAction = "score_recorded" | "score_updated" | "score_deleted";

export class Score extends AggregateRoot {
  private _id: string;
  private _userId: string;
  private _graderId: string;
  private _entityType: ScoreEntityTypeValue;
  private _entityId: string;
  private _points: number;
  private _maxPoints: number;
  private _comments?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<ScoreAuditAction>[];

  private constructor({
    id,
    userId,
    graderId,
    entityType,
    entityId,
    points,
    maxPoints,
    comments,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    graderId: string;
    entityType: ScoreEntityTypeValue;
    entityId: string;
    points: number;
    maxPoints: number;
    comments?: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ScoreAuditAction>[];
  }) {
    super();
    this._id = id;
    this._userId = userId;
    this._graderId = graderId;
    this._entityType = entityType;
    this._entityId = entityId;
    this._points = points;
    this._maxPoints = maxPoints;
    this._comments = comments;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get graderId(): string {
    return this._graderId;
  }

  public get entityType(): ScoreEntityTypeValue {
    return this._entityType;
  }

  public get entityId(): string {
    return this._entityId;
  }

  public get points(): number {
    return this._points;
  }

  public get maxPoints(): number {
    return this._maxPoints;
  }

  public get comments(): string | undefined {
    return this._comments;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<ScoreAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    userId,
    graderId,
    entityType,
    entityId,
    points,
    maxPoints,
    comments,
  }: {
    userId: string;
    graderId: string;
    entityType: ScoreEntityTypeValue;
    entityId: string;
    points: number;
    maxPoints: number;
    comments?: string;
  }): Score {
    Score._assertPointsInRange(points, maxPoints);

    const now: Date = new Date();

    const score: Score = new Score({
      id: generateId(),
      userId,
      graderId,
      entityType,
      entityId,
      points,
      maxPoints,
      comments,
      createdAt: now,
      updatedAt: now,
      auditLogs: [
        AuditLog.create<ScoreAuditAction>({
          action: "score_recorded",
          performedByUserId: graderId,
          metadata: { userId, entityType, entityId, points, maxPoints },
        }),
      ],
    });

    score.publishEvent(new ScoreRecordedEvent({ entity: score, performedBy: graderId }));

    return score;
  }

  public static reconstitute({
    id,
    userId,
    graderId,
    entityType,
    entityId,
    points,
    maxPoints,
    comments,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    userId: string;
    graderId: string;
    entityType: ScoreEntityTypeValue;
    entityId: string;
    points: number;
    maxPoints: number;
    comments?: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ScoreAuditAction>[];
  }): Score {
    return new Score({ id, userId, graderId, entityType, entityId, points, maxPoints, comments, createdAt, updatedAt, auditLogs });
  }

  public isGradedBy(userId: string): boolean {
    return this._graderId === userId;
  }

  public regrade({ points, maxPoints, comments }: { points: number; maxPoints: number; comments?: string }, performedBy: string): void {
    Score._assertPointsInRange(points, maxPoints);

    const recorded: Record<string, { before: unknown; after: unknown }> = {
      points: { before: this._points, after: points },
      maxPoints: { before: this._maxPoints, after: maxPoints },
    };

    this._points = points;
    this._maxPoints = maxPoints;

    if (comments !== undefined) {
      recorded.comments = { before: this._comments ?? null, after: comments };
      this._comments = comments;
    }

    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<ScoreAuditAction>({
        action: "score_updated",
        performedByUserId: performedBy,
        metadata: { changes: recorded },
      }),
    );

    this.publishEvent(new ScoreUpdatedEvent({ entity: this, performedBy }));
  }

  public delete(performedBy: string): void {
    this._auditLogs.push(
      AuditLog.create<ScoreAuditAction>({
        action: "score_deleted",
        performedByUserId: performedBy,
        metadata: { userId: this._userId, entityType: this._entityType, entityId: this._entityId, points: this._points },
      }),
    );

    this.publishEvent(new ScoreDeletedEvent({ entity: this, performedBy }));
  }

  private static _assertPointsInRange(points: number, maxPoints: number): void {
    if (points < 0 || points > maxPoints) {
      throw new InvalidScorePointsError(maxPoints);
    }
  }
}
