/*
 * Funcionalidad: Tipo de grupo
 * Descripción: Valores permitidos para el tipo de un grupo (STUDENT para estudiantes, TEACHER para profesores) y normalización del tipo recibido, que toma STUDENT ante cualquier valor distinto de TEACHER
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type GroupTypeValue = "STUDENT" | "TEACHER";

export const STUDENT_GROUP_TYPE: GroupTypeValue = "STUDENT";
export const TEACHER_GROUP_TYPE: GroupTypeValue = "TEACHER";

export const GROUP_TYPE_VALUES: readonly GroupTypeValue[] = [STUDENT_GROUP_TYPE, TEACHER_GROUP_TYPE] as const;

export function toGroupType(value?: string): GroupTypeValue {
  return value === TEACHER_GROUP_TYPE ? TEACHER_GROUP_TYPE : STUDENT_GROUP_TYPE;
}
