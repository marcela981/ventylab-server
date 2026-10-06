/*
 * Funcionalidad: Guard OptionalJwtAuthGuard
 * Descripción: Asigna request.user si el JWT es válido sin bloquear nunca la petición
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CanActivate, type ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { type Request } from "express";

import { type ITokenGenerator, TOKEN_GENERATOR_TOKEN } from "@/features/auth/application/ports/token-generator.interface";
import { extractBearerToken } from "@/features/auth/presentation/guards/extract-bearer-token";

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  public constructor(
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly _tokenGenerator: ITokenGenerator,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const token: string | undefined = extractBearerToken(request);

    if (!token) {
      return true;
    }

    try {
      request.user = await this._tokenGenerator.verifyToken(token);
    } catch (_error: unknown) {
      request.user = undefined;
    }

    return true;
  }
}
