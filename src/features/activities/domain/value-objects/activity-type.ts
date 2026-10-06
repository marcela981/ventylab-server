/*
 * Funcionalidad: Valores de tipo de actividad
 * Descripción: Constantes del enum ActivityType (EXAM, QUIZ, WORKSHOP, TALLER)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ActivityTypeValue = "EXAM" | "QUIZ" | "WORKSHOP" | "TALLER";

export const ACTIVITY_TYPE_VALUES: readonly ActivityTypeValue[] = ["EXAM", "QUIZ", "WORKSHOP", "TALLER"] as const;
