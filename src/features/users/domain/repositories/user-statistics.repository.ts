/*
 * Funcionalidad: Repositorio IUserStatisticsRepository
 * Descripción: Define el contrato y el token para consultar estadísticas de usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type StudentProgressSummary, type UserStats } from "@/features/users/domain/value-objects/user-stats";

export const USER_STATISTICS_REPOSITORY_TOKEN: unique symbol = Symbol("USER_STATISTICS_REPOSITORY_TOKEN");

export interface IUserStatisticsRepository {
  getUserStats(userId: string): Promise<UserStats>;
  getStudentProgressSummaries(studentIds: string[]): Promise<StudentProgressSummary[]>;
}
