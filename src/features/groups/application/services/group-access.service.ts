/*
 * Funcionalidad: Servicio de acceso a grupos
 * Descripción: Resuelve el contexto (supervisión del grupo por un grupo TEACHER del ejecutor y pertenencia) con los repositorios de grupos y miembros y aplica la política de gestión y lectura; lanza GroupManagementForbiddenError cuando el ejecutor no puede gestionar el grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupManagementForbiddenError } from "@/features/groups/domain/groups.errors";
import {
  GROUP_MEMBERS_REPOSITORY_TOKEN,
  type IGroupMembersRepository,
} from "@/features/groups/domain/repositories/group-members.repository";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import {
  canManageGroup,
  canReadGroup,
  type GroupActor,
  isAdminActor,
  isTeacherActor,
} from "@/features/groups/domain/services/group-management-policy";

@Injectable()
export class GroupAccessService {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    @Inject(GROUP_MEMBERS_REPOSITORY_TOKEN)
    private readonly _groupMembersRepository: IGroupMembersRepository,
  ) {}

  public async canManage(actor: GroupActor, group: Group, transaction?: unknown): Promise<boolean> {
    if (isAdminActor(actor)) {
      return true;
    }

    const needsSupervisionLookup: boolean = isTeacherActor(actor) && group.isStudentGroup() && group.createdBy !== actor.id;

    const supervisedByActor: boolean = needsSupervisionLookup
      ? await this._groupsRepository.isSupervisedByTeacherMember(group.id, actor.id, transaction)
      : false;

    return canManageGroup(actor, group, { supervisedByActor });
  }

  public async assertCanManage(actor: GroupActor, group: Group, transaction?: unknown): Promise<void> {
    const allowed: boolean = await this.canManage(actor, group, transaction);

    if (!allowed) {
      throw new GroupManagementForbiddenError();
    }
  }

  public async canRead(actor: GroupActor, group: Group): Promise<boolean> {
    const canManage: boolean = await this.canManage(actor, group);

    if (canManage) {
      return true;
    }

    const membership: GroupMember | undefined = await this._groupMembersRepository.getByGroupAndUser(group.id, actor.id);

    return canReadGroup(actor, group, { canManage, isMember: membership !== undefined });
  }
}
