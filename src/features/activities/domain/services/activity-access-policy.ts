/*
 * Funcionalidad: Política de acceso de actividades
 * Descripción: Reglas por rol de la feature de actividades: estudiantes (vista por asignación a grupo) y administradores (ADMIN puede gestionar actividades y asignaciones ajenas)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ADMIN_ROLE_VALUE, STUDENT_ROLE_VALUE } from "@/features/users/domain/value-objects/user-role";

export function isStudentRole(role: string): boolean {
  return role === STUDENT_ROLE_VALUE;
}

export function canManageAnyActivity(role: string): boolean {
  return role === ADMIN_ROLE_VALUE;
}
