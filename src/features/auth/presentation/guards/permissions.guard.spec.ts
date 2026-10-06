/*
 * Funcionalidad: Pruebas del guard PermissionsGuard
 * Descripción: Verifica con los permisos reales de ROLE_PERMISSIONS y la metadata real de la ruta PATCH api/users/:id/role que un profesor recibe 403 y un administrador pasa, y que sin usuario autenticado se responde 401
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ForbiddenPermissionError, UnauthorizedError } from "@/features/auth/domain/auth.errors";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { resolveRolePermissions } from "@/features/authorization/domain/role-permissions";
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";
import { UsersController } from "@/features/users/presentation/controllers/users.controller";

function contextFor(user: { permissions: string[] } | undefined): ExecutionContext {
  return {
    getHandler: (): unknown => UsersController.prototype.changeUserRole,
    getClass: (): unknown => UsersController,
    switchToHttp: () => ({ getRequest: (): { user: { permissions: string[] } | undefined } => ({ user }) }),
  } as unknown as ExecutionContext;
}

function userWithRole(role: UserRoleValue): { permissions: string[] } {
  return { permissions: resolveRolePermissions(role) };
}

describe("PermissionsGuard on the change-role route", () => {
  const guard: PermissionsGuard = new PermissionsGuard(new Reflector());

  it("rejects a teacher with 403 because the teacher role lacks users:update_role", () => {
    const context: ExecutionContext = contextFor(userWithRole("TEACHER"));

    const act = (): boolean => guard.canActivate(context);

    expect(act).toThrow(ForbiddenPermissionError);
  });

  it("lets an admin through because the admin role holds the full permission catalog", () => {
    const context: ExecutionContext = contextFor(userWithRole("ADMIN"));

    const allowed: boolean = guard.canActivate(context);

    expect(allowed).toBe(true);
  });

  it("rejects an unauthenticated request with 401", () => {
    const context: ExecutionContext = contextFor(undefined);

    const act = (): boolean => guard.canActivate(context);

    expect(act).toThrow(UnauthorizedError);
  });
});
