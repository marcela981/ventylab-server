/*
 * Funcionalidad: Caso de uso LoginUseCase
 * Descripción: Verifica las credenciales del usuario, rechaza cuentas sin contraseña (solo Google) e inactivas, y emite tokens de acceso y de refresco con sus permisos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IPasswordHasher, PASSWORD_HASHER_TOKEN } from "@/common/application/security/password-hasher.interface";
import { LoginCommand } from "@/features/auth/application/commands/login.command";
import { issueLoginResult } from "@/features/auth/application/helpers/issue-login-result.helper";
import { toAuthenticatedUser } from "@/features/auth/application/helpers/to-authenticated-user.helper";
import { type ITokenGenerator, TOKEN_GENERATOR_TOKEN } from "@/features/auth/application/ports/token-generator.interface";
import { type LoginResult } from "@/features/auth/application/results/login.result";
import { InvalidCredentialsError, PasswordLoginNotAvailableError, UserInactiveError } from "@/features/auth/domain/auth.errors";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";

/**
 * @throws {InvalidCredentialsError} If the email is not found or the password does not match
 * @throws {PasswordLoginNotAvailableError} If the account has no password because it signs in with Google
 * @throws {UserInactiveError} If the user account is inactive
 */
@Injectable()
export class LoginUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly _passwordHasher: IPasswordHasher,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly _tokenGenerator: ITokenGenerator,
  ) {}

  public async execute(command: LoginCommand): Promise<LoginResult> {
    const user: User | undefined = await this._usersRepository.getByEmail(command.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.passwordHash) {
      throw new PasswordLoginNotAvailableError();
    }

    const isPasswordValid: boolean = await this._passwordHasher.verify(command.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new UserInactiveError();
    }

    return await issueLoginResult(this._tokenGenerator, toAuthenticatedUser(user));
  }
}
