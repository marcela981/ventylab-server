/*
 * Funcionalidad: Servicio AuthorizationService
 * Descripción: Expone el catálogo de permisos y los permisos de cada rol
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { PERMISSION_CATALOG, type PermissionValue } from "@/features/authorization/domain/permission-catalog";
import { resolveRolePermissions } from "@/features/authorization/domain/role-permissions";
import { USER_ROLE_VALUES, type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

@Injectable()
export class AuthorizationService {
  public getPermissionCatalog(): PermissionValue[] {
    return [...PERMISSION_CATALOG];
  }

  public getRolePermissions(): { role: UserRoleValue; permissions: PermissionValue[] }[] {
    return USER_ROLE_VALUES.map((role: UserRoleValue) => ({ role, permissions: resolveRolePermissions(role) }));
  }
}
