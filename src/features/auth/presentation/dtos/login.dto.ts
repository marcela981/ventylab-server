/*
 * Funcionalidad: DTO LoginDTO
 * Descripción: Valida el cuerpo del inicio de sesión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class LoginDTO {
  @ApiProperty({
    description: "User's email address",
    example: "student@ventylab.com",
    format: "email",
  })
  @IsEmail({}, { message: i18nValidationMessage("auth.login.email_must_be_valid") })
  public email: string;

  @ApiProperty({
    description: "User's password",
    example: "Password123",
    format: "password",
  })
  @IsString({ message: i18nValidationMessage("auth.login.password_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("auth.login.password_must_not_be_empty") })
  public password: string;
}
