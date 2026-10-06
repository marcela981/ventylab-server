/*
 * Funcionalidad: DTO RolePermissionsDTO
 * Descripción: Representa un rol con sus permisos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

export class RolePermissionsDTO {
  @ApiProperty({ description: "User role", enum: USER_ROLE_VALUES, example: "TEACHER" })
  public role: string;

  @ApiProperty({
    description: "Permissions granted to the role",
    type: [String],
    example: ["levels:read", "levels:create", "groups:read"],
  })
  public permissions: string[];

  public constructor({ role, permissions }: { role: string; permissions: string[] }) {
    this.role = role;
    this.permissions = permissions;
  }
}
