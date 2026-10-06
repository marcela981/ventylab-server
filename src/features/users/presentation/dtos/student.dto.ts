/*
 * Funcionalidad: DTO StudentDTO
 * Descripción: Representa un estudiante y su resumen de progreso en las respuestas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

export class StudentProgressDTO {
  @ApiProperty({ description: "Completed lessons", example: 8 })
  public completedLessons: number;

  @ApiProperty({ description: "Lessons started or completed", example: 12 })
  public totalLessons: number;

  @ApiProperty({ description: "Total time spent in lessons, in seconds", example: 5400 })
  public totalTimeSpent: number;

  @ApiProperty({ description: "Last lesson access", example: "2024-01-20T14:45:00.000Z", nullable: true, type: Date })
  public lastAccess: Date | null;

  @ApiProperty({ description: "Completed lessons over started lessons, rounded from 0 to 100", example: 67 })
  public progressPercentage: number;

  public constructor({
    completedLessons,
    totalLessons,
    totalTimeSpent,
    lastAccess,
    progressPercentage,
  }: {
    completedLessons: number;
    totalLessons: number;
    totalTimeSpent: number;
    lastAccess: Date | null;
    progressPercentage: number;
  }) {
    this.completedLessons = completedLessons;
    this.totalLessons = totalLessons;
    this.totalTimeSpent = totalTimeSpent;
    this.lastAccess = lastAccess;
    this.progressPercentage = progressPercentage;
  }
}

export class StudentDTO {
  @ApiProperty({ description: "Student unique identifier", example: "cm5x2k9a00000abcd1234efgh" })
  public id: string;

  @ApiProperty({ description: "Student's email address", example: "student@ventylab.com", format: "email" })
  public email: string;

  @ApiProperty({ description: "Student's full name", example: "Ana María Pérez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "User role", enum: USER_ROLE_VALUES, example: "STUDENT" })
  public role: string;

  @ApiProperty({ description: "Profile image URL", example: "https://example.com/avatar.png", nullable: true, type: String })
  public image: string | null;

  @ApiProperty({ description: "Creation timestamp", example: "2024-01-15T10:30:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Last update timestamp", example: "2024-01-20T14:45:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Lesson progress summary", type: StudentProgressDTO })
  public stats: StudentProgressDTO;

  public constructor({
    id,
    email,
    name,
    role,
    image,
    createdAt,
    updatedAt,
    stats,
  }: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    stats: StudentProgressDTO;
  }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role;
    this.image = image;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.stats = stats;
  }
}
