/*
 * Funcionalidad: Consulta de los grupos de estudiantes activos de varios usuarios
 * Descripción: Devuelve, para una lista acotada de usuarios, su grupo STUDENT activo (id y nombre), para que quien gestiona miembros vea antes de agregar a quién ya tiene grupo (un estudiante solo puede estar en un grupo STUDENT activo); sin usuarios no consulta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type UserActiveStudentGroupView } from "@/features/groups/domain/read-models/group.read-model";
import { GROUPS_REPOSITORY_TOKEN, type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";

/** Upper bound of user ids per request: one page of the member search or of the students directory. */
export const MAX_STUDENT_MEMBERSHIP_LOOKUP: number = 100;

@Injectable()
export class GetStudentMembershipsUseCase {
  public constructor(
    @Inject(GROUPS_REPOSITORY_TOKEN)
    private readonly _groupsRepository: IGroupsRepository,
  ) {}

  public async execute(userIds: ReadonlyArray<string>): Promise<UserActiveStudentGroupView[]> {
    const unique: string[] = [...new Set(userIds)];

    if (unique.length === 0) {
      return [];
    }

    return await this._groupsRepository.getActiveStudentGroupsOfUsers(unique);
  }
}
