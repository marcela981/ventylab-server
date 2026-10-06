/*
 * Funcionalidad: Mapper AuthorizationMapper
 * Descripción: Convierte la matriz de roles y permisos en DTOs
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { RolePermissionsDTO } from "@/features/authorization/presentation/dtos/role-permissions.dto";

export class AuthorizationMapper {
  public static toRolePermissionsDTOList(items: { role: string; permissions: string[] }[]): RolePermissionsDTO[] {
    return items.map(
      (item: { role: string; permissions: string[] }) => new RolePermissionsDTO({ role: item.role, permissions: item.permissions }),
    );
  }
}
