/*
 * Funcionalidad: Caso de uso GetGroupSupervisionsUseCase
 * Descripción: Lista los grupos STUDENT supervisados por un grupo TEACHER existente, con su nombre, estado y fecha del vínculo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Group } from "@/features/groups/domain/entities/group.entity";
import { GroupNotFoundError } from "@/features/groups/domain/groups.errors";
import { type GroupSupervisionView } from "@/features/groups/domain/read-models/group.read-model";
import {
  GROUP_SUPERVISIONS_REPOSITORY_TOKEN,
  type IGroupSupervisionsRepository,
} from "@/features/groups/domain/repositories/group-supervisions.repository";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";

/**
 * @throws {GroupNotFoundError} If the teacher group does not exist
 */
@Injectable()
export class GetGroupSupervisionsUseCase {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
    @Inject(GROUP_SUPERVISIONS_REPOSITORY_TOKEN)
    private readonly _groupSupervisionsRepository: IGroupSupervisionsRepository,
  ) {}

  public async execute(teacherGroupId: string): Promise<GroupSupervisionView[]> {
    const group: Group | undefined = await this._groupsRepository.getById(teacherGroupId);

    if (!group) {
      throw new GroupNotFoundError();
    }

    return await this._groupSupervisionsRepository.getViews(teacherGroupId);
  }
}
