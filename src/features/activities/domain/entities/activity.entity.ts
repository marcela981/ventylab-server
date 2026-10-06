/*
 * Funcionalidad: Entidad Activity
 * Descripción: Agregado de actividad evaluativa (examen, quiz, taller) creada por un docente, con publicación, edición, desactivación lógica, eventos y auditoría
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
  ActivityCreatedEvent,
  ActivityDeactivatedEvent,
  ActivityPublishedEvent,
  ActivityUpdatedEvent,
} from "@/features/activities/domain/events/activity.events";
import { type ActivityTypeValue } from "@/features/activities/domain/value-objects/activity-type";

export const ACTIVITY_ENTITY_COLLECTION: string = "activities";
export const ACTIVITY_ENTITY_TYPE: string = "activity";

export const DEFAULT_ACTIVITY_MAX_SCORE: number = 100;

export type ActivityAuditAction = "activity_created" | "activity_updated" | "activity_deactivated" | "activity_published";

export interface ActivityChanges {
  title?: string;
  description?: string | null;
  instructions?: string | null;
  type?: ActivityTypeValue;
  maxScore?: number;
  timeLimit?: number | null;
  dueDate?: Date | null;
  isActive?: boolean;
}

export class Activity extends AggregateRoot {
  private _id: string;
  private _title: string;
  private _description?: string;
  private _instructions?: string;
  private _type: ActivityTypeValue;
  private _maxScore: number;
  private _timeLimit?: number;
  private _dueDate?: Date;
  private _isPublished: boolean;
  private _isActive: boolean;
  private _createdBy: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<ActivityAuditAction>[];

  private constructor({
    id,
    title,
    description,
    instructions,
    type,
    maxScore,
    timeLimit,
    dueDate,
    isPublished,
    isActive,
    createdBy,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    title: string;
    description?: string;
    instructions?: string;
    type: ActivityTypeValue;
    maxScore: number;
    timeLimit?: number;
    dueDate?: Date;
    isPublished: boolean;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ActivityAuditAction>[];
  }) {
    super();
    this._id = id;
    this._title = title;
    this._description = description;
    this._instructions = instructions;
    this._type = type;
    this._maxScore = maxScore;
    this._timeLimit = timeLimit;
    this._dueDate = dueDate;
    this._isPublished = isPublished;
    this._isActive = isActive;
    this._createdBy = createdBy;
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

  public get description(): string | undefined {
    return this._description;
  }

  public get instructions(): string | undefined {
    return this._instructions;
  }

  public get type(): ActivityTypeValue {
    return this._type;
  }

  public get maxScore(): number {
    return this._maxScore;
  }

  public get timeLimit(): number | undefined {
    return this._timeLimit;
  }

  public get dueDate(): Date | undefined {
    return this._dueDate;
  }

  public get isPublished(): boolean {
    return this._isPublished;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get createdBy(): string {
    return this._createdBy;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<ActivityAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    title,
    description,
    instructions,
    type,
    maxScore,
    timeLimit,
    dueDate,
    createdBy,
  }: {
    title: string;
    description?: string;
    instructions?: string;
    type: ActivityTypeValue;
    maxScore?: number;
    timeLimit?: number;
    dueDate?: Date;
    createdBy: string;
  }): Activity {
    const now: Date = new Date();

    const activity: Activity = new Activity({
      id: generateId(),
      title,
      description,
      instructions,
      type,
      maxScore: maxScore ?? DEFAULT_ACTIVITY_MAX_SCORE,
      timeLimit,
      dueDate,
      isPublished: false,
      isActive: true,
      createdBy,
      createdAt: now,
      updatedAt: now,
      auditLogs: [
        AuditLog.create<ActivityAuditAction>({
          action: "activity_created",
          performedByUserId: createdBy,
          metadata: { title, type },
        }),
      ],
    });

    activity.publishEvent(new ActivityCreatedEvent({ entity: activity, performedBy: createdBy }));

    return activity;
  }

  public static reconstitute({
    id,
    title,
    description,
    instructions,
    type,
    maxScore,
    timeLimit,
    dueDate,
    isPublished,
    isActive,
    createdBy,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    title: string;
    description?: string;
    instructions?: string;
    type: ActivityTypeValue;
    maxScore: number;
    timeLimit?: number;
    dueDate?: Date;
    isPublished: boolean;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<ActivityAuditAction>[];
  }): Activity {
    return new Activity({
      id,
      title,
      description,
      instructions,
      type,
      maxScore,
      timeLimit,
      dueDate,
      isPublished,
      isActive,
      createdBy,
      createdAt,
      updatedAt,
      auditLogs,
    });
  }

  public isOwnedBy(userId: string): boolean {
    return this._createdBy === userId;
  }

  public update(changes: ActivityChanges, performedBy: string): void {
    const recorded: Record<string, { before: unknown; after: unknown }> = {};

    if (changes.title !== undefined) {
      recorded.title = { before: this._title, after: changes.title };
      this._title = changes.title;
    }

    if (changes.description !== undefined) {
      recorded.description = { before: this._description ?? null, after: changes.description };
      this._description = changes.description ?? undefined;
    }

    if (changes.instructions !== undefined) {
      recorded.instructions = { before: this._instructions ?? null, after: changes.instructions };
      this._instructions = changes.instructions ?? undefined;
    }

    if (changes.type !== undefined) {
      recorded.type = { before: this._type, after: changes.type };
      this._type = changes.type;
    }

    if (changes.maxScore !== undefined) {
      recorded.maxScore = { before: this._maxScore, after: changes.maxScore };
      this._maxScore = changes.maxScore;
    }

    if (changes.timeLimit !== undefined) {
      recorded.timeLimit = { before: this._timeLimit ?? null, after: changes.timeLimit };
      this._timeLimit = changes.timeLimit ?? undefined;
    }

    if (changes.dueDate !== undefined) {
      recorded.dueDate = { before: this._dueDate ?? null, after: changes.dueDate };
      this._dueDate = changes.dueDate ?? undefined;
    }

    if (changes.isActive !== undefined) {
      recorded.isActive = { before: this._isActive, after: changes.isActive };
      this._isActive = changes.isActive;
    }

    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<ActivityAuditAction>({
        action: "activity_updated",
        performedByUserId: performedBy,
        metadata: { changes: recorded },
      }),
    );

    this.publishEvent(new ActivityUpdatedEvent({ entity: this, performedBy }));
  }

  public deactivate(performedBy: string): void {
    const wasActive: boolean = this._isActive;

    this._isActive = false;
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<ActivityAuditAction>({
        action: "activity_deactivated",
        performedByUserId: performedBy,
        metadata: { changes: { isActive: { before: wasActive, after: false } } },
      }),
    );

    this.publishEvent(new ActivityDeactivatedEvent({ entity: this, performedBy }));
  }

  public publish(performedBy: string): void {
    if (this._isPublished) {
      return;
    }

    this._isPublished = true;
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<ActivityAuditAction>({
        action: "activity_published",
        performedByUserId: performedBy,
        metadata: { changes: { isPublished: { before: false, after: true } } },
      }),
    );

    this.publishEvent(new ActivityPublishedEvent({ entity: this, performedBy }));
  }
}
