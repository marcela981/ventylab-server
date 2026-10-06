/*
 * Funcionalidad: Modelo ErrorLog
 * Descripción: Representa un registro de error persistido en la tabla error_logs
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { generateId } from "@/common/domain/utils/generate-id";

export class ErrorLog {
  private readonly _id: string;
  private readonly _traceId: string;
  private readonly _exception: string;
  private readonly _occurredAt: Date;
  private readonly _content: Record<string, unknown>;

  private constructor({
    id,
    traceId,
    exception,
    occurredAt,
    content,
  }: {
    id: string;
    traceId: string;
    exception: string;
    occurredAt: Date;
    content: Record<string, unknown>;
  }) {
    this._id = id;
    this._traceId = traceId;
    this._exception = exception;
    this._occurredAt = occurredAt;
    this._content = content;
  }

  public get id(): string {
    return this._id;
  }

  public get traceId(): string {
    return this._traceId;
  }

  public get exception(): string {
    return this._exception;
  }

  public get occurredAt(): Date {
    return this._occurredAt;
  }

  public get content(): Record<string, unknown> {
    return this._content;
  }

  public static create({
    traceId,
    exception,
    content,
  }: {
    traceId: string;
    exception: string;
    content: Record<string, unknown>;
  }): ErrorLog {
    return new ErrorLog({
      id: generateId(),
      traceId,
      exception,
      occurredAt: new Date(),
      content,
    });
  }
}
