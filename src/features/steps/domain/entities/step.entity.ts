/*
 * Funcionalidad: Entidad STEP_ENTITY_COLLECTION
 * Descripción: Agregado de dominio de la feature de pasos (tarjetas) con sus reglas de negocio, eventos de dominio y registros de auditoría
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
import { StepCreatedEvent, StepDeactivatedEvent, StepOrderChangedEvent, StepUpdatedEvent } from "@/features/steps/domain/events/step.events";

export const STEP_ENTITY_COLLECTION: string = "steps";
export const STEP_ENTITY_TYPE: string = "step";

export type StepChanges = Record<string, { before: unknown; after: unknown }>;

export type StepAuditAction = "step_created" | "step_updated" | "step_deactivated" | "step_order_changed";

export class Step extends AggregateRoot {
  private _id: string;
  private _lessonId: string;
  private _title?: string;
  private _content: string;
  private _contentType: string;
  private _order: number;
  private _isActive: boolean;
  private _lastModifiedBy?: string;
  private _lastModifiedAt?: Date;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<StepAuditAction>[];

  private constructor({
    id,
    lessonId,
    title,
    content,
    contentType,
    order,
    isActive,
    lastModifiedBy,
    lastModifiedAt,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    lessonId: string;
    title?: string;
    content: string;
    contentType: string;
    order: number;
    isActive: boolean;
    lastModifiedBy?: string;
    lastModifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<StepAuditAction>[];
  }) {
    super();
    this._id = id;
    this._lessonId = lessonId;
    this._title = title;
    this._content = content;
    this._contentType = contentType;
    this._order = order;
    this._isActive = isActive;
    this._lastModifiedBy = lastModifiedBy;
    this._lastModifiedAt = lastModifiedAt;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get lessonId(): string {
    return this._lessonId;
  }

  public get title(): string | undefined {
    return this._title;
  }

  public get content(): string {
    return this._content;
  }

  public get contentType(): string {
    return this._contentType;
  }

  public get order(): number {
    return this._order;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get lastModifiedBy(): string | undefined {
    return this._lastModifiedBy;
  }

  public get lastModifiedAt(): Date | undefined {
    return this._lastModifiedAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<StepAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    lessonId,
    title,
    content,
    contentType,
    order,
    performedBy,
  }: {
    lessonId: string;
    title?: string;
    content: string;
    contentType: string;
    order: number;
    performedBy?: string;
  }): Step {
    const now: Date = new Date();

    const step: Step = new Step({
      id: generateId(),
      lessonId,
      title,
      content,
      contentType,
      order,
      isActive: true,
      lastModifiedBy: performedBy,
      lastModifiedAt: performedBy ? now : undefined,
      createdAt: now,
      updatedAt: now,
      auditLogs: [AuditLog.create<StepAuditAction>({ action: "step_created", performedByUserId: performedBy })],
    });

    step.publishEvent(new StepCreatedEvent({ entity: step, performedBy }));

    return step;
  }

  public static reconstitute({
    id,
    lessonId,
    title,
    content,
    contentType,
    order,
    isActive,
    lastModifiedBy,
    lastModifiedAt,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    lessonId: string;
    title?: string;
    content: string;
    contentType: string;
    order: number;
    isActive: boolean;
    lastModifiedBy?: string;
    lastModifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<StepAuditAction>[];
  }): Step {
    return new Step({ id, lessonId, title, content, contentType, order, isActive, lastModifiedBy, lastModifiedAt, createdAt, updatedAt, auditLogs });
  }

  public update({
    title,
    content,
    contentType,
    order,
    isActive,
    performedBy,
  }: {
    title?: string;
    content?: string;
    contentType?: string;
    order?: number;
    isActive?: boolean;
    performedBy?: string;
  }): void {
    const changes: StepChanges = {};

    this._title = this._applyChange(changes, "title", this._title, title);
    this._content = this._applyChange(changes, "content", this._content, content);
    this._contentType = this._applyChange(changes, "contentType", this._contentType, contentType);
    this._order = this._applyChange(changes, "order", this._order, order);
    this._isActive = this._applyChange(changes, "isActive", this._isActive, isActive);

    this._touch(performedBy);

    this._auditLogs.push(AuditLog.create<StepAuditAction>({ action: "step_updated", performedByUserId: performedBy, metadata: { changes } }));

    this.publishEvent(new StepUpdatedEvent({ entity: this, changes, performedBy }));
  }

  public deactivate(performedBy?: string): void {
    const wasActive: boolean = this._isActive;

    this._isActive = false;
    this._touch(performedBy);

    this._auditLogs.push(
      AuditLog.create<StepAuditAction>({
        action: "step_deactivated",
        performedByUserId: performedBy,
        metadata: { changes: { isActive: { before: wasActive, after: false } } },
      }),
    );

    this.publishEvent(new StepDeactivatedEvent({ entity: this, performedBy }));
  }

  public changeOrder(order: number, performedBy?: string): void {
    const previousOrder: number = this._order;

    this._order = order;
    this._touch(performedBy);

    this._auditLogs.push(
      AuditLog.create<StepAuditAction>({
        action: "step_order_changed",
        performedByUserId: performedBy,
        metadata: { changes: { order: { before: previousOrder, after: order } } },
      }),
    );

    this.publishEvent(new StepOrderChangedEvent({ entity: this, previousOrder, newOrder: order, performedBy }));
  }

  private _touch(performedBy?: string): void {
    const now: Date = new Date();

    this._updatedAt = now;
    this._lastModifiedBy = performedBy;
    this._lastModifiedAt = performedBy ? now : this._lastModifiedAt;
  }

  private _applyChange<T>(changes: StepChanges, field: string, current: T, next: T | undefined): T {
    if (next === undefined || JSON.stringify(current) === JSON.stringify(next)) {
      return current;
    }

    changes[field] = { before: current ?? null, after: next };

    return next;
  }
}
