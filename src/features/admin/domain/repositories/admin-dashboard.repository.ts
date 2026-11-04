/*
 * Funcionalidad: Repositorio de lectura del panel de administración
 * Descripción: Contrato del modelo de lectura que agrega datos de varias features (usuarios, grupos, progreso, evaluaciones, quizzes, calificaciones, contenido y simulación) para el listado de estudiantes (conteo, página ordenada por nombre o correo, todos los identificadores y filas por identificador para el orden calculado en memoria), el detalle de un estudiante, los profesores y las estadísticas de la plataforma
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type AdminStudentActivity,
  type AdminStudentFilter,
  type AdminStudentPageRequest,
  type AdminStudentProfile,
  type AdminStudentRow,
  type AdminTeacherItem,
  type PlatformCounts,
} from "@/features/admin/domain/read-models/admin-dashboard.read-model";

export const ADMIN_DASHBOARD_REPOSITORY_TOKEN: unique symbol = Symbol("ADMIN_DASHBOARD_REPOSITORY_TOKEN");

export interface IAdminDashboardRepository {
  countStudents(filter: AdminStudentFilter): Promise<number>;
  getStudentPage(filter: AdminStudentFilter, page: AdminStudentPageRequest): Promise<AdminStudentRow[]>;
  // Every matching student ID ordered by name, for the sorts computed in memory.
  getStudentIds(filter: AdminStudentFilter): Promise<string[]>;
  // Rows in the order of the given IDs.
  getStudentRows(ids: readonly string[]): Promise<AdminStudentRow[]>;
  getStudentProfile(userId: string): Promise<AdminStudentProfile | undefined>;
  getStudentActivity(userId: string): Promise<AdminStudentActivity>;
  getTeachers(search?: string): Promise<AdminTeacherItem[]>;
  getPlatformCounts(todayStart: Date, activeSince: Date): Promise<PlatformCounts>;
}
