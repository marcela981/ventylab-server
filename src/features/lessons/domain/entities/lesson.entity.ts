/*
 * Funcionalidad: Entidad LESSON_ENTITY_COLLECTION
 * Descripción: Agregado de dominio de la feature de lecciones con sus reglas de negocio, eventos de dominio y registros de auditoría
 * Versión: 1.1
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
  type ContentStatusState,
  type ContentStatusValue,
  isActiveForStatus,
  PUBLISHED_CONTENT_STATUS,
  resolveContentStatus,
} from "@/features/curriculum/domain/value-objects/content-status";
import { LessonBlocksSavedEvent, LessonCreatedEvent, LessonDeactivatedEvent, LessonUpdatedEvent } from "@/features/lessons/domain/events/lesson.events";

export const LESSON_ENTITY_COLLECTION: string = "lessons";
export const LESSON_ENTITY_TYPE: string = "lesson";

export type LessonChanges = Record<string, { before: unknown; after: unknown }>;

export type LessonAuditAction = "lesson_created" | "lesson_updated" | "lesson_deactivated" | "lesson_blocks_saved";

export class Lesson extends AggregateRoot {
  private _id: string;
  private _moduleId: string;
  private _title: string;
  private _slug?: string;
  private _content?: string;
  private _order: number;
  private _estimatedTime?: number;
  private _aiGenerated: boolean;
  private _sourcePrompt?: string;
  private _isActive: boolean;
  private _status: ContentStatusValue;
  private _color?: string;
  private _tags: string[];
  private _blocks?: unknown;
  private _hasRequiredQuiz: boolean;
  private _lastModifiedBy?: string;
  private _lastModifiedAt?: Date;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<LessonAuditAction>[];

  private constructor({
    id,
    moduleId,
    title,
    slug,
    content,
    order,
    estimatedTime,
    aiGenerated,
    sourcePrompt,
    isActive,
    status,
    color,
    tags,
    blocks,
    hasRequiredQuiz,
    lastModifiedBy,
    lastModifiedAt,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    moduleId: string;
    title: string;
    slug?: string;
    content?: string;
    order: number;
    estimatedTime?: number;
    aiGenerated: boolean;
    sourcePrompt?: string;
    isActive: boolean;
    status: ContentStatusValue;
    color?: string;
    tags: string[];
    blocks?: unknown;
    hasRequiredQuiz: boolean;
    lastModifiedBy?: string;
    lastModifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<LessonAuditAction>[];
  }) {
    super();
    this._id = id;
    this._moduleId = moduleId;
    this._title = title;
    this._slug = slug;
    this._content = content;
    this._order = order;
    this._estimatedTime = estimatedTime;
    this._aiGenerated = aiGenerated;
    this._sourcePrompt = sourcePrompt;
    this._isActive = isActive;
    this._status = status;
    this._color = color;
    this._tags = tags;
    this._blocks = blocks;
    this._hasRequiredQuiz = hasRequiredQuiz;
    this._lastModifiedBy = lastModifiedBy;
    this._lastModifiedAt = lastModifiedAt;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get moduleId(): string {
    return this._moduleId;
  }

  public get title(): string {
    return this._title;
  }

  public get slug(): string | undefined {
    return this._slug;
  }

  public get content(): string | undefined {
    return this._content;
  }

  public get order(): number {
    return this._order;
  }

  public get estimatedTime(): number | undefined {
    return this._estimatedTime;
  }

  public get aiGenerated(): boolean {
    return this._aiGenerated;
  }

  public get sourcePrompt(): string | undefined {
    return this._sourcePrompt;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get color(): string | undefined {
    return this._color;
  }

  public get tags(): ReadonlyArray<string> {
    return this._tags;
  }

  public get blocks(): unknown {
    return this._blocks;
  }

  public get hasRequiredQuiz(): boolean {
    return this._hasRequiredQuiz;
  }

  public get lastModifiedBy(): string | undefined {
    return this._lastModifiedBy;
  }

  public get lastModifiedAt(): Date | undefined {
    return this._lastModifiedAt;
  }

  public get status(): ContentStatusValue {
    return this._status;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<LessonAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    moduleId,
    title,
    content,
    order,
    estimatedTime,
    aiGenerated,
    sourcePrompt,
    status,
    performedBy,
  }: {
    moduleId: string;
    title: string;
    content: string;
    order: number;
    estimatedTime: number;
    aiGenerated: boolean;
    sourcePrompt?: string;
    status?: ContentStatusValue;
    performedBy?: string;
  }): Lesson {
    const now: Date = new Date();
    const initialStatus: ContentStatusValue = status ?? PUBLISHED_CONTENT_STATUS;

    const lesson: Lesson = new Lesson({
      id: generateId(),
      moduleId,
      title,
      slug: undefined,
      content,
      order,
      estimatedTime,
      aiGenerated,
      sourcePrompt,
      isActive: isActiveForStatus(initialStatus),
      status: initialStatus,
      color: undefined,
      tags: [],
      blocks: undefined,
      hasRequiredQuiz: false,
      lastModifiedBy: performedBy,
      lastModifiedAt: performedBy ? now : undefined,
      createdAt: now,
      updatedAt: now,
      auditLogs: [AuditLog.create<LessonAuditAction>({ action: "lesson_created", performedByUserId: performedBy })],
    });

    lesson.publishEvent(new LessonCreatedEvent({ entity: lesson, performedBy }));

    return lesson;
  }

  public static reconstitute({
    id,
    moduleId,
    title,
    slug,
    content,
    order,
    estimatedTime,
    aiGenerated,
    sourcePrompt,
    isActive,
    status,
    color,
    tags,
    blocks,
    hasRequiredQuiz,
    lastModifiedBy,
    lastModifiedAt,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    moduleId: string;
    title: string;
    slug?: string;
    content?: string;
    order: number;
    estimatedTime?: number;
    aiGenerated: boolean;
    sourcePrompt?: string;
    isActive: boolean;
    status: ContentStatusValue;
    color?: string;
    tags: string[];
    blocks?: unknown;
    hasRequiredQuiz: boolean;
    lastModifiedBy?: string;
    lastModifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<LessonAuditAction>[];
  }): Lesson {
    return new Lesson({
      id,
      moduleId,
      title,
      slug,
      content,
      order,
      estimatedTime,
      aiGenerated,
      sourcePrompt,
      isActive,
      status,
      color,
      tags,
      blocks,
      hasRequiredQuiz,
      lastModifiedBy,
      lastModifiedAt,
      createdAt,
      updatedAt,
      auditLogs,
    });
  }

  public update({
    title,
    content,
    order,
    estimatedTime,
    aiGenerated,
    sourcePrompt,
    status,
    performedBy,
  }: {
    title?: string;
    content?: string;
    order?: number;
    estimatedTime?: number;
    aiGenerated?: boolean;
    sourcePrompt?: string;
    status?: ContentStatusValue;
    performedBy?: string;
  }): void {
    const changes: LessonChanges = {};

    this._title = this._applyChange(changes, "title", this._title, title);
    this._content = this._applyChange(changes, "content", this._content, content);
    this._order = this._applyChange(changes, "order", this._order, order);
    this._estimatedTime = this._applyChange(changes, "estimatedTime", this._estimatedTime, estimatedTime);
    this._aiGenerated = this._applyChange(changes, "aiGenerated", this._aiGenerated, aiGenerated);
    this._sourcePrompt = this._applyChange(changes, "sourcePrompt", this._sourcePrompt, sourcePrompt);

    const next: ContentStatusState = resolveContentStatus({ currentStatus: this._status, status });

    this._status = this._applyChange(changes, "status", this._status, next.status);
    this._isActive = this._applyChange(changes, "isActive", this._isActive, next.isActive);

    this._touch(performedBy, false);

    this._auditLogs.push(AuditLog.create<LessonAuditAction>({ action: "lesson_updated", performedByUserId: performedBy, metadata: { changes } }));

    this.publishEvent(new LessonUpdatedEvent({ entity: this, changes, performedBy }));
  }

  public deactivate(performedBy?: string): void {
    const wasActive: boolean = this._isActive;

    this._isActive = false;
    this._status = resolveContentStatus({ currentStatus: this._status, isActive: false }).status;
    this._touch(performedBy, false);

    this._auditLogs.push(
      AuditLog.create<LessonAuditAction>({
        action: "lesson_deactivated",
        performedByUserId: performedBy,
        metadata: { changes: { isActive: { before: wasActive, after: false } } },
      }),
    );

    this.publishEvent(new LessonDeactivatedEvent({ entity: this, performedBy }));
  }

  public saveBlocks(blocks: unknown[], performedBy?: string): void {
    this._blocks = blocks;
    this._touch(performedBy, true);

    this._auditLogs.push(AuditLog.create<LessonAuditAction>({ action: "lesson_blocks_saved", performedByUserId: performedBy, metadata: { blocks: blocks.length } }));

    this.publishEvent(new LessonBlocksSavedEvent({ entity: this, performedBy }));
  }

  private _touch(performedBy: string | undefined, alwaysStampModification: boolean): void {
    const now: Date = new Date();

    this._updatedAt = now;
    this._lastModifiedBy = performedBy;
    this._lastModifiedAt = performedBy || alwaysStampModification ? now : this._lastModifiedAt;
  }

  private _applyChange<T>(changes: LessonChanges, field: string, current: T, next: T | undefined): T {
    if (next === undefined || JSON.stringify(current) === JSON.stringify(next)) {
      return current;
    }

    changes[field] = { before: current ?? null, after: next };

    return next;
  }
}
