/*
 * Funcionalidad: Repositorio de pertenencia a grupos para actividades
 * Descripción: Puerto de solo lectura sobre grupos y membresías que necesitan las actividades (grupos de un usuario y grupo activo); ActivitiesModule lo enlaza al repositorio de grupos exportado por GroupsModule
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const ACTIVITY_GROUP_MEMBERSHIP_REPOSITORY_TOKEN: unique symbol = Symbol("ACTIVITY_GROUP_MEMBERSHIP_REPOSITORY_TOKEN");

export interface IActivityGroupMembershipRepository {
  getGroupIdsForUser(userId: string, transaction?: unknown): Promise<string[]>;
  isActiveGroup(groupId: string, transaction?: unknown): Promise<boolean>;
}
