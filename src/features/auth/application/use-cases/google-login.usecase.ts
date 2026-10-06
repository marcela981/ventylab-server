/*
 * Funcionalidad: Caso de uso GoogleLoginUseCase
 * Descripción: Verifica el ID token de Google, exige correo verificado y dominio permitido, crea o vincula la cuenta con UsersFacade, rechaza cuentas inactivas y emite el mismo par de tokens que el inicio de sesión local
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GoogleLoginCommand } from "@/features/auth/application/commands/google-login.command";
import { issueLoginResult } from "@/features/auth/application/helpers/issue-login-result.helper";
import {
  GOOGLE_ID_TOKEN_VERIFIER_TOKEN,
  type GoogleIdTokenClaims,
  type IGoogleIdTokenVerifier,
} from "@/features/auth/application/ports/google-id-token-verifier.interface";
import { type ITokenGenerator, TOKEN_GENERATOR_TOKEN } from "@/features/auth/application/ports/token-generator.interface";
import { type LoginResult } from "@/features/auth/application/results/login.result";
import { ALLOWED_EMAIL_DOMAINS_TOKEN } from "@/features/auth/application/tokens/allowed-email-domains.token";
import {
  EmailDomainNotAllowedError,
  GoogleEmailNotVerifiedError,
  GoogleSignInNotConfiguredError,
  InvalidGoogleTokenError,
  UserInactiveError,
} from "@/features/auth/domain/auth.errors";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

/**
 * @throws {GoogleSignInNotConfiguredError} If no Google client ID is configured
 * @throws {InvalidGoogleTokenError} If the ID token is invalid, expired, issued for another audience or has no email
 * @throws {GoogleEmailNotVerifiedError} If Google does not report the email as verified
 * @throws {EmailDomainNotAllowedError} If allowed domains are configured and the email domain is not one of them
 * @throws {UserInactiveError} If the user account is inactive
 */
@Injectable()
export class GoogleLoginUseCase {
  public constructor(
    @Inject(GOOGLE_ID_TOKEN_VERIFIER_TOKEN)
    private readonly _googleIdTokenVerifier: IGoogleIdTokenVerifier,
    private readonly _usersFacade: UsersFacade,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly _tokenGenerator: ITokenGenerator,
    @Inject(ALLOWED_EMAIL_DOMAINS_TOKEN)
    private readonly _allowedEmailDomains: readonly string[],
  ) {}

  public async execute(command: GoogleLoginCommand): Promise<LoginResult> {
    if (!this._googleIdTokenVerifier.isConfigured()) {
      throw new GoogleSignInNotConfiguredError();
    }

    const claims: GoogleIdTokenClaims = await this._googleIdTokenVerifier.verify(command.idToken);

    if (!claims.email) {
      throw new InvalidGoogleTokenError();
    }

    if (claims.emailVerified !== true) {
      throw new GoogleEmailNotVerifiedError();
    }

    if (!this._isDomainAllowed(claims.email)) {
      throw new EmailDomainNotAllowedError();
    }

    const user: UserAccount = await this._usersFacade.findOrCreateFromGoogle({
      googleId: claims.sub,
      email: claims.email,
      name: claims.name,
      avatarUrl: claims.picture,
    });

    if (!user.isActive) {
      throw new UserInactiveError();
    }

    return await issueLoginResult(this._tokenGenerator, user);
  }

  private _isDomainAllowed(email: string): boolean {
    if (this._allowedEmailDomains.length === 0) {
      return true;
    }

    const domain: string = email.slice(email.lastIndexOf("@") + 1).toLowerCase();

    return this._allowedEmailDomains.some((allowed: string) => allowed.toLowerCase() === domain);
  }
}
