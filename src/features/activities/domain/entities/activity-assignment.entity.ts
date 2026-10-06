/*
 * Funcionalidad: Entidad ActivityAssignment
 * Descripción: Agregado de la asignación de una actividad a un grupo con ventana de visibilidad y fecha límite propias, reasignación (upsert por actividad y grupo) y retiro lógico
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
  ActivityAssignedEvent,
  ActivityAssignmentRemovedEvent,
  ActivityAssignmentUpdatedEvent,
} from "@/features/activities/domain/events/activity-assignment.events";

export const ACTIVITY_ASSIGNMENT_ENTITY_COLLECTION: string = "activity_assignments";
export const ACTIVITY_ASSIGNMENT_ENTITY_TYPE: string = "activity_assignment";

export type ActivityAssignmentAuditAction = "activity_assigned" | "activity_assignment_updated" | "activity_assignment_removed";

export interface ActivityAssignmentWindow {
  visibleFrom?: Date | null;
  dueDate?: Date | null;
  isActive?: boolean;
}

export class ActivityAssignment extends AggregateRoot {
  private _id: string;
  private _activityId: string;
  private _groupId: string;
  private _assignedBy: string;
  private _visibleFrom?: Date;
  private _dueDate?: Date;
  private _isActive: boolean;
  private _createdAt: Date;
  private _auditLogs: AuditLog<ActivityAssignmentAuditAction>[];

  private constructor({
    id,
    activityId,
    groupId,
    assignedBy,
    visibleFrom,
    dueDate,
    isActive,
    createdAt,
    auditLogs,
  }: {
    id: string;
    activityId: string;
    groupId: string;
    assignedBy: string;
    visibleFrom?: Date;
    dueDate?: Date;
    isActive: boolean;
    createdAt: Date;
    auditLogs: AuditLog<ActivityAssignmentAuditAction>[];
  }) {
    super();
    this._id = id;
    this._activityId = activityId;
    this._groupId = groupId;
    this._assignedBy = assignedBy;
    this._visibleFrom = visibleFrom;
    this._dueDate = dueDate;
    this._isActive = isActive;
    this._createdAt = createdAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get activityId(): string {
    return this._activityId;
  }

  public get groupId(): string {
    return this._groupId;
  }

  public get assignedBy(): string {
    return this._assignedBy;
  }

  public get visibleFrom(): Date | undefined {
    return this._visibleFrom;
  }

  public get dueDate(): Date | undefined {
    return this._dueDate;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<ActivityAssignmentAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    activityId,
    groupId,
    assignedBy,
    visibleFrom,
    dueDate,
    isActive,
  }: {
    activityId: string;
    groupId: string;
    assignedBy: string;
    visibleFrom?: Date;
    dueDate?: Date;
    isActive?: boolean;
  }): ActivityAssignment {
    const assignment: ActivityAssignment = new ActivityAssignment({
      id: generateId(),
      activityId,
      groupId,
      assignedBy,
      visibleFrom,
      dueDate,
      isActive: isActive ?? true,
      createdAt: new Date(),
      auditLogs: [
        AuditLog.create<ActivityAssignmentAuditAction>({
          action: "activity_assigned",
          performedByUserId: assignedBy,
          metadata: { activityId, groupId },
        }),
      ],
    });

    assignment.publishEvent(new ActivityAssignedEvent({ entity: assignment, performedBy: assignedBy }));

    return assignment;
  }

  public static reconstitute({
    id,
    activityId,
    groupId,
    assignedBy,
    visibleFrom,
    dueDate,
    isActive,
    createdAt,
    auditLogs,
  }: {
    id: string;
    activityId: string;
    groupId: string;
    assignedBy: string;
    visibleFrom?: Date;
    dueDate?: Date;
    isActive: boolean;
    createdAt: Date;
    auditLogs: AuditLog<ActivityAssignmentAuditAction>[];
  }): ActivityAssignment {
    return new ActivityAssignment({ id, activityId, groupId, assignedBy, visibleFrom, dueDate, isActive, createdAt, auditLogs });
  }

  public isAssignedBy(userId: string): boolean {
    return this._assignedBy === userId;
  }

  public reassign(window: ActivityAssignmentWindow, assignedBy: string): void {
    const recorded: Record<string, { before: unknown; after: unknown }> = {};

    if (window.visibleFrom !== undefined) {
      recorded.visibleFrom = { before: this._visibleFrom ?? null, after: window.visibleFrom };
      this._visibleFrom = window.visibleFrom ?? undefined;
    }

    if (window.dueDate !== undefined) {
      recorded.dueDate = { before: this._dueDate ?? null, after: window.dueDate };
      this._dueDate = window.dueDate ?? undefined;
    }

    if (window.isActive !== undefined) {
      recorded.isActive = { before: this._isActive, after: window.isActive };
      this._isActive = window.isActive;
    }

    recorded.assignedBy = { before: this._assignedBy, after: assignedBy };
    this._assignedBy = assignedBy;

    this._auditLogs.push(
      AuditLog.create<ActivityAssignmentAuditAction>({
        action: "activity_assignment_updated",
        performedByUserId: assignedBy,
        metadata: { changes: recorded },
      }),
    );

    this.publishEvent(new ActivityAssignmentUpdatedEvent({ entity: this, performedBy: assignedBy }));
  }

  public remove(performedBy: string): void {
    const wasActive: boolean = this._isActive;

    this._isActive = false;

    this._auditLogs.push(
      AuditLog.create<ActivityAssignmentAuditAction>({
        action: "activity_assignment_removed",
        performedByUserId: performedBy,
        metadata: { changes: { isActive: { before: wasActive, after: false } } },
      }),
    );

    this.publishEvent(new ActivityAssignmentRemovedEvent({ entity: this, performedBy }));
  }
}
