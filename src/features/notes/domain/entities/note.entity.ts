/*
 * Funcionalidad: Entidad Note
 * Descripción: Agregado de la nota privada de un usuario sobre una lección (y opcionalmente una página de esa lección) con contenido Tiptap saneado; solo su autor puede verla o modificarla
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { generateId } from "@/common/domain/utils/generate-id";
import { type NoteContent } from "@/features/notes/domain/value-objects/note-content";

export class Note extends AggregateRoot {
  private _id: string;
  private _userId: string;
  private _lessonId: string;
  private _pageId?: string;
  private _content: NoteContent;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor({
    id,
    userId,
    lessonId,
    pageId,
    content,
    createdAt,
    updatedAt,
  }: {
    id: string;
    userId: string;
    lessonId: string;
    pageId?: string;
    content: NoteContent;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    this._id = id;
    this._userId = userId;
    this._lessonId = lessonId;
    this._pageId = pageId;
    this._content = content;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  public get id(): string {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get lessonId(): string {
    return this._lessonId;
  }

  public get pageId(): string | undefined {
    return this._pageId;
  }

  public get content(): NoteContent {
    return this._content;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public static create({
    userId,
    lessonId,
    pageId,
    content,
  }: {
    userId: string;
    lessonId: string;
    pageId?: string;
    content: NoteContent;
  }): Note {
    const now: Date = new Date();

    return new Note({
      id: generateId(),
      userId,
      lessonId,
      pageId,
      content,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute({
    id,
    userId,
    lessonId,
    pageId,
    content,
    createdAt,
    updatedAt,
  }: {
    id: string;
    userId: string;
    lessonId: string;
    pageId?: string;
    content: NoteContent;
    createdAt: Date;
    updatedAt: Date;
  }): Note {
    return new Note({ id, userId, lessonId, pageId, content, createdAt, updatedAt });
  }

  public isOwnedBy(userId: string): boolean {
    return this._userId === userId;
  }

  public update({ content, pageId }: { content?: NoteContent; pageId?: string | null }): void {
    if (content !== undefined) {
      this._content = content;
    }

    if (pageId !== undefined) {
      this._pageId = pageId ?? undefined;
    }

    this._updatedAt = new Date();
  }
}
