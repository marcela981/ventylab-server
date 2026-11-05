/*
 * Funcionalidad: Fachada UsersFacade
 * Descripción: API pública de la feature de usuarios para otras features (auth, grupos): consulta de cuentas por ID, detección del superadmin, comparación jerárquica de roles (STUDENT < TEACHER < ADMIN), alta o vinculación con Google y la imagen que se muestra del usuario (foto subida o imagen guardada); devuelve el modelo de lectura UserAccount (con el código de estudiante) v1.3: getUserByEmail (recuperación de contraseña) y la preferencia de apariencia en UserAccount
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { FindOrCreateGoogleUserCommand } from "@/features/users/application/commands/find-or-create-google-user.command";
import { UserImageResolver, type UserImageSource } from "@/features/users/application/services/user-image.resolver";
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
  private readonly _logger: Logger = new Logger(UsersFacade.name);

  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    private readonly _findOrCreateGoogleUserUseCase: FindOrCreateGoogleUserUseCase,
    @Inject(SUPERADMIN_EMAIL_TOKEN)
    private readonly _superadminEmail: string,
    private readonly _userImageResolver: UserImageResolver,
  ) {}

  // The image shown for the user, same rule as UserDTO.image. Signing in must not fail because the photo cannot be signed, so an error falls back to the stored image.
  public async resolveImage(user: UserImageSource): Promise<string | undefined> {
    try {
      return await this._userImageResolver.resolveOne(user);
    } catch (error: unknown) {
      this._logger.warn(`Profile photo of user ${user.id} could not be resolved: ${error instanceof Error ? error.message : String(error)}`);

      return user.image;
    }
  }

  public async getUserByEmail(email: string): Promise<UserAccount | undefined> {
    const user: User | undefined = await this._usersRepository.getByEmail(email);

    return user ? UsersFacade._toAccount(user) : undefined;
  }

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
      avatarMediaId: user.avatarMediaId,
      isActive: user.isActive,
      googleId: user.googleId,
      hasPassword: user.passwordHash !== undefined,
      refreshTokensRevokedAt: user.refreshTokensRevokedAt,
      createdAt: user.createdAt,
      studentCode: user.studentCode,
      themeMode: user.themeMode,
      themePalette: user.themePalette,
    };
  }
}
