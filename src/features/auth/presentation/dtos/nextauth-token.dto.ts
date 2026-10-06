/*
 * Funcionalidad: DTO NextAuthTokenDTO
 * Descripción: Valida los datos de sesión de NextAuth para el intercambio de tokens
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

export class NextAuthTokenDTO {
  @ApiProperty({
    description: "User identifier from the NextAuth session",
    example: "cm5x2k9a00000abcd1234efgh",
  })
  @IsString({ message: i18nValidationMessage("auth.nextauth_token.user_id_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("auth.nextauth_token.user_id_must_not_be_empty") })
  public userId: string;

  @ApiProperty({
    description: "User email from the NextAuth session",
    example: "student@ventylab.com",
    format: "email",
  })
  @IsEmail({}, { message: i18nValidationMessage("auth.nextauth_token.email_must_be_valid") })
  public email: string;
}
