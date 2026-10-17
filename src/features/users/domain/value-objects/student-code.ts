/*
 * Funcionalidad: Código estudiantil
 * Descripción: Reglas del código estudiantil institucional de un usuario: longitud máxima y caracteres permitidos (letras, dígitos y guiones), que comparten la validación de la petición y el dominio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const STUDENT_CODE_MAX_LENGTH: number = 32;

export const STUDENT_CODE_PATTERN: RegExp = /^[A-Za-z0-9-]+$/;

export function isValidStudentCode(value: string): boolean {
  return value.length >= 1 && value.length <= STUDENT_CODE_MAX_LENGTH && STUDENT_CODE_PATTERN.test(value);
}
