/*
 * Funcionalidad: Entidad LEVEL_ENTITY_COLLECTION
 * Descripción: Agregado de dominio de la feature de niveles con sus reglas de negocio, eventos de dominio y registros de auditoría
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
import {
  LevelCreatedEvent,
  LevelDeactivatedEvent,
  LevelNodeCreatedEvent,
  LevelNodeUpdatedEvent,
  LevelPrerequisiteAddedEvent,
  LevelPrerequisiteRemovedEvent,
  LevelUpdatedEvent,
} from "@/features/levels/domain/events/level.events";

export const LEVEL_ENTITY_COLLECTION: string = "levels";
export const LEVEL_ENTITY_TYPE: string = "level";

export type LevelChanges = Record<string, { before: unknown; after: unknown }>;

export type LevelAuditAction =
  | "level_created"
  | "level_updated"
  | "level_deactivated"
  | "level_prerequisite_added"
  | "level_prerequisite_removed"
  | "level_prerequisites_replaced";

export class Level extends AggregateRoot {
  private _id: string;
  private _title: string;
  private _track: string;
  private _description?: string;
  private _order: number;
  private _isActive: boolean;
  private _status: ContentStatusValue;
  private _sectionId?: string;
  private _color?: string;
  private _tags: string[];
  private _parentId?: string;
  private _lastModifiedBy?: string;
  private _lastModifiedAt?: Date;
  private _prerequisiteLevelIds: string[];
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<LevelAuditAction>[];

  private constructor({
    id,
    title,
    track,
    description,
    order,
    isActive,
    status,
    sectionId,
    color,
    tags,
    parentId,
    lastModifiedBy,
    lastModifiedAt,
    prerequisiteLevelIds,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    title: string;
    track: string;
    description?: string;
    order: number;
    isActive: boolean;
    status: ContentStatusValue;
    sectionId?: string;
    color?: string;
    tags: string[];
    parentId?: string;
    lastModifiedBy?: string;
    lastModifiedAt?: Date;
    prerequisiteLevelIds: string[];
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<LevelAuditAction>[];
  }) {
    super();
    this._id = id;
    this._title = title;
    this._track = track;
    this._description = description;
    this._order = order;
    this._isActive = isActive;
    this._status = status;
    this._sectionId = sectionId;
    this._color = color;
    this._tags = tags;
    this._parentId = parentId;
    this._lastModifiedBy = lastModifiedBy;
    this._lastModifiedAt = lastModifiedAt;
    this._prerequisiteLevelIds = prerequisiteLevelIds;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get title(): string {
    return this._title;
  }

  public get track(): string {
    return this._track;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get order(): number {
    return this._order;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get status(): ContentStatusValue {
    return this._status;
  }

  public get sectionId(): string | undefined {
    return this._sectionId;
  }

  public get color(): string | undefined {
    return this._color;
  }

  public get tags(): ReadonlyArray<string> {
    return this._tags;
  }

  public get parentId(): string | undefined {
    return this._parentId;
  }

  public get lastModifiedBy(): string | undefined {
    return this._lastModifiedBy;
  }

  public get lastModifiedAt(): Date | undefined {
    return this._lastModifiedAt;
  }

  public get prerequisiteLevelIds(): ReadonlyArray<string> {
    return this._prerequisiteLevelIds;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<LevelAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    title,
    track,
    description,
    order,
    status,
    sectionId,
    performedBy,
  }: {
    title: string;
    track: string;
    description?: string;
    order: number;
    status?: ContentStatusValue;
    sectionId?: string;
    performedBy?: string;
  }): Level {
    const now: Date = new Date();
    const initialStatus: ContentStatusValue = status ?? PUBLISHED_CONTENT_STATUS;

    const level: Level = new Level({
      id: generateId(),
      title,
      track,
      description,
      order,
      isActive: isActiveForStatus(initialStatus),
      status: initialStatus,
      sectionId,
      color: undefined,
      tags: [],
      parentId: undefined,
      lastModifiedBy: performedBy,
      lastModifiedAt: performedBy ? now : undefined,
      prerequisiteLevelIds: [],
      createdAt: now,
      updatedAt: now,
      auditLogs: [AuditLog.create<LevelAuditAction>({ action: "level_created", performedByUserId: performedBy })],
    });

    level.publishEvent(new LevelCreatedEvent({ entity: level, performedBy }));

    return level;
  }

  public static createNode({
    title,
    track,
    description,
    color,
    tags,
    order,
    parentId,
    status,
    sectionId,
    performedBy,
  }: {
    title: string;
    track: string;
    description?: string;
    color?: string;
    tags: string[];
    order: number;
    parentId?: string;
    status?: ContentStatusValue;
    sectionId?: string;
    performedBy?: string;
  }): Level {
    const now: Date = new Date();
    const initialStatus: ContentStatusValue = status ?? PUBLISHED_CONTENT_STATUS;

    const level: Level = new Level({
      id: generateId(),
      title,
      track,
      description,
      order,
      isActive: isActiveForStatus(initialStatus),
      status: initialStatus,
      sectionId,
      color,
      tags,
      parentId,
      lastModifiedBy: performedBy,
      lastModifiedAt: now,
      prerequisiteLevelIds: [],
      createdAt: now,
      updatedAt: now,
      auditLogs: [
        AuditLog.create<LevelAuditAction>({ action: "level_created", performedByUserId: performedBy, metadata: { parentId: parentId ?? null } }),
      ],
    });

    level.publishEvent(new LevelNodeCreatedEvent({ entity: level, performedBy }));

    return level;
  }

  public static reconstitute({
    id,
    title,
    track,
    description,
    order,
    isActive,
    status,
    sectionId,
    color,
    tags,
    parentId,
    lastModifiedBy,
    lastModifiedAt,
    prerequisiteLevelIds,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    title: string;
    track: string;
    description?: string;
    order: number;
    isActive: boolean;
    status: ContentStatusValue;
    sectionId?: string;
    color?: string;
    tags: string[];
    parentId?: string;
    lastModifiedBy?: string;
    lastModifiedAt?: Date;
    prerequisiteLevelIds: string[];
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<LevelAuditAction>[];
  }): Level {
    return new Level({
      id,
      title,
      track,
      description,
      order,
      isActive,
      status,
      sectionId,
      color,
      tags,
      parentId,
      lastModifiedBy,
      lastModifiedAt,
      prerequisiteLevelIds,
      createdAt,
      updatedAt,
      auditLogs,
    });
  }

  public update({
    title,
    track,
    description,
    order,
    isActive,
    status,
    sectionId,
    performedBy,
  }: {
    title?: string;
    track?: string;
    description?: string;
    order?: number;
    isActive?: boolean;
    status?: ContentStatusValue;
    sectionId?: string;
    performedBy?: string;
  }): void {
    const changes: LevelChanges = {};

    this._title = this._applyChange(changes, "title", this._title, title);
    this._track = this._applyChange(changes, "track", this._track, track);
    this._description = this._applyChange(changes, "description", this._description, description);
    this._order = this._applyChange(changes, "order", this._order, order);
    this._sectionId = this._applyChange(changes, "sectionId", this._sectionId, sectionId);
    this._applyStatus(changes, status, isActive);

    this._touch(performedBy);

    this._auditLogs.push(AuditLog.create<LevelAuditAction>({ action: "level_updated", performedByUserId: performedBy, metadata: { changes } }));

    this.publishEvent(new LevelUpdatedEvent({ entity: this, changes, performedBy }));
  }

  public updateNode({
    title,
    description,
    color,
    tags,
    order,
    isActive,
    performedBy,
  }: {
    title?: string;
    description?: string;
    color?: string;
    tags?: string[];
    order?: number;
    isActive?: boolean;
    performedBy?: string;
  }): void {
    const changes: LevelChanges = {};

    this._title = this._applyChange(changes, "title", this._title, title);
    this._description = this._applyChange(changes, "description", this._description, description);
    this._color = this._applyChange(changes, "color", this._color, color);
    this._tags = this._applyChange(changes, "tags", this._tags, tags);
    this._order = this._applyChange(changes, "order", this._order, order);
    this._applyStatus(changes, undefined, isActive);

    this._touch(performedBy, true);

    this._auditLogs.push(AuditLog.create<LevelAuditAction>({ action: "level_updated", performedByUserId: performedBy, metadata: { changes } }));

    this.publishEvent(new LevelNodeUpdatedEvent({ entity: this, changes, performedBy }));
  }

  public deactivate(performedBy?: string): void {
    const wasActive: boolean = this._isActive;

    this._isActive = false;
    this._status = resolveContentStatus({ currentStatus: this._status, isActive: false }).status;
    this._touch(performedBy);

    this._auditLogs.push(
      AuditLog.create<LevelAuditAction>({
        action: "level_deactivated",
        performedByUserId: performedBy,
        metadata: { changes: { isActive: { before: wasActive, after: false } } },
      }),
    );

    this.publishEvent(new LevelDeactivatedEvent({ entity: this, performedBy }));
  }

  public hasPrerequisite(prerequisiteLevelId: string): boolean {
    return this._prerequisiteLevelIds.includes(prerequisiteLevelId);
  }

  public addPrerequisite({ id, title, performedBy }: { id: string; title: string; performedBy?: string }): void {
    this._prerequisiteLevelIds = [...this._prerequisiteLevelIds, id];
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<LevelAuditAction>({
        action: "level_prerequisite_added",
        performedByUserId: performedBy,
        metadata: { prerequisiteLevelId: id, prerequisiteTitle: title },
      }),
    );

    this.publishEvent(new LevelPrerequisiteAddedEvent({ entity: this, prerequisiteLevelId: id, prerequisiteTitle: title, performedBy }));
  }

  public removePrerequisite({ id, title, performedBy }: { id: string; title: string; performedBy?: string }): void {
    this._prerequisiteLevelIds = this._prerequisiteLevelIds.filter((prerequisiteId: string) => prerequisiteId !== id);
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<LevelAuditAction>({
        action: "level_prerequisite_removed",
        performedByUserId: performedBy,
        metadata: { prerequisiteLevelId: id, prerequisiteTitle: title },
      }),
    );

    this.publishEvent(new LevelPrerequisiteRemovedEvent({ entity: this, prerequisiteLevelId: id, prerequisiteTitle: title, performedBy }));
  }

  public replacePrerequisites(prerequisiteLevelIds: string[], performedBy?: string): void {
    const changes: LevelChanges = {};

    this._prerequisiteLevelIds = this._applyChange(changes, "prerequisiteLevelIds", this._prerequisiteLevelIds, [...new Set(prerequisiteLevelIds)]);
    this._touch(performedBy);

    this._auditLogs.push(
      AuditLog.create<LevelAuditAction>({ action: "level_prerequisites_replaced", performedByUserId: performedBy, metadata: { changes } }),
    );

    this.publishEvent(new LevelUpdatedEvent({ entity: this, changes, performedBy }));
  }

  private _applyStatus(changes: LevelChanges, status?: ContentStatusValue, isActive?: boolean): void {
    const next: ContentStatusState = resolveContentStatus({ currentStatus: this._status, status, isActive });

    this._status = this._applyChange(changes, "status", this._status, next.status);
    this._isActive = this._applyChange(changes, "isActive", this._isActive, next.isActive);
  }

  private _touch(performedBy?: string, alwaysStampModification: boolean = false): void {
    const now: Date = new Date();

    this._updatedAt = now;
    this._lastModifiedBy = performedBy;
    this._lastModifiedAt = performedBy || alwaysStampModification ? now : this._lastModifiedAt;
  }

  private _applyChange<T>(changes: LevelChanges, field: string, current: T, next: T | undefined): T {
    if (next === undefined || JSON.stringify(current) === JSON.stringify(next)) {
      return current;
    }

    changes[field] = { before: current ?? null, after: next };

    return next;
  }
}
