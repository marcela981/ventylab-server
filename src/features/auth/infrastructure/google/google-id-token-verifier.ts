/*
 * Funcionalidad: Adaptador GoogleIdTokenVerifier
 * Descripción: Implementa IGoogleIdTokenVerifier con OAuth2Client.verifyIdToken de google-auth-library, usando GOOGLE_CLIENT_ID como audiencia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type LoginTicket, OAuth2Client, type TokenPayload } from "google-auth-library";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import {
  type GoogleIdTokenClaims,
  type IGoogleIdTokenVerifier,
} from "@/features/auth/application/ports/google-id-token-verifier.interface";
import { GoogleSignInNotConfiguredError, InvalidGoogleTokenError } from "@/features/auth/domain/auth.errors";

@Injectable()
export class GoogleIdTokenVerifier implements IGoogleIdTokenVerifier {
  private readonly _logger: Logger = new Logger(GoogleIdTokenVerifier.name);
  private readonly _clientId: string | undefined;
  private readonly _client: OAuth2Client;

  public constructor(configService: ConfigService<EnvironmentVariables>) {
    const clientId: string | undefined = configService.get("GOOGLE_CLIENT_ID", { infer: true })?.trim();

    this._clientId = clientId ? clientId : undefined;
    this._client = new OAuth2Client();
  }

  public isConfigured(): boolean {
    return this._clientId !== undefined;
  }

  public async verify(idToken: string): Promise<GoogleIdTokenClaims> {
    const clientId: string | undefined = this._clientId;

    if (!clientId) {
      throw new GoogleSignInNotConfiguredError();
    }

    let payload: TokenPayload | undefined;

    try {
      const ticket: LoginTicket = await this._client.verifyIdToken({ idToken, audience: clientId });

      payload = ticket.getPayload();
    } catch (error: unknown) {
      // google-auth-library error messages can embed the raw token or its payload, so only the error name is logged.
      this._logger.warn(`Google ID token rejected (${error instanceof Error ? error.name : "unknown error"})`);

      throw new InvalidGoogleTokenError();
    }

    if (!payload?.sub) {
      throw new InvalidGoogleTokenError();
    }

    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      name: payload.name,
      picture: payload.picture,
    };
  }
}
