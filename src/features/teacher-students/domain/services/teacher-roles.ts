/*
 * Funcionalidad: Roles de profesor y de administración para relaciones profesor-estudiante
 * Descripción: Indica si un rol puede figurar como profesor en una relación (TEACHER, ADMIN) y si un rol administra todas las relaciones (ADMIN)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  ADMIN_ROLE_VALUE,
  TEACHER_ROLE_VALUE,
  type UserRoleValue,
} from "@/features/users/domain/value-objects/user-role";

const TEACHER_CAPABLE_ROLES: readonly UserRoleValue[] = [TEACHER_ROLE_VALUE, ADMIN_ROLE_VALUE];

export function canActAsTeacher(role: string): boolean {
  return TEACHER_CAPABLE_ROLES.includes(role as UserRoleValue);
}

export function managesAllRelationships(role: string): boolean {
  return role === ADMIN_ROLE_VALUE;
}
