/*
 * Funcionalidad: Objeto de valor module-difficulty
 * Descripción: Define los valores permitidos ModuleDifficultyValue, MODULE_DIFFICULTY_VALUES de la feature de módulos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ModuleDifficultyValue = "prerequisitos" | "beginner" | "intermediate" | "advanced";

export const MODULE_DIFFICULTY_VALUES: readonly ModuleDifficultyValue[] = ["prerequisitos", "beginner", "intermediate", "advanced"] as const;
