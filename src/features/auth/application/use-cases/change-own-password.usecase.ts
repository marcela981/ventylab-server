/*
 * Funcionalidad: Caso de uso ChangeOwnPasswordUseCase
 * Descripción: Cambia la contraseña del usuario autenticado con ChangePasswordUseCase de usuarios (que fija refreshTokensRevokedAt, de modo que todos los refresh tokens emitidos hasta ese segundo dejan de servir) y reemite el par de la sesión actual: el refresh token nuevo lleva iat = floor(revocación) + 1 para quedar después de la revocación; el access token anterior sigue vivo hasta vencer
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { issueLoginResult } from "@/features/auth/application/helpers/issue-login-result.helper";
import { type ITokenGenerator, TOKEN_GENERATOR_TOKEN } from "@/features/auth/application/ports/token-generator.interface";
import { type LoginResult } from "@/features/auth/application/results/login.result";
import { ChangePasswordCommand } from "@/features/users/application/commands/change-password.command";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { ChangePasswordUseCase } from "@/features/users/application/use-cases/change-password.usecase";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

const MILLISECONDS_PER_SECOND: number = 1000;

export interface ChangeOwnPasswordInput {
  readonly userId: string;
  readonly currentPassword: string;
  readonly newPassword: string;
}

// The refresh check rejects iat <= floor(revokedAt), so the reissued token is dated one second later.
export function reissuedRefreshIssuedAt(revokedAt: Date): number {
  return Math.floor(revokedAt.getTime() / MILLISECONDS_PER_SECOND) + 1;
}

/**
 * @throws {UserNotFoundError} If the user does not exist
 * @throws {PasswordNotSetError} If the account has no password (Google sign-in)
 * @throws {InvalidCurrentPasswordError} If the current password does not match
 * @throws {SamePasswordError} If the new password equals the current one
 */
@Injectable()
export class ChangeOwnPasswordUseCase {
  public constructor(
    private readonly _changePasswordUseCase: ChangePasswordUseCase,
    private readonly _usersFacade: UsersFacade,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly _tokenGenerator: ITokenGenerator,
  ) {}

  public async execute(input: ChangeOwnPasswordInput): Promise<LoginResult> {
    const revokedAt: Date = await this._changePasswordUseCase.execute(
      new ChangePasswordCommand({ userId: input.userId, currentPassword: input.currentPassword, newPassword: input.newPassword, performedBy: input.userId }),
    );
    const user: UserAccount | undefined = await this._usersFacade.getUserById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    return await issueLoginResult(this._tokenGenerator, user, { refreshIssuedAtSeconds: reissuedRefreshIssuedAt(revokedAt) });
  }
}
