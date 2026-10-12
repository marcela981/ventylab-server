/*
 * Funcionalidad: Fachada pública de grupos
 * Descripción: API de lectura que GroupsModule exporta para otras features: grupo STUDENT activo de un usuario, miembros de un grupo, liderazgo, pertenencia, grupos STUDENT supervisados por los grupos TEACHER de un profesor alcance de gestión y resumen (nombre, tipo, estado) de un grupo y, para analítica, los grupos STUDENT que un actor gestiona (una consulta), si un usuario STUDENT pertenece a alguno de ellos, si un actor gestiona algún grupo STUDENT de un estudiante (sin bucle por grupo) y membresías de estudiantes en grupos STUDENT; usa los repositorios de grupos, miembros y analítica y GroupAccessService
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GroupAccessService } from "@/features/groups/application/services/group-access.service";
import { type GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { type GroupMemberView, type StudentGroupSummaryView } from "@/features/groups/domain/read-models/group.read-model";
import {
  GROUP_ANALYTICS_REPOSITORY_TOKEN,
  type IGroupAnalyticsRepository,
  type StudentMembershipView,
} from "@/features/groups/domain/repositories/group-analytics.repository";
import {
  GROUP_MEMBERS_REPOSITORY_TOKEN,
  type IGroupMembersRepository,
} from "@/features/groups/domain/repositories/group-members.repository";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { type GroupActor, isAdminActor, isTeacherActor } from "@/features/groups/domain/services/group-management-policy";
import { type GroupMembershipRoleValue } from "@/features/groups/domain/value-objects/group-membership-role";
import { type GroupTypeValue } from "@/features/groups/domain/value-objects/group-type";

export interface GroupMemberSummary {
  readonly userId: string;
  readonly name?: string;
  readonly email: string;
  readonly userRole: string;
  readonly memberRole: GroupMembershipRoleValue;
}

export interface GroupSummary {
  readonly id: string;
  readonly name: string;
  readonly type: GroupTypeValue;
  readonly isActive: boolean;
}

@Injectable()
export class GroupsFacade {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    @Inject(GROUP_MEMBERS_REPOSITORY_TOKEN)
    private readonly _groupMembersRepository: IGroupMembersRepository,
    private readonly _groupAccessService: GroupAccessService,
    @Inject(GROUP_ANALYTICS_REPOSITORY_TOKEN)
    private readonly _analyticsRepository: IGroupAnalyticsRepository,
  ) {}

  public async getStudentGroupOfUser(userId: string): Promise<StudentGroupSummaryView | undefined> {
    return await this._groupsRepository.getStudentGroupSummaryOfUser(userId);
  }

  public async getGroupSummary(groupId: string): Promise<GroupSummary | undefined> {
    const group: Group | undefined = await this._groupsRepository.getById(groupId);

    return group ? { id: group.id, name: group.name, type: group.type, isActive: group.isActive } : undefined;
  }

  public async getGroupMembers(groupId: string): Promise<GroupMemberSummary[]> {
    const views: GroupMemberView[] = await this._groupMembersRepository.getViews(groupId);

    return views.map(
      (view: GroupMemberView): GroupMemberSummary => ({
        userId: view.member.userId,
        name: view.user.name,
        email: view.user.email,
        userRole: view.user.role,
        memberRole: view.member.memberRole,
      }),
    );
  }

  public async isGroupLeader(userId: string, groupId: string): Promise<boolean> {
    const member: GroupMember | undefined = await this._groupMembersRepository.getByGroupAndUser(groupId, userId);

    return member?.isLeader() === true;
  }

  public async isMemberOf(userId: string, groupId: string): Promise<boolean> {
    const member: GroupMember | undefined = await this._groupMembersRepository.getByGroupAndUser(groupId, userId);

    return member !== undefined;
  }

  public async getSupervisedStudentGroupIds(teacherUserId: string): Promise<string[]> {
    return await this._groupsRepository.getSupervisedStudentGroupIds(teacherUserId);
  }

  public async getManageableStudentGroupIds(actor: GroupActor, candidateGroupIds?: ReadonlyArray<string>): Promise<string[]> {
    if (isAdminActor(actor)) {
      return await this._analyticsRepository.getStudentGroupIds({ groupIds: candidateGroupIds });
    }

    if (!isTeacherActor(actor)) {
      return [];
    }

    return await this._analyticsRepository.getStudentGroupIds({ managedBy: actor.id, groupIds: candidateGroupIds });
  }

  public async isStudentMemberOfAny(userId: string, groupIds: ReadonlyArray<string>): Promise<boolean> {
    return await this._analyticsRepository.isStudentMemberOfAny(userId, groupIds);
  }

  public async canManageAnyGroupOfUser(user: GroupActor, userId: string): Promise<boolean> {
    if (isAdminActor(user)) {
      return await this._analyticsRepository.isStudentMemberOfAny(userId);
    }

    const groupIds: string[] = await this.getManageableStudentGroupIds(user);

    return await this._analyticsRepository.isStudentMemberOfAny(userId, groupIds);
  }

  public async getStudentMemberships(groupId?: string): Promise<StudentMembershipView[]> {
    return await this._analyticsRepository.getStudentMemberships(groupId);
  }

  public async canManageGroup(user: GroupActor, groupId: string): Promise<boolean> {
    const group: Group | undefined = await this._groupsRepository.getById(groupId);

    if (!group) {
      return false;
    }

    return await this._groupAccessService.canManage(user, group);
  }
}
