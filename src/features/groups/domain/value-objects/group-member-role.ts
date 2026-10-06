/*
 * Funcionalidad: Rol de miembro de grupo
 * Descripción: Valores permitidos para el rol de una membresía de grupo (STUDENT o TEACHER) y normalización del rol recibido, que toma STUDENT ante cualquier valor distinto de TEACHER
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type GroupMemberRoleValue = "STUDENT" | "TEACHER";

export const STUDENT_MEMBER_ROLE: GroupMemberRoleValue = "STUDENT";
export const TEACHER_MEMBER_ROLE: GroupMemberRoleValue = "TEACHER";

export const GROUP_MEMBER_ROLE_VALUES: readonly GroupMemberRoleValue[] = [STUDENT_MEMBER_ROLE, TEACHER_MEMBER_ROLE] as const;

export function toGroupMemberRole(value?: string): GroupMemberRoleValue {
  return value === TEACHER_MEMBER_ROLE ? TEACHER_MEMBER_ROLE : STUDENT_MEMBER_ROLE;
}
