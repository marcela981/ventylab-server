/*
 * Funcionalidad: DTO AuthUserDTO
 * Descripción: Representa el usuario autenticado en las respuestas de autenticación v1.2: preferencia de apariencia (themeMode, themePalette; null sin elección)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { THEME_MODE_VALUES, THEME_PALETTE_VALUES } from "@/features/users/domain/value-objects/theme-preference";
import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

export class AuthUserDTO {
  @ApiProperty({ description: "User unique identifier", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "User's email address", example: "student@ventylab.com", format: "email" })
  public email: string;

  @ApiProperty({ description: "User's full name", example: "Ana María Pérez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "User role", enum: USER_ROLE_VALUES, example: "STUDENT" })
  public role: string;

  @ApiProperty({
    description: "Profile image URL, same as UserDTO.image: a signed URL of the uploaded photo (it expires; read it again instead of storing it), or else the stored image (the Google picture)",
    example: "https://example.com/avatar.png",
    nullable: true,
    type: String,
  })
  public image: string | null;

  @ApiProperty({ description: "Interface mode chosen by the user, or null when none was chosen (the web follows the system mode)", enum: THEME_MODE_VALUES, example: "dark", nullable: true, type: String })
  public themeMode: string | null;

  @ApiProperty({ description: "Interface palette chosen by the user, or null when none was chosen (the web uses VentyLab)", enum: THEME_PALETTE_VALUES, example: "ventylab", nullable: true, type: String })
  public themePalette: string | null;

  public constructor({
    id,
    email,
    name,
    role,
    image,
    themeMode,
    themePalette,
  }: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    image: string | null;
    themeMode: string | null;
    themePalette: string | null;
  }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role;
    this.image = image;
    this.themeMode = themeMode;
    this.themePalette = themePalette;
  }
}
