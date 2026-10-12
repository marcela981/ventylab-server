/*
 * Funcionalidad: Configuración de calificación de evaluaciones
 * Descripción: Contrato y token de inyección de la configuración de calificación (nota mínima aprobatoria en la escala 0.0–5.0 y gracia de entrega tras el plazo en milisegundos); la raíz de composición la enlaza con los ajustes editables de la plataforma y cada lectura devuelve el valor vigente
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const EVALUATION_GRADING_CONFIG_TOKEN: unique symbol = Symbol("EVALUATION_GRADING_CONFIG_TOKEN");

export interface EvaluationGradingConfig {
  readonly passingGrade: number;
  readonly submitGraceMs: number;
}
