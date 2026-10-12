/*
 * Funcionalidad: Puerto de repositorio GROUP_ANALYTICS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IGroupAnalyticsRepository de lecturas por lotes para analítica (membresías de estudiantes en grupos de tipo STUDENT, de todos los grupos o de uno), su modelo de lectura y su token de inyección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const GROUP_ANALYTICS_REPOSITORY_TOKEN: unique symbol = Symbol("GROUP_ANALYTICS_REPOSITORY_TOKEN");

export interface StudentMembershipView {
  readonly userId: string;
  readonly groupId: string;
}

export interface IGroupAnalyticsRepository {
  getStudentMemberships(groupId?: string): Promise<StudentMembershipView[]>;
}
