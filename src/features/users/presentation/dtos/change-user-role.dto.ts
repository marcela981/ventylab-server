/*
 * Funcionalidad: DTO ChangeUserRoleDTO
 * Descripción: Cuerpo de la petición para cambiar el rol de un usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

export class ChangeUserRoleDTO {
  @ApiProperty({ description: "New role", enum: USER_ROLE_VALUES, example: "TEACHER" })
  @IsIn([...USER_ROLE_VALUES], { message: i18nValidationMessage("users.validation.role_invalid") })
  public role: string;
}
