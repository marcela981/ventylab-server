/*
 * Funcionalidad: Caso de uso IssueNextAuthTokenUseCase
 * Descripción: Verifica con UsersFacade que el usuario de la sesión de NextAuth exista, coincida con su correo y esté activo, y emite sus tokens del backend
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { IssueNextAuthTokenCommand } from "@/features/auth/application/commands/issue-nextauth-token.command";
import { issueLoginResult } from "@/features/auth/application/helpers/issue-login-result.helper";
import { type ITokenGenerator, TOKEN_GENERATOR_TOKEN } from "@/features/auth/application/ports/token-generator.interface";
import { type LoginResult } from "@/features/auth/application/results/login.result";
import { InvalidCredentialsError, UserInactiveError } from "@/features/auth/domain/auth.errors";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

/**
 * @throws {UserNotFoundError} If no user exists with the given ID
 * @throws {InvalidCredentialsError} If the email does not match the user's email
 * @throws {UserInactiveError} If the user account is inactive
 */
@Injectable()
export class IssueNextAuthTokenUseCase {
  public constructor(
    private readonly _usersFacade: UsersFacade,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly _tokenGenerator: ITokenGenerator,
  ) {}

  public async execute(command: IssueNextAuthTokenCommand): Promise<LoginResult> {
    const user: UserAccount | undefined = await this._usersFacade.getUserById(command.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.email !== command.email) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new UserInactiveError();
    }

    return await issueLoginResult(this._tokenGenerator, user);
  }
}
