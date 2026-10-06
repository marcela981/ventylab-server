/*
 * Funcionalidad: Entidad AiConversation
 * Descripción: Conversación privada de un usuario con el tutor de IA: alcance (libre, lección, módulo o página), referencia al contenido, título automático derivado del primer mensaje, renombrado y marca de actividad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { generateId } from "@/common/domain/utils/generate-id";
import { buildConversationTitle } from "@/features/ai-tutor/domain/services/conversation-title";
import { type AiConversationScopeValue } from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";

export class AiConversation extends AggregateRoot {
  private _id: string;
  private _userId: string;
  private _scope: AiConversationScopeValue;
  private _refId?: string;
  private _title: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor({
    id,
    userId,
    scope,
    refId,
    title,
    createdAt,
    updatedAt,
  }: {
    id: string;
    userId: string;
    scope: AiConversationScopeValue;
    refId?: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    this._id = id;
    this._userId = userId;
    this._scope = scope;
    this._refId = refId;
    this._title = title;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get scope(): AiConversationScopeValue {
    return this._scope;
  }

  public get refId(): string | undefined {
    return this._refId;
  }

  public get title(): string {
    return this._title;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public static start({
    userId,
    scope,
    refId,
    firstMessage,
  }: {
    userId: string;
    scope: AiConversationScopeValue;
    refId?: string;
    firstMessage: string;
  }): AiConversation {
    const now: Date = new Date();

    return new AiConversation({
      id: generateId(),
      userId,
      scope,
      refId,
      title: buildConversationTitle(firstMessage),
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute({
    id,
    userId,
    scope,
    refId,
    title,
    createdAt,
    updatedAt,
  }: {
    id: string;
    userId: string;
    scope: AiConversationScopeValue;
    refId?: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  }): AiConversation {
    return new AiConversation({ id, userId, scope, refId, title, createdAt, updatedAt });
  }

  public rename(title: string): void {
    this._title = buildConversationTitle(title);
    this._updatedAt = new Date();
  }
}
