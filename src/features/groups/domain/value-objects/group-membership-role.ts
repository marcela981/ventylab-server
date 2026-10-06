/*
 * Funcionalidad: Rol de la membresía dentro del grupo
 * Descripción: Valores permitidos para el rol de un miembro dentro de su grupo (LEADER o MEMBER) y normalización del valor recibido, que toma MEMBER ante cualquier valor distinto de LEADER
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type GroupMembershipRoleValue = "LEADER" | "MEMBER";

export const LEADER_MEMBERSHIP_ROLE: GroupMembershipRoleValue = "LEADER";
export const MEMBER_MEMBERSHIP_ROLE: GroupMembershipRoleValue = "MEMBER";

export const GROUP_MEMBERSHIP_ROLE_VALUES: readonly GroupMembershipRoleValue[] = [LEADER_MEMBERSHIP_ROLE, MEMBER_MEMBERSHIP_ROLE] as const;

export function toGroupMembershipRole(value?: string): GroupMembershipRoleValue {
  return value === LEADER_MEMBERSHIP_ROLE ? LEADER_MEMBERSHIP_ROLE : MEMBER_MEMBERSHIP_ROLE;
}
