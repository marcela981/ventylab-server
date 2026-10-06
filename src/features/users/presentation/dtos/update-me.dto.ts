/*
 * Funcionalidad: DTO UpdateMeDTO
 * Descripción: Valida el cuerpo de la actualización del perfil
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

const IMAGE_URL_REGEX: RegExp = /^(https?:\/\/\S+|data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+)$/;

export class UpdateMeDTO {
  @ApiPropertyOptional({
    description: "User's full name",
    example: "Ana María Pérez",
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("users.update_me.name_must_be_string") })
  @MinLength(1, { message: i18nValidationMessage("users.update_me.name_must_not_be_empty") })
  @MaxLength(100, { message: i18nValidationMessage("users.update_me.name_max_length") })
  public name?: string;

  @ApiPropertyOptional({
    description: "Profile image as an http(s) URL or a base64 image data URL. Send null or an empty string to remove it.",
    example: "https://example.com/avatar.png",
    nullable: true,
    type: String,
  })
  @ValidateIf((dto: UpdateMeDTO) => dto.image !== undefined && dto.image !== null && dto.image !== "")
  @IsString({ message: i18nValidationMessage("users.update_me.image_must_be_valid_url") })
  @Matches(IMAGE_URL_REGEX, { message: i18nValidationMessage("users.update_me.image_must_be_valid_url") })
  public image?: string | null;
}
