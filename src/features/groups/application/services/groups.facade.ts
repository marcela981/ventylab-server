/*
 * Funcionalidad: Fachada pública de grupos
 * Descripción: API de lectura que GroupsModule exporta para otras features: grupo STUDENT activo de un usuario, miembros de un grupo, liderazgo, pertenencia, grupos STUDENT supervisados por los grupos TEACHER de un profesor y alcance de gestión; usa los repositorios de grupos y miembros y GroupAccessService
 * Versión: 1.0
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
  GROUP_MEMBERS_REPOSITORY_TOKEN,
  type IGroupMembersRepository,
} from "@/features/groups/domain/repositories/group-members.repository";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { type GroupActor } from "@/features/groups/domain/services/group-management-policy";
import { type GroupMembershipRoleValue } from "@/features/groups/domain/value-objects/group-membership-role";

export interface GroupMemberSummary {
  readonly userId: string;
  readonly name?: string;
  readonly email: string;
  readonly userRole: string;
  readonly memberRole: GroupMembershipRoleValue;
}

@Injectable()
export class GroupsFacade {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    @Inject(GROUP_MEMBERS_REPOSITORY_TOKEN)
    private readonly _groupMembersRepository: IGroupMembersRepository,
    private readonly _groupAccessService: GroupAccessService,
  ) {}

  public async getStudentGroupOfUser(userId: string): Promise<StudentGroupSummaryView | undefined> {
    return await this._groupsRepository.getStudentGroupSummaryOfUser(userId);
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

  public async canManageGroup(user: GroupActor, groupId: string): Promise<boolean> {
    const group: Group | undefined = await this._groupsRepository.getById(groupId);

    if (!group) {
      return false;
    }

    return await this._groupAccessService.canManage(user, group);
  }
}
