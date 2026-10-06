/*
 * Funcionalidad: Política de membresía de grupos
 * Descripción: Reglas puras de membresía: un grupo STUDENT admite solo usuarios STUDENT y un grupo TEACHER solo TEACHER o ADMIN; rol heredado (columna role) que se escribe según el rol del usuario; claves de los bloqueos transaccionales por estudiante (un solo grupo STUDENT activo) y por grupo (un solo líder)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type GroupMemberRoleValue,
  STUDENT_MEMBER_ROLE,
  TEACHER_MEMBER_ROLE,
} from "@/features/groups/domain/value-objects/group-member-role";
import { STUDENT_GROUP_TYPE, type GroupTypeValue } from "@/features/groups/domain/value-objects/group-type";

const STUDENT_USER_ROLE: string = "STUDENT";
const TEACHER_GROUP_USER_ROLES: readonly string[] = ["TEACHER", "ADMIN"];

export function isUserRoleAllowedInGroup(groupType: GroupTypeValue, userRole: string): boolean {
  if (groupType === STUDENT_GROUP_TYPE) {
    return userRole === STUDENT_USER_ROLE;
  }

  return TEACHER_GROUP_USER_ROLES.includes(userRole);
}

export function isStudentUserRole(userRole: string): boolean {
  return userRole === STUDENT_USER_ROLE;
}

export function legacyMemberRoleFor(userRole: string): GroupMemberRoleValue {
  return userRole === STUDENT_USER_ROLE ? STUDENT_MEMBER_ROLE : TEACHER_MEMBER_ROLE;
}

export function studentMembershipLockKey(userId: string): string {
  return `groups:student-membership:${userId}`;
}

export function groupLeadershipLockKey(groupId: string): string {
  return `groups:leadership:${groupId}`;
}
