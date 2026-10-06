/*
 * Funcionalidad: Jerarquía de roles de usuario
 * Descripción: Compara roles con la jerarquía STUDENT < TEACHER < ADMIN
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

const ROLE_RANK: Readonly<Record<UserRoleValue, number>> = {
  STUDENT: 0,
  TEACHER: 1,
  ADMIN: 2,
};

export function hasRoleAtLeast(actual: string, required: UserRoleValue): boolean {
  const actualRank: number | undefined = ROLE_RANK[actual as UserRoleValue];

  return actualRank !== undefined && actualRank >= ROLE_RANK[required];
}
