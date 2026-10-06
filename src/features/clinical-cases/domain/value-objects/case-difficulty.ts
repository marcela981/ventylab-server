/*
 * Funcionalidad: Valores de dificultad de caso clínico
 * Descripción: Constantes del enum CaseDifficulty (BEGINNER, INTERMEDIATE, ADVANCED) usadas para filtrar casos clínicos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type CaseDifficultyValue = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export const CASE_DIFFICULTY_VALUES: readonly CaseDifficultyValue[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
