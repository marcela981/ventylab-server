/*
 * Funcionalidad: Fachada UsersFacade
 * Descripción: API pública de la feature de usuarios para otras features (auth, grupos): consulta de cuentas por ID, detección del superadmin, comparación jerárquica de roles (STUDENT < TEACHER < ADMIN) y alta o vinculación con Google; devuelve el modelo de lectura UserAccount
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { FindOrCreateGoogleUserCommand } from "@/features/users/application/commands/find-or-create-google-user.command";
import { SUPERADMIN_EMAIL_TOKEN } from "@/features/users/application/tokens/superadmin-email.token";
import { FindOrCreateGoogleUserUseCase } from "@/features/users/application/use-cases/find-or-create-google-user.usecase";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { isSuperadmin } from "@/features/users/domain/services/is-superadmin";
import { hasRoleAtLeast } from "@/features/users/domain/services/role-hierarchy";
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

export interface GoogleProfile {
  googleId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

@Injectable()
export class UsersFacade {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    private readonly _findOrCreateGoogleUserUseCase: FindOrCreateGoogleUserUseCase,
    @Inject(SUPERADMIN_EMAIL_TOKEN)
    private readonly _superadminEmail: string,
  ) {}

  public async getUserById(id: string): Promise<UserAccount | undefined> {
    const user: User | undefined = await this._usersRepository.getById(id);

    return user ? UsersFacade._toAccount(user) : undefined;
  }

  public async getUsersByIds(ids: readonly string[]): Promise<UserAccount[]> {
    const users: User[] = await this._usersRepository.getByIds(ids);

    return users.map((user: User) => UsersFacade._toAccount(user));
  }

  public isSuperadmin(userOrEmail: string | { email: string }): boolean {
    const email: string = typeof userOrEmail === "string" ? userOrEmail : userOrEmail.email;

    return isSuperadmin(email, this._superadminEmail);
  }

  public hasRole(user: { role: string }, role: UserRoleValue): boolean {
    return hasRoleAtLeast(user.role, role);
  }

  public async findOrCreateFromGoogle(profile: GoogleProfile): Promise<UserAccount> {
    const user: User = await this._findOrCreateGoogleUserUseCase.execute(
      new FindOrCreateGoogleUserCommand({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      }),
    );

    return UsersFacade._toAccount(user);
  }

  private static _toAccount(user: User): UserAccount {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.value,
      image: user.image,
      isActive: user.isActive,
      googleId: user.googleId,
      hasPassword: user.passwordHash !== undefined,
      refreshTokensRevokedAt: user.refreshTokensRevokedAt,
      createdAt: user.createdAt,
    };
  }
}
