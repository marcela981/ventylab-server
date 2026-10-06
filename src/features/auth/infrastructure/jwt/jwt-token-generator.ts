/*
 * Funcionalidad: Adaptador JwtTokenGenerator
 * Descripción: Implementa ITokenGenerator con @nestjs/jwt usando los secretos y expiraciones configurados; la verificación del token de refresco expone su iat
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { type ITokenGenerator, type JwtPayload, type RefreshTokenClaims } from "@/features/auth/application/ports/token-generator.interface";
import {
  InvalidTokenError,
  RefreshTokenExpiredError,
  RefreshTokenInvalidError,
  TokenExpiredError,
} from "@/features/auth/domain/auth.errors";

@Injectable()
export class JwtTokenGenerator implements ITokenGenerator {
  public constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  public async generateToken(payload: JwtPayload): Promise<string> {
    return await this._jwtService.signAsync(JwtTokenGenerator._toClaims(payload));
  }

  public async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload: JwtPayload = await this._jwtService.verifyAsync<JwtPayload>(token);

      if (!JwtTokenGenerator._hasRequiredClaims(payload)) {
        throw new InvalidTokenError();
      }

      return JwtTokenGenerator._toClaims(payload);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "TokenExpiredError") {
        throw new TokenExpiredError();
      }

      throw new InvalidTokenError();
    }
  }

  public async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return await this._jwtService.signAsync(JwtTokenGenerator._toClaims(payload), {
      secret: this._configService.get("JWT_REFRESH_SECRET", { infer: true }),
      expiresIn: this._configService.get("JWT_REFRESH_EXPIRES_IN", { infer: true }),
    });
  }

  public async verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
    try {
      const payload: RefreshTokenClaims = await this._jwtService.verifyAsync<RefreshTokenClaims>(token, {
        secret: this._configService.get("JWT_REFRESH_SECRET", { infer: true }),
      });

      if (!JwtTokenGenerator._hasRequiredClaims(payload) || typeof payload.iat !== "number") {
        throw new RefreshTokenInvalidError();
      }

      return { ...JwtTokenGenerator._toClaims(payload), iat: payload.iat };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "TokenExpiredError") {
        throw new RefreshTokenExpiredError();
      }

      throw new RefreshTokenInvalidError();
    }
  }

  private static _hasRequiredClaims(payload: JwtPayload): boolean {
    return typeof payload.sub === "string" && typeof payload.email === "string" && typeof payload.role === "string";
  }

  private static _toClaims(payload: JwtPayload): JwtPayload {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions ?? [],
    };
  }
}
