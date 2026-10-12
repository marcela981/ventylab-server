/*
 * Funcionalidad: Pruebas de autorización de AuditLogController
 * Descripción: Verifica que todas las rutas de auditoría exijan JwtAuthGuard, PermissionsGuard y el permiso audit:read, que solo el rol ADMIN lo tenga y que el controlador solo exponga rutas GET
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { RequestMethod } from "@nestjs/common";
import { GUARDS_METADATA, METHOD_METADATA } from "@nestjs/common/constants";

import { AuditLogController } from "@/features/audit-log/presentation/controllers/audit-log.controller";
import { PERMISSIONS_KEY } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { ROLE_PERMISSIONS } from "@/features/authorization/domain/role-permissions";

describe("AuditLogController authorization", () => {
  it("guards every route with JWT and the audit:read permission", () => {
    const guards: unknown[] = Reflect.getMetadata(GUARDS_METADATA, AuditLogController);
    const permissions: string[] = Reflect.getMetadata(PERMISSIONS_KEY, AuditLogController);

    expect(guards).toEqual([JwtAuthGuard, PermissionsGuard]);
    expect(permissions).toEqual(["audit:read"]);
  });

  it("grants audit:read only to administrators", () => {
    expect(ROLE_PERMISSIONS.ADMIN).toContain("audit:read");
    expect(ROLE_PERMISSIONS.TEACHER).not.toContain("audit:read");
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain("audit:read");
  });

  it("exposes read-only routes", () => {
    const prototype: Record<string, unknown> = AuditLogController.prototype as unknown as Record<string, unknown>;
    const methods: RequestMethod[] = Object.getOwnPropertyNames(prototype)
      .filter((name: string) => name !== "constructor")
      .map((name: string) => Reflect.getMetadata(METHOD_METADATA, prototype[name] as object) as RequestMethod);

    expect(methods).toHaveLength(3);
    expect(methods.every((method: RequestMethod) => method === RequestMethod.GET)).toBe(true);
  });
});
