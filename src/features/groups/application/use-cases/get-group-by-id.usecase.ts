/*
 * Funcionalidad: Caso de uso GetGroupByIdUseCase
 * Descripción: Obtiene el detalle de un grupo con sus relaciones y sus miembros ordenados por rol y fecha de ingreso, solo si el ejecutor puede leerlo; en otro caso responde como si no existiera para no revelar su existencia
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GroupAccessService } from "@/features/groups/application/services/group-access.service";
import { GroupNotFoundError } from "@/features/groups/domain/groups.errors";
import { type GroupDetailView } from "@/features/groups/domain/read-models/group.read-model";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { type GroupActor } from "@/features/groups/domain/services/group-management-policy";

/**
 * @throws {GroupNotFoundError} If the group does not exist or the caller cannot read it
 */
@Injectable()
export class GetGroupByIdUseCase {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    private readonly _groupAccessService: GroupAccessService,
  ) {}

  public async execute(groupId: string, actor: GroupActor): Promise<GroupDetailView> {
    const view: GroupDetailView | undefined = await this._groupsRepository.getDetailView(groupId);

    if (!view) {
      throw new GroupNotFoundError();
    }

    const readable: boolean = await this._groupAccessService.canRead(actor, view.group);

    if (!readable) {
      throw new GroupNotFoundError();
    }

    return view;
  }
}
