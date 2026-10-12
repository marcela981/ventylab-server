/*
 * Funcionalidad: Puerto de repositorio GROUP_ANALYTICS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IGroupAnalyticsRepository de lecturas por lotes para analítica (membresías de estudiantes en grupos de tipo STUDENT, de todos los grupos o de uno; identificadores de grupos STUDENT, opcionalmente solo los que gestiona un profesor por creación o supervisión y acotados a una lista; y si un usuario con rol STUDENT pertenece a alguno de unos grupos STUDENT), sus modelos de lectura y su token de inyección
 * Versión: 1.1
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

export interface StudentGroupIdsFilter {
  readonly managedBy?: string;
  readonly groupIds?: ReadonlyArray<string>;
}

export interface IGroupAnalyticsRepository {
  getStudentMemberships(groupId?: string): Promise<StudentMembershipView[]>;
  getStudentGroupIds(filter: StudentGroupIdsFilter): Promise<string[]>;
  isStudentMemberOfAny(userId: string, groupIds?: ReadonlyArray<string>): Promise<boolean>;
}
