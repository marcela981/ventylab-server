/*
 * Funcionalidad: DTO UserDTO
 * Descripción: Representa un usuario en las respuestas, incluido su estado activo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

export class UserDTO {
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

  @ApiProperty({ description: "Whether the account is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Email verification timestamp", example: "2024-01-15T10:30:00.000Z", nullable: true, type: Date })
  public emailVerified: Date | null;

  @ApiProperty({ description: "Creation timestamp", example: "2024-01-15T10:30:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Last update timestamp", example: "2024-01-20T14:45:00.000Z" })
  public updatedAt: Date;

  public constructor({
    id,
    email,
    name,
    role,
    image,
    isActive,
    emailVerified,
    createdAt,
    updatedAt,
  }: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    image: string | null;
    isActive: boolean;
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role;
    this.image = image;
    this.isActive = isActive;
    this.emailVerified = emailVerified;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
