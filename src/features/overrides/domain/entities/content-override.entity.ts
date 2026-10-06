/*
 * Funcionalidad: Entidad CONTENT_OVERRIDE_ENTITY_COLLECTION
 * Descripción: Agregado de dominio de la feature de personalizaciones de contenido por estudiante con sus reglas de negocio, eventos de dominio y registros de auditoría
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
  ContentOverrideCreatedEvent,
  ContentOverrideDeactivatedEvent,
  ContentOverrideUpdatedEvent,
} from "@/features/overrides/domain/events/content-override.events";
import { InvalidOverrideDataError } from "@/features/overrides/domain/overrides.errors";
import { type ExtraCard, type OverrideData } from "@/features/overrides/domain/value-objects/override-data";
import { LESSON_OVERRIDE_ENTITY_TYPE, type OverrideEntityTypeValue } from "@/features/overrides/domain/value-objects/override-entity-type";

export const CONTENT_OVERRIDE_ENTITY_COLLECTION: string = "content_overrides";
export const CONTENT_OVERRIDE_ENTITY_TYPE: string = "content_override";

export type ContentOverrideChanges = Record<string, { before: unknown; after: unknown }>;

export type ContentOverrideAuditAction = "content_override_created" | "content_override_updated" | "content_override_deactivated";

export class ContentOverride extends AggregateRoot {
  private _id: string;
  private _studentId: string;
  private _entityType: OverrideEntityTypeValue;
  private _entityId: string;
  private _overrideData: OverrideData;
  private _createdBy: string;
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<ContentOverrideAuditAction>[];

  private constructor({
    id,
    studentId,
    entityType,
    entityId,
    overrideData,
    createdBy,
    isActive,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    studentId: string;
    entityType: OverrideEntityTypeValue;
    entityId: string;
    overrideData: OverrideData;
    createdBy: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ContentOverrideAuditAction>[];
  }) {
    super();
    this._id = id;
    this._studentId = studentId;
    this._entityType = entityType;
    this._entityId = entityId;
    this._overrideData = overrideData;
    this._createdBy = createdBy;
    this._isActive = isActive;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get studentId(): string {
    return this._studentId;
  }

  public get entityType(): OverrideEntityTypeValue {
    return this._entityType;
  }

  public get entityId(): string {
    return this._entityId;
  }

  public get overrideData(): OverrideData {
    return this._overrideData;
  }

  public get createdBy(): string {
    return this._createdBy;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<ContentOverrideAuditAction>> {
    return this._auditLogs;
  }

  public static assertValidData(entityType: OverrideEntityTypeValue, data: OverrideData): void {
    if (entityType !== LESSON_OVERRIDE_ENTITY_TYPE) {
      if (data.extraCards && data.extraCards.length > 0) {
        throw new InvalidOverrideDataError("extraCards is only valid for LESSON overrides");
      }

      if (data.hiddenCardIds && data.hiddenCardIds.length > 0) {
        throw new InvalidOverrideDataError("hiddenCardIds is only valid for LESSON overrides");
      }
    }

    for (const card of data.extraCards ?? []) {
      if (!ContentOverride._isValidExtraCard(card)) {
        throw new InvalidOverrideDataError("each extra card needs id, content, contentType and a numeric insertAfterOrder");
      }
    }
  }

  public static create({
    studentId,
    entityType,
    entityId,
    overrideData,
    createdBy,
  }: {
    studentId: string;
    entityType: OverrideEntityTypeValue;
    entityId: string;
    overrideData: OverrideData;
    createdBy: string;
  }): ContentOverride {
    ContentOverride.assertValidData(entityType, overrideData);

    const now: Date = new Date();

    const override: ContentOverride = new ContentOverride({
      id: generateId(),
      studentId,
      entityType,
      entityId,
      overrideData,
      createdBy,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      auditLogs: [
        AuditLog.create<ContentOverrideAuditAction>({
          action: "content_override_created",
          performedByUserId: createdBy,
          metadata: { studentId, entityType, entityId },
        }),
      ],
    });

    override.publishEvent(new ContentOverrideCreatedEvent({ entity: override, performedBy: createdBy }));

    return override;
  }

  public static reconstitute({
    id,
    studentId,
    entityType,
    entityId,
    overrideData,
    createdBy,
    isActive,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    studentId: string;
    entityType: OverrideEntityTypeValue;
    entityId: string;
    overrideData: OverrideData;
    createdBy: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ContentOverrideAuditAction>[];
  }): ContentOverride {
    return new ContentOverride({ id, studentId, entityType, entityId, overrideData, createdBy, isActive, createdAt, updatedAt, auditLogs });
  }

  public update({ overrideData, isActive, performedBy }: { overrideData?: OverrideData; isActive?: boolean; performedBy?: string }): void {
    if (overrideData) {
      ContentOverride.assertValidData(this._entityType, overrideData);
    }

    const changes: ContentOverrideChanges = {};

    this._overrideData = this._applyChange(changes, "overrideData", this._overrideData, overrideData);
    this._isActive = this._applyChange(changes, "isActive", this._isActive, isActive);
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<ContentOverrideAuditAction>({ action: "content_override_updated", performedByUserId: performedBy, metadata: { changes } }),
    );

    this.publishEvent(new ContentOverrideUpdatedEvent({ entity: this, changes, performedBy }));
  }

  public deactivate(performedBy?: string): void {
    const wasActive: boolean = this._isActive;

    this._isActive = false;
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<ContentOverrideAuditAction>({
        action: "content_override_deactivated",
        performedByUserId: performedBy,
        metadata: { changes: { isActive: { before: wasActive, after: false } } },
      }),
    );

    this.publishEvent(new ContentOverrideDeactivatedEvent({ entity: this, performedBy }));
  }

  private static _isValidExtraCard(card: ExtraCard): boolean {
    return Boolean(card.id) && Boolean(card.content) && Boolean(card.contentType) && typeof card.insertAfterOrder === "number";
  }

  private _applyChange<T>(changes: ContentOverrideChanges, field: string, current: T, next: T | undefined): T {
    if (next === undefined || JSON.stringify(current) === JSON.stringify(next)) {
      return current;
    }

    changes[field] = { before: current ?? null, after: next };

    return next;
  }
}
