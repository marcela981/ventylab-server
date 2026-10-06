/*
 * Funcionalidad: Mapper UsersMapper
 * Descripción: Convierte entidades y resultados de usuarios en DTOs de respuesta
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type StudentResult } from "@/features/users/application/results/student.result";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type UserStats } from "@/features/users/domain/value-objects/user-stats";
import { StudentDTO, StudentProgressDTO } from "@/features/users/presentation/dtos/student.dto";
import { UserStatsDTO } from "@/features/users/presentation/dtos/user-stats.dto";
import { UserDTO } from "@/features/users/presentation/dtos/user.dto";

export class UsersMapper {
  public static toDTO(user: User): UserDTO {
    return new UserDTO({
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role.value,
      image: user.image ?? null,
      isActive: user.isActive,
      emailVerified: user.emailVerified ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  public static toStatsDTO(stats: UserStats): UserStatsDTO {
    return new UserStatsDTO({
      totalLessons: stats.totalLessons,
      completedLessons: stats.completedLessons,
      inProgressLessons: stats.inProgressLessons,
      completionRate: stats.completionRate,
      totalAchievements: stats.totalAchievements,
      totalQuizAttempts: stats.totalQuizAttempts,
      averageQuizScore: stats.averageQuizScore,
    });
  }

  public static toStudentDTO(result: StudentResult): StudentDTO {
    return new StudentDTO({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name ?? null,
      role: result.user.role.value,
      image: result.user.image ?? null,
      createdAt: result.user.createdAt,
      updatedAt: result.user.updatedAt,
      stats: new StudentProgressDTO({
        completedLessons: result.progress.completedLessons,
        totalLessons: result.progress.totalLessons,
        totalTimeSpent: result.progress.totalTimeSpent,
        lastAccess: result.progress.lastAccess ?? null,
        progressPercentage: result.progress.progressPercentage,
      }),
    });
  }
}
