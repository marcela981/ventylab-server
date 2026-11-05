/*
 * Funcionalidad: DTO ForgotPasswordDTO
 * Descripción: Valida el correo de la solicitud de recuperación de contraseña
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class ForgotPasswordDTO {
  @ApiProperty({ description: "Email address of the account to recover", example: "student@ventylab.com", format: "email" })
  @IsEmail({}, { message: i18nValidationMessage("auth.forgot_password.email_must_be_valid") })
  public email: string;
}
