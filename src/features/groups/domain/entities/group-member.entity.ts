/*
 * Funcionalidad: Entidad GroupMember
 * Descripción: Agregado de membresía de un usuario en un grupo con su rol heredado (STUDENT o TEACHER), su rol dentro del grupo (LEADER o MEMBER) y fecha de ingreso; registra auditoría y eventos al agregarse, cambiar de rol, ser promovido o degradado como líder o retirarse
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
  GroupMemberAddedEvent,
  GroupMemberRemovedEvent,
  GroupMemberRoleChangedEvent,
} from "@/features/groups/domain/events/group-member.events";
import { type GroupMemberRoleValue } from "@/features/groups/domain/value-objects/group-member-role";
import {
  type GroupMembershipRoleValue,
  LEADER_MEMBERSHIP_ROLE,
  MEMBER_MEMBERSHIP_ROLE,
} from "@/features/groups/domain/value-objects/group-membership-role";

export const GROUP_MEMBER_ENTITY_COLLECTION: string = "group_members";
export const GROUP_MEMBER_ENTITY_TYPE: string = "group_member";

export type GroupMemberAuditAction =
  | "group_member_added"
  | "group_member_role_changed"
  | "group_member_membership_role_changed"
  | "group_member_removed";

export class GroupMember extends AggregateRoot {
  private _id: string;
  private _groupId: string;
  private _userId: string;
  private _role: GroupMemberRoleValue;
  private _memberRole: GroupMembershipRoleValue;
  private _joinedAt: Date;
  private _auditLogs: AuditLog<GroupMemberAuditAction>[];

  private constructor({
    id,
    groupId,
    userId,
    role,
    memberRole,
    joinedAt,
    auditLogs,
  }: {
    id: string;
    groupId: string;
    userId: string;
    role: GroupMemberRoleValue;
    memberRole: GroupMembershipRoleValue;
    joinedAt: Date;
    auditLogs: AuditLog<GroupMemberAuditAction>[];
  }) {
    super();
    this._id = id;
    this._groupId = groupId;
    this._userId = userId;
    this._role = role;
    this._memberRole = memberRole;
    this._joinedAt = joinedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get groupId(): string {
    return this._groupId;
  }

  public get userId(): string {
    return this._userId;
  }

  public get role(): GroupMemberRoleValue {
    return this._role;
  }

  public get memberRole(): GroupMembershipRoleValue {
    return this._memberRole;
  }

  public get joinedAt(): Date {
    return this._joinedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<GroupMemberAuditAction>> {
    return this._auditLogs;
  }

  public static create({
    groupId,
    userId,
    role,
    performedBy,
  }: {
    groupId: string;
    userId: string;
    role: GroupMemberRoleValue;
    performedBy: string;
  }): GroupMember {
    const member: GroupMember = new GroupMember({
      id: generateId(),
      groupId,
      userId,
      role,
      memberRole: MEMBER_MEMBERSHIP_ROLE,
      joinedAt: new Date(),
      auditLogs: [
        AuditLog.create<GroupMemberAuditAction>({
          action: "group_member_added",
          performedByUserId: performedBy,
          metadata: { groupId, userId, role, memberRole: MEMBER_MEMBERSHIP_ROLE },
        }),
      ],
    });

    member.publishEvent(new GroupMemberAddedEvent({ entity: member, performedBy }));

    return member;
  }

  public static reconstitute({
    id,
    groupId,
    userId,
    role,
    memberRole,
    joinedAt,
    auditLogs,
  }: {
    id: string;
    groupId: string;
    userId: string;
    role: GroupMemberRoleValue;
    memberRole: GroupMembershipRoleValue;
    joinedAt: Date;
    auditLogs: AuditLog<GroupMemberAuditAction>[];
  }): GroupMember {
    return new GroupMember({ id, groupId, userId, role, memberRole, joinedAt, auditLogs });
  }

  public isStudent(): boolean {
    return this._role === "STUDENT";
  }

  public isLeader(): boolean {
    return this._memberRole === LEADER_MEMBERSHIP_ROLE;
  }

  public promoteToLeader(performedBy: string): void {
    this._changeMembershipRole(LEADER_MEMBERSHIP_ROLE, performedBy);
  }

  public demoteToMember(performedBy: string): void {
    this._changeMembershipRole(MEMBER_MEMBERSHIP_ROLE, performedBy);
  }

  public changeRole(role: GroupMemberRoleValue, performedBy: string): void {
    if (role === this._role) {
      return;
    }

    const before: GroupMemberRoleValue = this._role;

    this._role = role;

    this._auditLogs.push(
      AuditLog.create<GroupMemberAuditAction>({
        action: "group_member_role_changed",
        performedByUserId: performedBy,
        metadata: { changes: { role: { before, after: role } } },
      }),
    );

    this.publishEvent(new GroupMemberRoleChangedEvent({ entity: this, performedBy }));
  }

  public remove(performedBy: string): void {
    this._auditLogs.push(
      AuditLog.create<GroupMemberAuditAction>({
        action: "group_member_removed",
        performedByUserId: performedBy,
        metadata: { groupId: this._groupId, userId: this._userId, role: this._role, memberRole: this._memberRole },
      }),
    );

    this.publishEvent(new GroupMemberRemovedEvent({ entity: this, performedBy }));
  }

  private _changeMembershipRole(memberRole: GroupMembershipRoleValue, performedBy: string): void {
    if (memberRole === this._memberRole) {
      return;
    }

    const before: GroupMembershipRoleValue = this._memberRole;

    this._memberRole = memberRole;

    this._auditLogs.push(
      AuditLog.create<GroupMemberAuditAction>({
        action: "group_member_membership_role_changed",
        performedByUserId: performedBy,
        metadata: { groupId: this._groupId, userId: this._userId, changes: { memberRole: { before, after: memberRole } } },
      }),
    );

    this.publishEvent(new GroupMemberRoleChangedEvent({ entity: this, performedBy }));
  }
}
