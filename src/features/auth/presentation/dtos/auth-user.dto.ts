/*
 * Funcionalidad: DTO AuthUserDTO
 * Descripción: Representa el usuario autenticado en las respuestas de autenticación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

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

  @ApiProperty({ description: "Profile image URL", example: "https://example.com/avatar.png", nullable: true, type: String })
  public image: string | null;

  public constructor({
    id,
    email,
    name,
    role,
    image,
  }: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    image: string | null;
  }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role;
    this.image = image;
  }
}
