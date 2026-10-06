/*
 * Funcionalidad: Entidad Section
 * Descripción: Agregado de dominio de las secciones del currículo (raíz Sección, Nivel, Módulo, Lección, Página) con slug, título, orden y estado de publicación, sus eventos y registros de auditoría
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
import { type ContentStatusValue, DRAFT_CONTENT_STATUS } from "@/features/curriculum/domain/value-objects/content-status";
import { SectionCreatedEvent, SectionUpdatedEvent } from "@/features/sections/domain/events/section.events";

export const SECTION_ENTITY_COLLECTION: string = "sections";
export const SECTION_ENTITY_TYPE: string = "section";

export type SectionChanges = Record<string, { before: unknown; after: unknown }>;

export type SectionAuditAction = "section_created" | "section_updated" | "section_status_changed";

export class Section extends AggregateRoot {
  private _id: string;
  private _slug: string;
  private _title: string;
  private _description?: string;
  private _order: number;
  private _status: ContentStatusValue;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<SectionAuditAction>[];

  private constructor({
    id,
    slug,
    title,
    description,
    order,
    status,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    slug: string;
    title: string;
    description?: string;
    order: number;
    status: ContentStatusValue;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<SectionAuditAction>[];
  }) {
    super();
    this._id = id;
    this._slug = slug;
    this._title = title;
    this._description = description;
    this._order = order;
    this._status = status;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get slug(): string {
    return this._slug;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get order(): number {
    return this._order;
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

  public get auditLogs(): ReadonlyArray<AuditLog<SectionAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    slug,
    title,
    description,
    order,
    status,
    performedBy,
  }: {
    slug: string;
    title: string;
    description?: string;
    order: number;
    status?: ContentStatusValue;
    performedBy?: string;
  }): Section {
    const now: Date = new Date();

    const section: Section = new Section({
      id: generateId(),
      slug,
      title,
      description,
      order,
      status: status ?? DRAFT_CONTENT_STATUS,
      createdAt: now,
      updatedAt: now,
      auditLogs: [AuditLog.create<SectionAuditAction>({ action: "section_created", performedByUserId: performedBy })],
    });

    section.publishEvent(new SectionCreatedEvent({ entity: section, performedBy }));

    return section;
  }

  public static reconstitute({
    id,
    slug,
    title,
    description,
    order,
    status,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    slug: string;
    title: string;
    description?: string;
    order: number;
    status: ContentStatusValue;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<SectionAuditAction>[];
  }): Section {
    return new Section({ id, slug, title, description, order, status, createdAt, updatedAt, auditLogs });
  }

  public update({
    slug,
    title,
    description,
    status,
    performedBy,
  }: {
    slug?: string;
    title?: string;
    description?: string;
    status?: ContentStatusValue;
    performedBy?: string;
  }): void {
    const changes: SectionChanges = {};

    this._slug = this._applyChange(changes, "slug", this._slug, slug);
    this._title = this._applyChange(changes, "title", this._title, title);
    this._description = this._applyChange(changes, "description", this._description, description);
    this._status = this._applyChange(changes, "status", this._status, status);
    this._updatedAt = new Date();

    this._auditLogs.push(AuditLog.create<SectionAuditAction>({ action: "section_updated", performedByUserId: performedBy, metadata: { changes } }));

    this.publishEvent(new SectionUpdatedEvent({ entity: this, changes, performedBy }));
  }

  public changeStatus(status: ContentStatusValue, performedBy?: string): void {
    const changes: SectionChanges = {};

    this._status = this._applyChange(changes, "status", this._status, status);
    this._updatedAt = new Date();

    this._auditLogs.push(AuditLog.create<SectionAuditAction>({ action: "section_status_changed", performedByUserId: performedBy, metadata: { changes } }));

    this.publishEvent(new SectionUpdatedEvent({ entity: this, changes, performedBy }));
  }

  private _applyChange<T>(changes: SectionChanges, field: string, current: T, next: T | undefined): T {
    if (next === undefined || JSON.stringify(current) === JSON.stringify(next)) {
      return current;
    }

    changes[field] = { before: current ?? null, after: next };

    return next;
  }
}
