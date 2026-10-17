/*
 * Funcionalidad: DTO UserDTO
 * Descripción: Representa un usuario en las respuestas, incluidos su estado activo, su código estudiantil y si es el superadministrador
 * Versión: 1.2
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

  @ApiProperty({ description: "Institutional student code set by an admin (unique, letters, digits and hyphens)", example: "2026-0001", nullable: true, type: String })
  public studentCode: string | null;

  @ApiProperty({ description: "Whether the user is the configured superadmin (SUPERADMIN_EMAIL), whose role and status cannot change", example: false })
  public isSuperadmin: boolean;

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
    studentCode,
    isSuperadmin,
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
    studentCode: string | null;
    isSuperadmin: boolean;
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
    this.studentCode = studentCode;
    this.isSuperadmin = isSuperadmin;
    this.emailVerified = emailVerified;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
