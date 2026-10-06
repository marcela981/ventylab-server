/*
 * Funcionalidad: Caso de uso GetGroupMembersUseCase
 * Descripción: Lista los miembros de un grupo con sus datos de usuario, ordenados por rol y fecha de ingreso, solo si el ejecutor puede leer el grupo; un grupo inexistente o fuera de su alcance responde como no encontrado
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GroupAccessService } from "@/features/groups/application/services/group-access.service";
import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupNotFoundError } from "@/features/groups/domain/groups.errors";
import { type GroupMemberView } from "@/features/groups/domain/read-models/group.read-model";
import {
  GROUP_MEMBERS_REPOSITORY_TOKEN,
  type IGroupMembersRepository,
} from "@/features/groups/domain/repositories/group-members.repository";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { type GroupActor } from "@/features/groups/domain/services/group-management-policy";

/**
 * @throws {GroupNotFoundError} If the group does not exist or the caller cannot read it
 */
@Injectable()
export class GetGroupMembersUseCase {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    @Inject(GROUP_MEMBERS_REPOSITORY_TOKEN)
    private readonly _groupMembersRepository: IGroupMembersRepository,
    private readonly _groupAccessService: GroupAccessService,
  ) {}

  public async execute(groupId: string, actor: GroupActor): Promise<GroupMemberView[]> {
    const group: Group | undefined = await this._groupsRepository.getById(groupId);

    if (!group) {
      throw new GroupNotFoundError();
    }

    const readable: boolean = await this._groupAccessService.canRead(actor, group);

    if (!readable) {
      throw new GroupNotFoundError();
    }

    return await this._groupMembersRepository.getViews(groupId);
  }
}
