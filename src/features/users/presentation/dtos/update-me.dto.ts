/*
 * Funcionalidad: DTO UpdateMeDTO
 * Descripción: Valida el cuerpo de la actualización del perfil (la imagen solo como URL http(s) de hasta 2048 caracteres) v1.2: preferencia de apariencia opcional: themeMode (light, dark) y themePalette (ventylab, univalle)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { THEME_MODE_VALUES, THEME_PALETTE_VALUES } from "@/features/users/domain/value-objects/theme-preference";

// Uploaded photos go through PUT /api/users/me/avatar; base64 data URLs are no longer accepted here (rows already stored are kept).
const IMAGE_URL_REGEX: RegExp = /^https?:\/\/\S+$/;

const IMAGE_URL_MAX_LENGTH: number = 2048;

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
    description: "Profile image as an http(s) URL of at most 2048 characters (upload a photo with PUT /api/users/me/avatar). Send null or an empty string to remove it.",
    example: "https://example.com/avatar.png",
    nullable: true,
    type: String,
    maxLength: IMAGE_URL_MAX_LENGTH,
  })
  @ValidateIf((dto: UpdateMeDTO) => dto.image !== undefined && dto.image !== null && dto.image !== "")
  @IsString({ message: i18nValidationMessage("users.update_me.image_must_be_valid_url") })
  @MaxLength(IMAGE_URL_MAX_LENGTH, { message: i18nValidationMessage("users.update_me.image_too_long") })
  @Matches(IMAGE_URL_REGEX, { message: i18nValidationMessage("users.update_me.image_must_be_valid_url") })
  public image?: string | null;

  @ApiPropertyOptional({ description: "Interface mode chosen by the user (the web follows the system mode until one is chosen)", enum: THEME_MODE_VALUES, example: "dark" })
  @IsOptional()
  @IsIn([...THEME_MODE_VALUES], { message: i18nValidationMessage("users.update_me.theme_mode_invalid") })
  public themeMode?: string;

  @ApiPropertyOptional({ description: "Interface palette chosen by the user (VentyLab until one is chosen)", enum: THEME_PALETTE_VALUES, example: "univalle" })
  @IsOptional()
  @IsIn([...THEME_PALETTE_VALUES], { message: i18nValidationMessage("users.update_me.theme_palette_invalid") })
  public themePalette?: string;
}
