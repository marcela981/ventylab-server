/*
 * Funcionalidad: Caso de uso CanManageOverridesUseCase
 * Descripción: Ejecuta la operación CanManageOverrides de la feature de personalizaciones de contenido por estudiante; depende de IUserRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { ADMIN_ROLE_VALUE, TEACHER_ROLE_VALUE } from "@/features/users/domain/value-objects/user-role";

@Injectable()
export class CanManageOverridesUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
  ) {}

  public async execute(requesterId: string, requesterRole: string, studentId: string): Promise<boolean> {
    if (requesterRole === ADMIN_ROLE_VALUE) {
      return true;
    }

    if (requesterRole === TEACHER_ROLE_VALUE) {
      return await this._usersRepository.isStudentAssignedToTeacher(requesterId, studentId);
    }

    return false;
  }
}
