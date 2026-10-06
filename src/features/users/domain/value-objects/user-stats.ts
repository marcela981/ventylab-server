/*
 * Funcionalidad: Objeto de valor UserStats
 * Descripción: Representa las estadísticas de aprendizaje del usuario y el resumen de progreso del estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class UserStats {
  public readonly totalLessons: number;
  public readonly completedLessons: number;
  public readonly inProgressLessons: number;
  public readonly completionRate: number;
  public readonly totalAchievements: number;
  public readonly totalQuizAttempts: number;
  public readonly averageQuizScore: number;

  public constructor({
    totalLessons,
    completedLessons,
    totalAchievements,
    totalQuizAttempts,
    averageQuizScore,
  }: {
    totalLessons: number;
    completedLessons: number;
    totalAchievements: number;
    totalQuizAttempts: number;
    averageQuizScore: number;
  }) {
    this.totalLessons = totalLessons;
    this.completedLessons = completedLessons;
    this.inProgressLessons = totalLessons - completedLessons;
    this.completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    this.totalAchievements = totalAchievements;
    this.totalQuizAttempts = totalQuizAttempts;
    this.averageQuizScore = averageQuizScore;
  }
}

export class StudentProgressSummary {
  public readonly studentId: string;
  public readonly completedLessons: number;
  public readonly totalLessons: number;
  public readonly totalTimeSpent: number;
  public readonly lastAccess?: Date;
  public readonly progressPercentage: number;

  public constructor({
    studentId,
    completedLessons,
    totalLessons,
    totalTimeSpent,
    lastAccess,
  }: {
    studentId: string;
    completedLessons: number;
    totalLessons: number;
    totalTimeSpent: number;
    lastAccess?: Date;
  }) {
    this.studentId = studentId;
    this.completedLessons = completedLessons;
    this.totalLessons = totalLessons;
    this.totalTimeSpent = totalTimeSpent;
    this.lastAccess = lastAccess;
    this.progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }

  public static empty(studentId: string): StudentProgressSummary {
    return new StudentProgressSummary({ studentId, completedLessons: 0, totalLessons: 0, totalTimeSpent: 0 });
  }
}
