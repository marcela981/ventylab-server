/*
 * Funcionalidad: Reglas de jerarquía y código de inscripción de grupos
 * Descripción: Profundidad máxima de subgrupos (0, 1 y 2), cantidad de intentos para encontrar un código de inscripción libre y generador del código alfanumérico de 6 caracteres
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const MAX_GROUP_DEPTH: number = 2;

export const ENROLLMENT_CODE_ATTEMPTS: number = 10;

const ENROLLMENT_CODE_CHARS: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const ENROLLMENT_CODE_LENGTH: number = 6;

export function generateEnrollmentCode(): string {
  return Array.from(
    { length: ENROLLMENT_CODE_LENGTH },
    (): string => ENROLLMENT_CODE_CHARS[Math.floor(Math.random() * ENROLLMENT_CODE_CHARS.length)],
  ).join("");
}
