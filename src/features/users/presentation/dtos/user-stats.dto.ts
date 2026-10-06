/*
 * Funcionalidad: DTO UserStatsDTO
 * Descripción: Representa las estadísticas del usuario en las respuestas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class UserStatsDTO {
  @ApiProperty({ description: "Lessons the user has started or completed", example: 12 })
  public totalLessons: number;

  @ApiProperty({ description: "Lessons the user has completed", example: 8 })
  public completedLessons: number;

  @ApiProperty({ description: "Lessons started but not completed", example: 4 })
  public inProgressLessons: number;

  @ApiProperty({ description: "Completed lessons over started lessons, from 0 to 100", example: 66.67 })
  public completionRate: number;

  @ApiProperty({ description: "Unlocked achievements", example: 3 })
  public totalAchievements: number;

  @ApiProperty({ description: "Quiz attempts", example: 5 })
  public totalQuizAttempts: number;

  @ApiProperty({ description: "Average quiz score", example: 82.5 })
  public averageQuizScore: number;

  public constructor({
    totalLessons,
    completedLessons,
    inProgressLessons,
    completionRate,
    totalAchievements,
    totalQuizAttempts,
    averageQuizScore,
  }: {
    totalLessons: number;
    completedLessons: number;
    inProgressLessons: number;
    completionRate: number;
    totalAchievements: number;
    totalQuizAttempts: number;
    averageQuizScore: number;
  }) {
    this.totalLessons = totalLessons;
    this.completedLessons = completedLessons;
    this.inProgressLessons = inProgressLessons;
    this.completionRate = completionRate;
    this.totalAchievements = totalAchievements;
    this.totalQuizAttempts = totalQuizAttempts;
    this.averageQuizScore = averageQuizScore;
  }
}
