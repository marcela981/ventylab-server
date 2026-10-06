/*
 * Funcionalidad: Guard PermissionsGuard
 * Descripción: Exige todos los permisos declarados con RequirePermissions
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { type Request } from "express";

import { ForbiddenPermissionError, UnauthorizedError } from "@/features/auth/domain/auth.errors";
import { PERMISSIONS_KEY } from "@/features/auth/presentation/decorators/require-permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  public constructor(private readonly _reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const requiredPermissions: string[] | undefined = this._reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest<Request>();
    const user: Request["user"] = request.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const userPermissions: string[] = user.permissions ?? [];

    const hasAll: boolean = requiredPermissions.every((permission: string) => userPermissions.includes(permission));

    if (!hasAll) {
      throw new ForbiddenPermissionError();
    }

    return true;
  }
}
