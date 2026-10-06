/*
 * Funcionalidad: Guard AdminApiKeyGuard
 * Descripción: Permite el acceso solo si la cabecera x-admin-api-key coincide con ADMIN_API_KEY
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Request } from "express";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  public constructor(private readonly _configService: ConfigService<EnvironmentVariables, true>) {}

  public canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest<Request>();

    const apiKey: string | undefined = request.headers["x-admin-api-key"] as string | undefined;
    const expectedKey: string | undefined = this._configService.get("ADMIN_API_KEY", { infer: true });

    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
