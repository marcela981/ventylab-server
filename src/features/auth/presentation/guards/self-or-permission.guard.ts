/*
 * Funcionalidad: Guard SelfOrPermissionGuard
 * Descripción: Permite la petición si el parámetro de ruta coincide con el sub del usuario o si este tiene los permisos declarados
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
import {
  SELF_OR_PERMISSIONS_KEY,
  type SelfOrPermissionsMetadata,
} from "@/features/auth/presentation/decorators/allow-self-or.decorator";

@Injectable()
export class SelfOrPermissionGuard implements CanActivate {
  public constructor(private readonly _reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const metadata: SelfOrPermissionsMetadata | undefined = this._reflector.getAllAndOverride<SelfOrPermissionsMetadata>(
      SELF_OR_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest<Request>();
    const user: Request["user"] = request.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    const routeParam: unknown = request.params?.[metadata.paramKey];

    if (typeof routeParam === "string" && routeParam === user.sub) {
      return true;
    }

    const userPermissions: string[] = user.permissions ?? [];

    const hasAll: boolean = metadata.permissions.length > 0 &&
      metadata.permissions.every((permission: string) => userPermissions.includes(permission));

    if (!hasAll) {
      throw new ForbiddenPermissionError();
    }

    return true;
  }
}
