/*
 * Funcionalidad: Limpieza de grupos por cambio de rol
 * Descripción: Decide qué tipos de grupo abandona un usuario al cambiar de rol: los grupos de estudiantes al dejar STUDENT y los grupos docentes al pasar a STUDENT; entre TEACHER y ADMIN no abandona ninguno
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { STUDENT_ROLE_VALUE, type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

export type MembershipGroupTypeValue = "STUDENT" | "TEACHER";

export const STUDENT_GROUP_TYPE: MembershipGroupTypeValue = "STUDENT";
export const TEACHER_GROUP_TYPE: MembershipGroupTypeValue = "TEACHER";

export function groupTypesToLeave(from: UserRoleValue, to: UserRoleValue): MembershipGroupTypeValue[] {
  if (from === to) {
    return [];
  }

  if (from === STUDENT_ROLE_VALUE) {
    return [STUDENT_GROUP_TYPE];
  }

  if (to === STUDENT_ROLE_VALUE) {
    return [TEACHER_GROUP_TYPE];
  }

  return [];
}
