/*
 * Funcionalidad: DTO RegisterDTO
 * Descripción: Valida el cuerpo del registro de usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

const PASSWORD_STRENGTH_REGEX: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

export class RegisterDTO {
  @ApiProperty({
    description: "User's full name",
    example: "Ana María Pérez",
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: i18nValidationMessage("auth.register.name_must_be_string") })
  @MinLength(2, { message: i18nValidationMessage("auth.register.name_min_length") })
  @MaxLength(100, { message: i18nValidationMessage("auth.register.name_max_length") })
  public name: string;

  @ApiProperty({
    description: "User's email address",
    example: "ana.perez@example.com",
    format: "email",
  })
  @IsEmail({}, { message: i18nValidationMessage("auth.register.email_must_be_valid") })
  public email: string;

  @ApiProperty({
    description: "User's password. 8 to 128 characters with at least one uppercase letter, one lowercase letter and one number.",
    example: "SecurePass123",
    minLength: 8,
    maxLength: 128,
    format: "password",
  })
  @IsString({ message: i18nValidationMessage("auth.register.password_must_be_string") })
  @Matches(PASSWORD_STRENGTH_REGEX, { message: i18nValidationMessage("auth.register.password_strength") })
  public password: string;
}
