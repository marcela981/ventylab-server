/*
 * Funcionalidad: Adaptador JwtAccessTokenVerifier
 * Descripción: Implementa IAccessTokenVerifier con ITokenGenerator y devuelve sub y rol, o undefined si el token no es válido
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type AccessTokenClaims, type IAccessTokenVerifier } from "@/common/application/ports/access-token-verifier.interface";
import {
  type ITokenGenerator,
  type JwtPayload,
  TOKEN_GENERATOR_TOKEN,
} from "@/features/auth/application/ports/token-generator.interface";

@Injectable()
export class JwtAccessTokenVerifier implements IAccessTokenVerifier {
  public constructor(
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly _tokenGenerator: ITokenGenerator,
  ) {}

  public async verify(token: string): Promise<AccessTokenClaims | undefined> {
    try {
      const payload: JwtPayload = await this._tokenGenerator.verifyToken(token);

      return { sub: payload.sub, role: payload.role };
    } catch (_error: unknown) {
      return undefined;
    }
  }
}
