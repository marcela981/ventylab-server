/*
 * Funcionalidad: DTO RefreshTokenRequestDTO
 * Descripción: Valida el token de refresco recibido
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

export class RefreshTokenRequestDTO {
  @ApiProperty({
    description: "JWT refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString({ message: i18nValidationMessage("auth.refresh.token_must_be_string") })
  @IsNotEmpty({ message: i18nValidationMessage("auth.refresh.token_must_not_be_empty") })
  public refreshToken: string;
}
