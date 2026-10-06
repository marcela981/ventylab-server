/*
 * Funcionalidad: Repositorio de membresías de grupo de un usuario
 * Descripción: Puerto de la feature de usuarios para retirar a un usuario de los grupos de ciertos tipos (y de su liderazgo de simulador) dentro de la transacción del cambio de rol; devuelve los IDs de grupo abandonados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type MembershipGroupTypeValue } from "@/features/users/domain/services/role-change-group-cleanup";

export const USER_GROUP_MEMBERSHIPS_REPOSITORY_TOKEN: unique symbol = Symbol("USER_GROUP_MEMBERSHIPS_REPOSITORY_TOKEN");

export interface IUserGroupMembershipsRepository {
  removeFromGroupTypes(userId: string, groupTypes: readonly MembershipGroupTypeValue[], transaction?: unknown): Promise<string[]>;
}
