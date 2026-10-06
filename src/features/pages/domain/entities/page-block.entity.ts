/*
 * Funcionalidad: Entidad PageBlock
 * Descripción: Bloque de contenido de una página (texto enriquecido, imagen, archivo, video, ecuación y tipos heredados) con su orden, contenido normalizado y referencia opcional a media
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { generateId } from "@/common/domain/utils/generate-id";
import { type PageBlockTypeValue } from "@/features/pages/domain/value-objects/page-block-type";

export class PageBlock {
  private _id: string;
  private _pageId: string;
  private _order: number;
  private _type: PageBlockTypeValue;
  private _title?: string;
  private _content: Record<string, unknown>;
  private _mediaId?: string;
  private _estimatedTime?: number;
  private _createdBy?: string;
  private _updatedBy?: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor({
    id,
    pageId,
    order,
    type,
    title,
    content,
    mediaId,
    estimatedTime,
    createdBy,
    updatedBy,
    createdAt,
    updatedAt,
  }: {
    id: string;
    pageId: string;
    order: number;
    type: PageBlockTypeValue;
    title?: string;
    content: Record<string, unknown>;
    mediaId?: string;
    estimatedTime?: number;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = id;
    this._pageId = pageId;
    this._order = order;
    this._type = type;
    this._title = title;
    this._content = content;
    this._mediaId = mediaId;
    this._estimatedTime = estimatedTime;
    this._createdBy = createdBy;
    this._updatedBy = updatedBy;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  public get id(): string {
    return this._id;
  }

  public get pageId(): string {
    return this._pageId;
  }

  public get order(): number {
    return this._order;
  }

  public get type(): PageBlockTypeValue {
    return this._type;
  }

  public get title(): string | undefined {
    return this._title;
  }

  public get content(): Readonly<Record<string, unknown>> {
    return this._content;
  }

  public get mediaId(): string | undefined {
    return this._mediaId;
  }

  public get estimatedTime(): number | undefined {
    return this._estimatedTime;
  }

  public get createdBy(): string | undefined {
    return this._createdBy;
  }

  public get updatedBy(): string | undefined {
    return this._updatedBy;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public static create({
    pageId,
    order,
    type,
    title,
    content,
    mediaId,
    estimatedTime,
    performedBy,
  }: {
    pageId: string;
    order: number;
    type: PageBlockTypeValue;
    title?: string;
    content: Record<string, unknown>;
    mediaId?: string;
    estimatedTime?: number;
    performedBy: string;
  }): PageBlock {
    const now: Date = new Date();

    return new PageBlock({
      id: generateId(),
      pageId,
      order,
      type,
      title,
      content,
      mediaId,
      estimatedTime,
      createdBy: performedBy,
      updatedBy: performedBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: {
    id: string;
    pageId: string;
    order: number;
    type: PageBlockTypeValue;
    title?: string;
    content: Record<string, unknown>;
    mediaId?: string;
    estimatedTime?: number;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
  }): PageBlock {
    return new PageBlock(props);
  }

  public replaceContent({
    type,
    title,
    content,
    mediaId,
    estimatedTime,
    performedBy,
  }: {
    type: PageBlockTypeValue;
    title?: string;
    content: Record<string, unknown>;
    mediaId?: string;
    estimatedTime?: number;
    performedBy: string;
  }): void {
    this._type = type;
    this._title = title;
    this._content = content;
    this._mediaId = mediaId;
    this._estimatedTime = estimatedTime;
    this._updatedBy = performedBy;
    this._updatedAt = new Date();
  }
}
