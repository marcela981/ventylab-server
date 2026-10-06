/*
 * Funcionalidad: Entidad MODULE_ENTITY_COLLECTION
 * Descripción: Agregado de dominio de la feature de módulos con sus reglas de negocio, eventos de dominio y registros de auditoría
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
  ModuleCreatedEvent,
  ModuleDeactivatedEvent,
  ModuleNodeCreatedEvent,
  ModuleNodeUpdatedEvent,
  ModulePrerequisiteAddedEvent,
  ModulePrerequisiteRemovedEvent,
  ModuleUpdatedEvent,
} from "@/features/modules/domain/events/module.events";

export const MODULE_ENTITY_COLLECTION: string = "modules";
export const MODULE_ENTITY_TYPE: string = "module";

export const DEFAULT_MODULE_DIFFICULTY: string = "beginner";
export const DEFAULT_MODULE_ESTIMATED_TIME: number = 0;

export type ModuleChanges = Record<string, { before: unknown; after: unknown }>;

export type ModuleAuditAction =
  | "module_created"
  | "module_updated"
  | "module_deactivated"
  | "module_prerequisite_added"
  | "module_prerequisite_removed"
  | "module_prerequisites_replaced";

export interface ModuleContentFields {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  estimatedTime?: number;
  thumbnail?: string;
  order?: number;
  isActive?: boolean;
  status?: ContentStatusValue;
}

export class Module extends AggregateRoot {
  private _id: string;
  private _levelId?: string;
  private _title: string;
  private _description?: string;
  private _category?: string;
  private _difficulty?: string;
  private _estimatedTime?: number;
  private _thumbnail?: string;
  private _order: number;
  private _isActive: boolean;
  private _status: ContentStatusValue;
  private _color?: string;
  private _tags: string[];
  private _lastModifiedBy?: string;
  private _lastModifiedAt?: Date;
  private _prerequisiteIds: string[];
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<ModuleAuditAction>[];

  private constructor({
    id,
    levelId,
    title,
    description,
    category,
    difficulty,
    estimatedTime,
    thumbnail,
    order,
    isActive,
    status,
    color,
    tags,
    lastModifiedBy,
    lastModifiedAt,
    prerequisiteIds,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    levelId?: string;
    title: string;
    description?: string;
    category?: string;
    difficulty?: string;
    estimatedTime?: number;
    thumbnail?: string;
    order: number;
    isActive: boolean;
    status: ContentStatusValue;
    color?: string;
    tags: string[];
    lastModifiedBy?: string;
    lastModifiedAt?: Date;
    prerequisiteIds: string[];
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ModuleAuditAction>[];
  }) {
    super();
    this._id = id;
    this._levelId = levelId;
    this._title = title;
    this._description = description;
    this._category = category;
    this._difficulty = difficulty;
    this._estimatedTime = estimatedTime;
    this._thumbnail = thumbnail;
    this._order = order;
    this._isActive = isActive;
    this._status = status;
    this._color = color;
    this._tags = tags;
    this._lastModifiedBy = lastModifiedBy;
    this._lastModifiedAt = lastModifiedAt;
    this._prerequisiteIds = prerequisiteIds;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get levelId(): string | undefined {
    return this._levelId;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get category(): string | undefined {
    return this._category;
  }

  public get difficulty(): string | undefined {
    return this._difficulty;
  }

  public get estimatedTime(): number | undefined {
    return this._estimatedTime;
  }

  public get thumbnail(): string | undefined {
    return this._thumbnail;
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

  public get color(): string | undefined {
    return this._color;
  }

  public get tags(): ReadonlyArray<string> {
    return this._tags;
  }

  public get lastModifiedBy(): string | undefined {
    return this._lastModifiedBy;
  }

  public get lastModifiedAt(): Date | undefined {
    return this._lastModifiedAt;
  }

  public get prerequisiteIds(): ReadonlyArray<string> {
    return this._prerequisiteIds;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<ModuleAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    levelId,
    title,
    description,
    category,
    difficulty,
    estimatedTime,
    thumbnail,
    order,
    prerequisiteIds,
    status,
    performedBy,
  }: {
    levelId?: string;
    title: string;
    description?: string;
    category?: string;
    difficulty?: string;
    estimatedTime?: number;
    thumbnail?: string;
    order?: number;
    prerequisiteIds: string[];
    status?: ContentStatusValue;
    performedBy?: string;
  }): Module {
    const now: Date = new Date();
    const initialStatus: ContentStatusValue = status ?? PUBLISHED_CONTENT_STATUS;

    const module: Module = new Module({
      id: generateId(),
      levelId,
      title,
      description,
      category,
      difficulty: difficulty ?? DEFAULT_MODULE_DIFFICULTY,
      estimatedTime: estimatedTime ?? DEFAULT_MODULE_ESTIMATED_TIME,
      thumbnail,
      order: order ?? 0,
      isActive: isActiveForStatus(initialStatus),
      status: initialStatus,
      color: undefined,
      tags: [],
      lastModifiedBy: performedBy,
      lastModifiedAt: performedBy ? now : undefined,
      prerequisiteIds: [...new Set(prerequisiteIds)],
      createdAt: now,
      updatedAt: now,
      auditLogs: [AuditLog.create<ModuleAuditAction>({ action: "module_created", performedByUserId: performedBy, metadata: { prerequisiteIds } })],
    });

    module.publishEvent(new ModuleCreatedEvent({ entity: module, performedBy }));

    return module;
  }

  public static createNode({
    levelId,
    title,
    description,
    color,
    tags,
    order,
    performedBy,
  }: {
    levelId: string;
    title: string;
    description?: string;
    color?: string;
    tags: string[];
    order: number;
    performedBy?: string;
  }): Module {
    const now: Date = new Date();

    const module: Module = new Module({
      id: generateId(),
      levelId,
      title,
      description,
      category: undefined,
      difficulty: DEFAULT_MODULE_DIFFICULTY,
      estimatedTime: DEFAULT_MODULE_ESTIMATED_TIME,
      thumbnail: undefined,
      order,
      isActive: true,
      status: PUBLISHED_CONTENT_STATUS,
      color,
      tags,
      lastModifiedBy: performedBy,
      lastModifiedAt: now,
      prerequisiteIds: [],
      createdAt: now,
      updatedAt: now,
      auditLogs: [AuditLog.create<ModuleAuditAction>({ action: "module_created", performedByUserId: performedBy, metadata: { levelId } })],
    });

    module.publishEvent(new ModuleNodeCreatedEvent({ entity: module, performedBy }));

    return module;
  }

  public static reconstitute({
    id,
    levelId,
    title,
    description,
    category,
    difficulty,
    estimatedTime,
    thumbnail,
    order,
    isActive,
    status,
    color,
    tags,
    lastModifiedBy,
    lastModifiedAt,
    prerequisiteIds,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    levelId?: string;
    title: string;
    description?: string;
    category?: string;
    difficulty?: string;
    estimatedTime?: number;
    thumbnail?: string;
    order: number;
    isActive: boolean;
    status: ContentStatusValue;
    color?: string;
    tags: string[];
    lastModifiedBy?: string;
    lastModifiedAt?: Date;
    prerequisiteIds: string[];
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ModuleAuditAction>[];
  }): Module {
    return new Module({
      id,
      levelId,
      title,
      description,
      category,
      difficulty,
      estimatedTime,
      thumbnail,
      order,
      isActive,
      status,
      color,
      tags,
      lastModifiedBy,
      lastModifiedAt,
      prerequisiteIds,
      createdAt,
      updatedAt,
      auditLogs,
    });
  }

  public update({ fields, performedBy }: { fields: ModuleContentFields; performedBy?: string }): void {
    const changes: ModuleChanges = this._applyContentFields(fields);

    this._touch(performedBy, false);

    this._auditLogs.push(AuditLog.create<ModuleAuditAction>({ action: "module_updated", performedByUserId: performedBy, metadata: { changes } }));

    this.publishEvent(new ModuleUpdatedEvent({ entity: this, changes, performedBy }));
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
    const changes: ModuleChanges = this._applyContentFields({ title, description, order, isActive });

    this._color = this._applyChange(changes, "color", this._color, color);
    this._tags = this._applyChange(changes, "tags", this._tags, tags);

    this._touch(performedBy, true);

    this._auditLogs.push(AuditLog.create<ModuleAuditAction>({ action: "module_updated", performedByUserId: performedBy, metadata: { changes } }));

    this.publishEvent(new ModuleNodeUpdatedEvent({ entity: this, changes, performedBy }));
  }

  public deactivate(performedBy?: string): void {
    const wasActive: boolean = this._isActive;

    this._isActive = false;
    this._status = resolveContentStatus({ currentStatus: this._status, isActive: false }).status;
    this._touch(performedBy, false);

    this._auditLogs.push(
      AuditLog.create<ModuleAuditAction>({
        action: "module_deactivated",
        performedByUserId: performedBy,
        metadata: { changes: { isActive: { before: wasActive, after: false } } },
      }),
    );

    this.publishEvent(new ModuleDeactivatedEvent({ entity: this, performedBy }));
  }

  public hasPrerequisite(prerequisiteId: string): boolean {
    return this._prerequisiteIds.includes(prerequisiteId);
  }

  public addPrerequisite(prerequisiteId: string, performedBy?: string): void {
    this._prerequisiteIds = [...this._prerequisiteIds, prerequisiteId];
    this._updatedAt = new Date();

    this._auditLogs.push(AuditLog.create<ModuleAuditAction>({ action: "module_prerequisite_added", performedByUserId: performedBy, metadata: { prerequisiteId } }));

    this.publishEvent(new ModulePrerequisiteAddedEvent({ entity: this, prerequisiteId, performedBy }));
  }

  public removePrerequisite(prerequisiteId: string, performedBy?: string): void {
    this._prerequisiteIds = this._prerequisiteIds.filter((id: string) => id !== prerequisiteId);
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<ModuleAuditAction>({ action: "module_prerequisite_removed", performedByUserId: performedBy, metadata: { prerequisiteId } }),
    );

    this.publishEvent(new ModulePrerequisiteRemovedEvent({ entity: this, prerequisiteId, performedBy }));
  }

  public replacePrerequisites(prerequisiteIds: string[], performedBy?: string): void {
    const changes: ModuleChanges = {};

    this._prerequisiteIds = this._applyChange(changes, "prerequisiteIds", this._prerequisiteIds, [...new Set(prerequisiteIds)]);
    this._touch(performedBy, false);

    this._auditLogs.push(
      AuditLog.create<ModuleAuditAction>({ action: "module_prerequisites_replaced", performedByUserId: performedBy, metadata: { changes } }),
    );

    this.publishEvent(new ModuleUpdatedEvent({ entity: this, changes, performedBy }));
  }

  private _applyContentFields(fields: ModuleContentFields): ModuleChanges {
    const changes: ModuleChanges = {};

    this._title = this._applyChange(changes, "title", this._title, fields.title);
    this._description = this._applyChange(changes, "description", this._description, fields.description);
    this._category = this._applyChange(changes, "category", this._category, fields.category);
    this._difficulty = this._applyChange(changes, "difficulty", this._difficulty, fields.difficulty);
    this._estimatedTime = this._applyChange(changes, "estimatedTime", this._estimatedTime, fields.estimatedTime);
    this._thumbnail = this._applyChange(changes, "thumbnail", this._thumbnail, fields.thumbnail);
    this._order = this._applyChange(changes, "order", this._order, fields.order);

    const next: ContentStatusState = resolveContentStatus({ currentStatus: this._status, status: fields.status, isActive: fields.isActive });

    this._status = this._applyChange(changes, "status", this._status, next.status);
    this._isActive = this._applyChange(changes, "isActive", this._isActive, next.isActive);

    return changes;
  }

  private _touch(performedBy: string | undefined, alwaysStampModification: boolean): void {
    const now: Date = new Date();

    this._updatedAt = now;
    this._lastModifiedBy = performedBy;
    this._lastModifiedAt = performedBy || alwaysStampModification ? now : this._lastModifiedAt;
  }

  private _applyChange<T>(changes: ModuleChanges, field: string, current: T, next: T | undefined): T {
    if (next === undefined || JSON.stringify(current) === JSON.stringify(next)) {
      return current;
    }

    changes[field] = { before: current ?? null, after: next };

    return next;
  }
}
