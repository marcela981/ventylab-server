/*
 * Funcionalidad: Caso de uso RefreshTokenUseCase
 * Descripción: Valida el token de refresco, recarga el usuario con UsersFacade, rechaza usuarios inactivos y tokens emitidos antes de refreshTokensRevokedAt, y emite un token de acceso nuevo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { RefreshTokenCommand } from "@/features/auth/application/commands/refresh-token.command";
import { buildJwtPayload } from "@/features/auth/application/helpers/build-jwt-payload.helper";
import {
  type ITokenGenerator,
  type RefreshTokenClaims,
  TOKEN_GENERATOR_TOKEN,
} from "@/features/auth/application/ports/token-generator.interface";
import { RefreshTokenResult } from "@/features/auth/application/results/refresh-token.result";
import { RefreshTokenRevokedError, UserInactiveError } from "@/features/auth/domain/auth.errors";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

const MILLISECONDS_PER_SECOND: number = 1000;

/**
 * @throws {RefreshTokenInvalidError} If the token signature or claims are invalid
 * @throws {RefreshTokenExpiredError} If the refresh token has expired
 * @throws {UserNotFoundError} If the user referenced in the token no longer exists
 * @throws {UserInactiveError} If the user account is inactive
 * @throws {RefreshTokenRevokedError} If the token was issued at or before the user's refresh token revocation
 */
@Injectable()
export class RefreshTokenUseCase {
  public constructor(
    private readonly _usersFacade: UsersFacade,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly _tokenGenerator: ITokenGenerator,
  ) {}

  public async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    const claims: RefreshTokenClaims = await this._tokenGenerator.verifyRefreshToken(command.refreshToken);

    const user: UserAccount | undefined = await this._usersFacade.getUserById(claims.sub);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (!user.isActive) {
      throw new UserInactiveError();
    }

    if (RefreshTokenUseCase._isRevoked(claims.iat, user.refreshTokensRevokedAt)) {
      throw new RefreshTokenRevokedError();
    }

    const accessToken: string = await this._tokenGenerator.generateToken(buildJwtPayload(user));

    return new RefreshTokenResult({ accessToken, userId: user.id });
  }

  private static _isRevoked(issuedAtSeconds: number, revokedAt: Date | undefined): boolean {
    if (!revokedAt) {
      return false;
    }

    return issuedAtSeconds <= Math.floor(revokedAt.getTime() / MILLISECONDS_PER_SECOND);
  }
}
