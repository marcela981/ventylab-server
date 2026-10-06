/*
 * Funcionalidad: DTO ChangePasswordDTO
 * Descripción: Valida el cuerpo del cambio de contraseña
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

const PASSWORD_STRENGTH_REGEX: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

export class ChangePasswordDTO {
  @ApiProperty({
    description: "Current password",
    example: "CurrentPassword123",
    format: "password",
  })
  @IsString({ message: i18nValidationMessage("users.change_password.current_password_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("users.change_password.current_password_must_not_be_empty") })
  public currentPassword: string;

  @ApiProperty({
    description: "New password. 8 to 128 characters with at least one uppercase letter, one lowercase letter and one number.",
    example: "NewPassword456",
    minLength: 8,
    maxLength: 128,
    format: "password",
  })
  @IsString({ message: i18nValidationMessage("users.change_password.new_password_must_be_string") })
  @Matches(PASSWORD_STRENGTH_REGEX, { message: i18nValidationMessage("users.change_password.new_password_strength") })
  public newPassword: string;
}
