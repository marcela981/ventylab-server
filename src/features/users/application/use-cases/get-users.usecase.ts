/*
 * Funcionalidad: Caso de uso GetUsersUseCase
 * Descripción: Lista usuarios paginados con filtros de búsqueda (nombre, email o ID exacto), rol, grupo y estado activo; depende de IUserRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type GetUsersQuery, type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";

@Injectable()
export class GetUsersUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
  ) {}

  public async execute(query: GetUsersQuery): Promise<Paginated<User>> {
    return await this._usersRepository.getAll(query);
  }
}
