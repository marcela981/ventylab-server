/*
 * Funcionalidad: Guard JwtAuthGuard
 * Descripción: Exige un JWT de acceso válido y asigna su payload a request.user
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CanActivate, type ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { type Request } from "express";

import {
  type ITokenGenerator,
  type JwtPayload,
  TOKEN_GENERATOR_TOKEN,
} from "@/features/auth/application/ports/token-generator.interface";
import { UnauthorizedError } from "@/features/auth/domain/auth.errors";
import { extractBearerToken } from "@/features/auth/presentation/guards/extract-bearer-token";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  public constructor(
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly _tokenGenerator: ITokenGenerator,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const token: string | undefined = extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedError();
    }

    const payload: JwtPayload = await this._tokenGenerator.verifyToken(token);

    request.user = payload;

    return true;
  }
}
