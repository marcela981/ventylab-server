/*
 * Funcionalidad: Entidad Notification
 * Descripción: Notificación persistida de un usuario: tipo, título, cuerpo, referencias de enlace profundo y marca de lectura; genera su identificador UUID v7 al crearse
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { generateId } from "@/common/domain/utils/generate-id";
import { type NotificationTypeValue } from "@/features/notifications/domain/value-objects/notification-type";

export type NotificationData = Record<string, string | number | boolean | null>;

export interface NotificationContent {
  readonly type: NotificationTypeValue;
  readonly title: string;
  readonly body: string;
  readonly data?: NotificationData;
}

export class Notification {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _type: string;
  private readonly _title: string;
  private readonly _body: string;
  private readonly _data?: NotificationData;
  private _readAt?: Date;
  private readonly _createdAt: Date;

  private constructor({
    id,
    userId,
    type,
    title,
    body,
    data,
    readAt,
    createdAt,
  }: {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: NotificationData;
    readAt?: Date;
    createdAt: Date;
  }) {
    this._id = id;
    this._userId = userId;
    this._type = type;
    this._title = title;
    this._body = body;
    this._data = data;
    this._readAt = readAt;
    this._createdAt = createdAt;
  }

  public static create(userId: string, content: NotificationContent, now: Date): Notification {
    return new Notification({ id: generateId(), userId, type: content.type, title: content.title, body: content.body, data: content.data, createdAt: now });
  }

  public static fromPersistence(props: {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: NotificationData;
    readAt?: Date;
    createdAt: Date;
  }): Notification {
    return new Notification(props);
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get type(): string {
    return this._type;
  }

  public get title(): string {
    return this._title;
  }

  public get body(): string {
    return this._body;
  }

  public get data(): NotificationData | undefined {
    return this._data;
  }

  public get readAt(): Date | undefined {
    return this._readAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get isRead(): boolean {
    return this._readAt !== undefined;
  }

  public markRead(now: Date): boolean {
    if (this._readAt !== undefined) {
      return false;
    }

    this._readAt = now;

    return true;
  }
}
