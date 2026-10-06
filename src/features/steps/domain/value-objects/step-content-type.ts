/*
 * Funcionalidad: Objeto de valor step-content-type
 * Descripción: Define los valores permitidos StepContentTypeValue, TEXT_STEP_CONTENT_TYPE, STEP_CONTENT_TYPE_VALUES de la feature de pasos (tarjetas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type StepContentTypeValue = "text" | "image" | "video" | "quiz" | "simulation" | "code";

export const TEXT_STEP_CONTENT_TYPE: StepContentTypeValue = "text";

export const STEP_CONTENT_TYPE_VALUES: readonly StepContentTypeValue[] = ["text", "image", "video", "quiz", "simulation", "code"] as const;
