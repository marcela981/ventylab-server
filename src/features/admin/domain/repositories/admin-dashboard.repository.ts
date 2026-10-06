/*
 * Funcionalidad: Repositorio de lectura del panel de administración
 * Descripción: Contrato del modelo de lectura que agrega datos de varias features (usuarios, grupos, progreso, evaluaciones, quizzes, calificaciones, contenido y simulación) para el listado de estudiantes, el detalle de un estudiante, los profesores y las estadísticas de la plataforma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Paginated } from "@/common/domain/utils/paginated";
import {
  type AdminStudentActivity,
  type AdminStudentListItem,
  type AdminStudentProfile,
  type AdminTeacherItem,
  type GetAdminStudentsQuery,
  type PlatformCounts,
} from "@/features/admin/domain/read-models/admin-dashboard.read-model";

export const ADMIN_DASHBOARD_REPOSITORY_TOKEN: unique symbol = Symbol("ADMIN_DASHBOARD_REPOSITORY_TOKEN");

export interface IAdminDashboardRepository {
  getStudents(query: GetAdminStudentsQuery): Promise<Paginated<AdminStudentListItem>>;
  getStudentProfile(userId: string): Promise<AdminStudentProfile | undefined>;
  getStudentActivity(userId: string): Promise<AdminStudentActivity>;
  getTeachers(search?: string): Promise<AdminTeacherItem[]>;
  getPlatformCounts(todayStart: Date, activeSince: Date): Promise<PlatformCounts>;
}
