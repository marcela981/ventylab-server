/*
 * Funcionalidad: Caso de uso GetUserByIdUseCase
 * Descripción: Devuelve un usuario por id o lanza error si no existe
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

/**
 * @throws {UserNotFoundError} If no user exists with the given ID
 */
@Injectable()
export class GetUserByIdUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
  ) {}

  public async execute(id: string): Promise<User> {
    const user: User | undefined = await this._usersRepository.getById(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }
}
