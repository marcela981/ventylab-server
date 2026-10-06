/*
 * Funcionalidad: Entidad Page
 * Descripción: Agregado de dominio de las páginas de contenido de una lección (metadatos, estado de publicación y versión); mantiene sincronizados status, isActive e isPublished y registra auditoría
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
import {
  type ContentStatusValue,
  DRAFT_CONTENT_STATUS,
  isActiveForStatus,
  PUBLISHED_CONTENT_STATUS,
} from "@/features/curriculum/domain/value-objects/content-status";

export const PAGE_ENTITY_COLLECTION: string = "pages";
export const PAGE_ENTITY_TYPE: string = "page";
export const DEFAULT_PAGE_TYPE: string = "THEORY";
export const DEFAULT_PAGE_DIFFICULTY: string = "INTERMEDIATE";

export type PageChanges = Record<string, { before: unknown; after: unknown }>;

export type PageAuditAction = "page_created" | "page_updated";

export interface PageContentFields {
  title?: string;
  slug?: string;
  type?: string;
  description?: string;
  difficulty?: string;
  estimatedMinutes?: number;
  learningObjectives?: string[];
  keyTakeaways?: string[];
  tags?: string[];
  status?: ContentStatusValue;
}

export class Page extends AggregateRoot {
  private _id: string;
  private _moduleId: string;
  private _lessonId?: string;
  private _title: string;
  private _slug: string;
  private _order: number;
  private _type: string;
  private _description?: string;
  private _difficulty: string;
  private _estimatedMinutes?: number;
  private _learningObjectives: string[];
  private _keyTakeaways: string[];
  private _tags: string[];
  private _status: ContentStatusValue;
  private _isActive: boolean;
  private _isPublished: boolean;
  private _version: number;
  private _createdBy: string;
  private _updatedBy?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _publishedAt?: Date;
  private _auditLogs: AuditLog<PageAuditAction>[];

  private constructor({
    id,
    moduleId,
    lessonId,
    title,
    slug,
    order,
    type,
    description,
    difficulty,
    estimatedMinutes,
    learningObjectives,
    keyTakeaways,
    tags,
    status,
    isActive,
    isPublished,
    version,
    createdBy,
    updatedBy,
    createdAt,
    updatedAt,
    publishedAt,
    auditLogs,
  }: {
    id: string;
    moduleId: string;
    lessonId?: string;
    title: string;
    slug: string;
    order: number;
    type: string;
    description?: string;
    difficulty: string;
    estimatedMinutes?: number;
    learningObjectives: string[];
    keyTakeaways: string[];
    tags: string[];
    status: ContentStatusValue;
    isActive: boolean;
    isPublished: boolean;
    version: number;
    createdBy: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    auditLogs: AuditLog<PageAuditAction>[];
  }) {
    super();
    this._id = id;
    this._moduleId = moduleId;
    this._lessonId = lessonId;
    this._title = title;
    this._slug = slug;
    this._order = order;
    this._type = type;
    this._description = description;
    this._difficulty = difficulty;
    this._estimatedMinutes = estimatedMinutes;
    this._learningObjectives = learningObjectives;
    this._keyTakeaways = keyTakeaways;
    this._tags = tags;
    this._status = status;
    this._isActive = isActive;
    this._isPublished = isPublished;
    this._version = version;
    this._createdBy = createdBy;
    this._updatedBy = updatedBy;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._publishedAt = publishedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get moduleId(): string {
    return this._moduleId;
  }

  public get lessonId(): string | undefined {
    return this._lessonId;
  }

  public get title(): string {
    return this._title;
  }

  public get slug(): string {
    return this._slug;
  }

  public get order(): number {
    return this._order;
  }

  public get type(): string {
    return this._type;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get difficulty(): string {
    return this._difficulty;
  }

  public get estimatedMinutes(): number | undefined {
    return this._estimatedMinutes;
  }

  public get learningObjectives(): ReadonlyArray<string> {
    return this._learningObjectives;
  }

  public get keyTakeaways(): ReadonlyArray<string> {
    return this._keyTakeaways;
  }

  public get tags(): ReadonlyArray<string> {
    return this._tags;
  }

  public get status(): ContentStatusValue {
    return this._status;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get isPublished(): boolean {
    return this._isPublished;
  }

  public get version(): number {
    return this._version;
  }

  public get createdBy(): string {
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

  public get publishedAt(): Date | undefined {
    return this._publishedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<PageAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    moduleId,
    lessonId,
    title,
    slug,
    order,
    fields,
    performedBy,
  }: {
    moduleId: string;
    lessonId: string;
    title: string;
    slug: string;
    order: number;
    fields: PageContentFields;
    performedBy: string;
  }): Page {
    const now: Date = new Date();
    const status: ContentStatusValue = fields.status ?? DRAFT_CONTENT_STATUS;

    return new Page({
      id: generateId(),
      moduleId,
      lessonId,
      title,
      slug,
      order,
      type: fields.type ?? DEFAULT_PAGE_TYPE,
      description: fields.description,
      difficulty: fields.difficulty ?? DEFAULT_PAGE_DIFFICULTY,
      estimatedMinutes: fields.estimatedMinutes,
      learningObjectives: fields.learningObjectives ?? [],
      keyTakeaways: fields.keyTakeaways ?? [],
      tags: fields.tags ?? [],
      status,
      isActive: isActiveForStatus(status),
      isPublished: status === PUBLISHED_CONTENT_STATUS,
      version: 1,
      createdBy: performedBy,
      updatedBy: undefined,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === PUBLISHED_CONTENT_STATUS ? now : undefined,
      auditLogs: [AuditLog.create<PageAuditAction>({ action: "page_created", performedByUserId: performedBy, metadata: { lessonId } })],
    });
  }

  public static reconstitute(props: {
    id: string;
    moduleId: string;
    lessonId?: string;
    title: string;
    slug: string;
    order: number;
    type: string;
    description?: string;
    difficulty: string;
    estimatedMinutes?: number;
    learningObjectives: string[];
    keyTakeaways: string[];
    tags: string[];
    status: ContentStatusValue;
    isActive: boolean;
    isPublished: boolean;
    version: number;
    createdBy: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    auditLogs: AuditLog<PageAuditAction>[];
  }): Page {
    return new Page(props);
  }

  public update(fields: PageContentFields, performedBy: string): PageChanges {
    const changes: PageChanges = {};
    const now: Date = new Date();

    this._title = this._applyChange(changes, "title", this._title, fields.title);
    this._slug = this._applyChange(changes, "slug", this._slug, fields.slug);
    this._type = this._applyChange(changes, "type", this._type, fields.type);
    this._description = this._applyChange(changes, "description", this._description, fields.description);
    this._difficulty = this._applyChange(changes, "difficulty", this._difficulty, fields.difficulty);
    this._estimatedMinutes = this._applyChange(changes, "estimatedMinutes", this._estimatedMinutes, fields.estimatedMinutes);
    this._learningObjectives = this._applyChange(changes, "learningObjectives", this._learningObjectives, fields.learningObjectives);
    this._keyTakeaways = this._applyChange(changes, "keyTakeaways", this._keyTakeaways, fields.keyTakeaways);
    this._tags = this._applyChange(changes, "tags", this._tags, fields.tags);
    this._status = this._applyChange(changes, "status", this._status, fields.status);
    this._isActive = isActiveForStatus(this._status);

    const wasPublished: boolean = this._isPublished;

    this._isPublished = this._status === PUBLISHED_CONTENT_STATUS;
    this._publishedAt = this._isPublished && !wasPublished ? now : this._publishedAt;
    this._version += 1;
    this._updatedBy = performedBy;
    this._updatedAt = now;

    this._auditLogs.push(AuditLog.create<PageAuditAction>({ action: "page_updated", performedByUserId: performedBy, metadata: { changes } }));

    return changes;
  }

  private _applyChange<T>(changes: PageChanges, field: string, current: T, next: T | undefined): T {
    if (next === undefined || JSON.stringify(current) === JSON.stringify(next)) {
      return current;
    }

    changes[field] = { before: current ?? null, after: next };

    return next;
  }
}
