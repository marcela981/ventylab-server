/*
 * Funcionalidad: DTO ChangeUserStatusDTO
 * Descripción: Cuerpo de la petición para activar o desactivar la cuenta de un usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class ChangeUserStatusDTO {
  @ApiProperty({ description: "Whether the account is active", example: false })
  @IsBoolean({ message: i18nValidationMessage("users.validation.is_active_boolean") })
  public isActive: boolean;
}
