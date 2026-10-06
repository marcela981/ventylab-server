/*
 * Funcionalidad: Entidad Group
 * Descripción: Agregado de grupo o subgrupo (profundidad 0 a 2) de tipo STUDENT o TEACHER con código de inscripción, cupo de estudiantes, periodo académico y líder del simulador; registra auditoría y eventos en cada cambio, incluida la desactivación y los vínculos de supervisión
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
  GroupCreatedEvent,
  GroupDeletedEvent,
  GroupSimulatorLeadChangedEvent,
  GroupUpdatedEvent,
} from "@/features/groups/domain/events/group.events";
import { STUDENT_GROUP_TYPE, TEACHER_GROUP_TYPE, type GroupTypeValue } from "@/features/groups/domain/value-objects/group-type";

export const GROUP_ENTITY_COLLECTION: string = "groups";
export const GROUP_ENTITY_TYPE: string = "group";

export type GroupAuditAction =
  | "group_created"
  | "group_updated"
  | "group_simulator_lead_changed"
  | "group_deleted"
  | "group_supervision_added"
  | "group_supervision_removed";

export interface GroupChanges {
  name?: string;
  description?: string | null;
  semester?: string | null;
  academicYear?: string | null;
  maxStudents?: number | null;
  isActive?: boolean;
}

export class Group extends AggregateRoot {
  private _id: string;
  private _name: string;
  private _description?: string;
  private _type: GroupTypeValue;
  private _parentGroupId?: string;
  private _depth: number;
  private _simulatorLeaderId?: string;
  private _isActive: boolean;
  private _maxStudents?: number;
  private _enrollmentCode?: string;
  private _semester?: string;
  private _academicYear?: string;
  private _createdBy?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<GroupAuditAction>[];

  private constructor({
    id,
    name,
    description,
    type,
    parentGroupId,
    depth,
    simulatorLeaderId,
    isActive,
    maxStudents,
    enrollmentCode,
    semester,
    academicYear,
    createdBy,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    name: string;
    description?: string;
    type: GroupTypeValue;
    parentGroupId?: string;
    depth: number;
    simulatorLeaderId?: string;
    isActive: boolean;
    maxStudents?: number;
    enrollmentCode?: string;
    semester?: string;
    academicYear?: string;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<GroupAuditAction>[];
  }) {
    super();
    this._id = id;
    this._name = name;
    this._description = description;
    this._type = type;
    this._parentGroupId = parentGroupId;
    this._depth = depth;
    this._simulatorLeaderId = simulatorLeaderId;
    this._isActive = isActive;
    this._maxStudents = maxStudents;
    this._enrollmentCode = enrollmentCode;
    this._semester = semester;
    this._academicYear = academicYear;
    this._createdBy = createdBy;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get type(): GroupTypeValue {
    return this._type;
  }

  public get parentGroupId(): string | undefined {
    return this._parentGroupId;
  }

  public get depth(): number {
    return this._depth;
  }

  public get simulatorLeaderId(): string | undefined {
    return this._simulatorLeaderId;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get maxStudents(): number | undefined {
    return this._maxStudents;
  }

  public get enrollmentCode(): string | undefined {
    return this._enrollmentCode;
  }

  public get semester(): string | undefined {
    return this._semester;
  }

  public get academicYear(): string | undefined {
    return this._academicYear;
  }

  public get createdBy(): string | undefined {
    return this._createdBy;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<GroupAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    name,
    description,
    type,
    parentGroupId,
    depth,
    enrollmentCode,
    semester,
    academicYear,
    maxStudents,
    createdBy,
  }: {
    name: string;
    description?: string;
    type: GroupTypeValue;
    parentGroupId?: string;
    depth: number;
    enrollmentCode: string;
    semester?: string;
    academicYear?: string;
    maxStudents?: number;
    createdBy: string;
  }): Group {
    const now: Date = new Date();

    const group: Group = new Group({
      id: generateId(),
      name,
      description,
      type,
      parentGroupId,
      depth,
      isActive: true,
      maxStudents,
      enrollmentCode,
      semester,
      academicYear,
      createdBy,
      createdAt: now,
      updatedAt: now,
      auditLogs: [
        AuditLog.create<GroupAuditAction>({
          action: "group_created",
          performedByUserId: createdBy,
          metadata: { name, type, parentGroupId: parentGroupId ?? null, depth },
        }),
      ],
    });

    group.publishEvent(new GroupCreatedEvent({ entity: group, performedBy: createdBy }));

    return group;
  }

  public static reconstitute({
    id,
    name,
    description,
    type,
    parentGroupId,
    depth,
    simulatorLeaderId,
    isActive,
    maxStudents,
    enrollmentCode,
    semester,
    academicYear,
    createdBy,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    name: string;
    description?: string;
    type: GroupTypeValue;
    parentGroupId?: string;
    depth: number;
    simulatorLeaderId?: string;
    isActive: boolean;
    maxStudents?: number;
    enrollmentCode?: string;
    semester?: string;
    academicYear?: string;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<GroupAuditAction>[];
  }): Group {
    return new Group({
      id,
      name,
      description,
      type,
      parentGroupId,
      depth,
      simulatorLeaderId,
      isActive,
      maxStudents,
      enrollmentCode,
      semester,
      academicYear,
      createdBy,
      createdAt,
      updatedAt,
      auditLogs,
    });
  }

  public update(changes: GroupChanges, performedBy: string): void {
    const recorded: Record<string, { before: unknown; after: unknown }> = {};

    if (changes.name !== undefined) {
      recorded.name = { before: this._name, after: changes.name };
      this._name = changes.name;
    }

    if (changes.description !== undefined) {
      recorded.description = { before: this._description ?? null, after: changes.description };
      this._description = changes.description ?? undefined;
    }

    if (changes.semester !== undefined) {
      recorded.semester = { before: this._semester ?? null, after: changes.semester };
      this._semester = changes.semester ?? undefined;
    }

    if (changes.academicYear !== undefined) {
      recorded.academicYear = { before: this._academicYear ?? null, after: changes.academicYear };
      this._academicYear = changes.academicYear ?? undefined;
    }

    if (changes.maxStudents !== undefined) {
      recorded.maxStudents = { before: this._maxStudents ?? null, after: changes.maxStudents };
      this._maxStudents = changes.maxStudents ?? undefined;
    }

    if (changes.isActive !== undefined) {
      recorded.isActive = { before: this._isActive, after: changes.isActive };
      this._isActive = changes.isActive;
    }

    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<GroupAuditAction>({
        action: "group_updated",
        performedByUserId: performedBy,
        metadata: { changes: recorded },
      }),
    );

    this.publishEvent(new GroupUpdatedEvent({ entity: this, performedBy }));
  }

  public isStudentGroup(): boolean {
    return this._type === STUDENT_GROUP_TYPE;
  }

  public isTeacherGroup(): boolean {
    return this._type === TEACHER_GROUP_TYPE;
  }

  public deactivate(performedBy: string): void {
    this.update({ isActive: false }, performedBy);
  }

  public recordSupervisionAdded(studentGroupId: string, performedBy: string): void {
    this._recordSupervision("group_supervision_added", studentGroupId, performedBy);
  }

  public recordSupervisionRemoved(studentGroupId: string, performedBy: string): void {
    this._recordSupervision("group_supervision_removed", studentGroupId, performedBy);
  }

  public isLedBy(userId: string): boolean {
    return this._simulatorLeaderId === userId;
  }

  public changeSimulatorLead(userId: string | undefined, performedBy: string): void {
    const before: string | null = this._simulatorLeaderId ?? null;

    this._simulatorLeaderId = userId;
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<GroupAuditAction>({
        action: "group_simulator_lead_changed",
        performedByUserId: performedBy,
        metadata: { changes: { simulatorLeaderId: { before, after: userId ?? null } } },
      }),
    );

    this.publishEvent(new GroupSimulatorLeadChangedEvent({ entity: this, performedBy }));
  }

  public delete(performedBy: string): void {
    this._auditLogs.push(
      AuditLog.create<GroupAuditAction>({
        action: "group_deleted",
        performedByUserId: performedBy,
        metadata: { name: this._name, parentGroupId: this._parentGroupId ?? null, depth: this._depth },
      }),
    );

    this.publishEvent(new GroupDeletedEvent({ entity: this, performedBy }));
  }

  private _recordSupervision(action: GroupAuditAction, studentGroupId: string, performedBy: string): void {
    this._updatedAt = new Date();

    this._auditLogs.push(
      AuditLog.create<GroupAuditAction>({
        action,
        performedByUserId: performedBy,
        metadata: { teacherGroupId: this._id, studentGroupId },
      }),
    );

    this.publishEvent(new GroupUpdatedEvent({ entity: this, performedBy }));
  }
}
