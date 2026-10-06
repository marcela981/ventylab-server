/*
 * Funcionalidad: Entidad AuditLog
 * Descripción: Representa un registro de auditoría con entidad afectada, acción, cambios y autor de la operación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { generateId } from "@/common/domain/utils/generate-id";

export class AuditLog<Action extends string = string> {
  private readonly _id: string;
  private readonly _action: Action;
  private readonly _description?: string;
  private readonly _performedByUserId?: string;
  private readonly _performedAt: Date;
  private readonly _metadata?: Record<string, unknown>;

  private constructor({
    id,
    action,
    description,
    performedByUserId,
    performedAt,
    metadata,
  }: {
    id: string;
    action: Action;
    description?: string;
    metadata?: Record<string, unknown>;
    performedByUserId?: string;
    performedAt: Date;
  }) {
    this._id = id;
    this._action = action;
    this._description = description;
    this._metadata = metadata;
    this._performedByUserId = performedByUserId;
    this._performedAt = performedAt;
  }

  public get id(): string {
    return this._id;
  }

  public get action(): Action {
    return this._action;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get performedByUserId(): string | undefined {
    return this._performedByUserId;
  }

  public get performedAt(): Date {
    return this._performedAt;
  }

  public get metadata(): Record<string, unknown> | undefined {
    return this._metadata;
  }

  public static create<Action extends string = string>({
    action,
    description,
    performedByUserId,
    metadata,
  }: {
    action: Action;
    description?: string;
    performedByUserId?: string;
    metadata?: Record<string, unknown>;
  }): AuditLog<Action> {
    return new AuditLog({
      id: generateId(),
      action,
      description,
      performedByUserId,
      performedAt: new Date(),
      metadata,
    });
  }
}
