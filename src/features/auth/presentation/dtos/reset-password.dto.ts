/*
 * Funcionalidad: DTO ResetPasswordDTO
 * Descripción: Valida el token del enlace de recuperación y la contraseña nueva (8 a 128 caracteres con mayúscula, minúscula y número, la misma regla del registro y del cambio de contraseña)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

const PASSWORD_STRENGTH_REGEX: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
const TOKEN_MAX_LENGTH: number = 256;

export class ResetPasswordDTO {
  @ApiProperty({ description: "Token of the emailed reset link (single use, valid for 30 minutes)", example: "q0W2kE8x1pZ3Yc5vB7nM9aS4dF6gH8jK0lP2oI4uY6t", maxLength: TOKEN_MAX_LENGTH })
  @IsString({ message: i18nValidationMessage("auth.reset_password.token_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("auth.reset_password.token_must_not_be_empty") })
  @MaxLength(TOKEN_MAX_LENGTH, { message: i18nValidationMessage("auth.reset_password.token_must_be_string") })
  public token: string;

  @ApiProperty({
    description: "New password. 8 to 128 characters with at least one uppercase letter, one lowercase letter and one number.",
    example: "NewPassword456",
    minLength: 8,
    maxLength: 128,
    format: "password",
  })
  @IsString({ message: i18nValidationMessage("auth.reset_password.password_must_be_string") })
  @Matches(PASSWORD_STRENGTH_REGEX, { message: i18nValidationMessage("auth.reset_password.password_strength") })
  public newPassword: string;
}
