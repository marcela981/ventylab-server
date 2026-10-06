/*
 * Funcionalidad: Configuración de calificación de evaluaciones
 * Descripción: Contrato y token de inyección de la configuración de calificación (nota mínima aprobatoria en la escala 0.0–5.0), que el módulo construye desde EVALUATION_PASSING_GRADE con ConfigService
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const EVALUATION_GRADING_CONFIG_TOKEN: unique symbol = Symbol("EVALUATION_GRADING_CONFIG_TOKEN");

export interface EvaluationGradingConfig {
  readonly passingGrade: number;
}
