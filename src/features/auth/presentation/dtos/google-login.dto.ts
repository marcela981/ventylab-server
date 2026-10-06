/*
 * Funcionalidad: DTO GoogleLoginDTO
 * Descripción: Valida el cuerpo del inicio de sesión con Google (ID token de Google Identity Services)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class GoogleLoginDTO {
  @ApiProperty({
    description: "Google ID token (JWT) obtained from Google Identity Services for this application's client ID",
    example: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
  })
  @IsString({ message: i18nValidationMessage("auth.google.id_token_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("auth.google.id_token_must_not_be_empty") })
  public idToken: string;
}
