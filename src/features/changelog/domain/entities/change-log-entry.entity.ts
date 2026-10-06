/*
 * Funcionalidad: Entidad ChangeLogDiff
 * Descripción: Agregado de dominio de la feature de historial de cambios con sus reglas de negocio, eventos de dominio y registros de auditoría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { generateId } from "@/common/domain/utils/generate-id";

export type ChangeLogDiff = Record<string, { before: unknown; after: unknown }>;

export interface ChangeLogAuthor {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
  readonly role: string;
}

export class ChangeLogEntry {
  private readonly _id: string;
  private readonly _entityType: string;
  private readonly _entityId: string;
  private readonly _action: string;
  private readonly _changedBy: string;
  private readonly _changedAt: Date;
  private readonly _diff?: ChangeLogDiff;
  private readonly _metadata?: Record<string, unknown>;
  private readonly _author?: ChangeLogAuthor;

  private constructor({
    id,
    entityType,
    entityId,
    action,
    changedBy,
    changedAt,
    diff,
    metadata,
    author,
  }: {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    changedBy: string;
    changedAt: Date;
    diff?: ChangeLogDiff;
    metadata?: Record<string, unknown>;
    author?: ChangeLogAuthor;
  }) {
    this._id = id;
    this._entityType = entityType;
    this._entityId = entityId;
    this._action = action;
    this._changedBy = changedBy;
    this._changedAt = changedAt;
    this._diff = diff;
    this._metadata = metadata;
    this._author = author;
  }

  public get id(): string {
    return this._id;
  }

  public get entityType(): string {
    return this._entityType;
  }

  public get entityId(): string {
    return this._entityId;
  }

  public get action(): string {
    return this._action;
  }

  public get changedBy(): string {
    return this._changedBy;
  }

  public get changedAt(): Date {
    return this._changedAt;
  }

  public get diff(): ChangeLogDiff | undefined {
    return this._diff;
  }

  public get metadata(): Record<string, unknown> | undefined {
    return this._metadata;
  }

  public get author(): ChangeLogAuthor | undefined {
    return this._author;
  }

  public static create({
    entityType,
    entityId,
    action,
    changedBy,
    diff,
    metadata,
  }: {
    entityType: string;
    entityId: string;
    action: string;
    changedBy: string;
    diff?: ChangeLogDiff;
    metadata?: Record<string, unknown>;
  }): ChangeLogEntry {
    return new ChangeLogEntry({
      id: generateId(),
      entityType,
      entityId,
      action,
      changedBy,
      changedAt: new Date(),
      diff,
      metadata,
    });
  }

  public static reconstitute({
    id,
    entityType,
    entityId,
    action,
    changedBy,
    changedAt,
    diff,
    metadata,
    author,
  }: {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    changedBy: string;
    changedAt: Date;
    diff?: ChangeLogDiff;
    metadata?: Record<string, unknown>;
    author?: ChangeLogAuthor;
  }): ChangeLogEntry {
    return new ChangeLogEntry({ id, entityType, entityId, action, changedBy, changedAt, diff, metadata, author });
  }
}
