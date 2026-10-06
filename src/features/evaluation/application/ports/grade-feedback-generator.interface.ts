/*
 * Funcionalidad: Puerto IGradeFeedbackGenerator
 * Descripción: Define el contrato y el token de inyección del generador de retroalimentación de una evaluación calificada a partir de un contexto sin datos personales del estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GeneratedGradeFeedback, type GradeFeedbackContext } from "@/features/evaluation/domain/value-objects/grade-feedback";

export type {
  GeneratedGradeFeedback,
  GradeFeedbackContext,
  GradeFeedbackQuestionContext,
  GradeFeedbackSource,
  QuestionFeedback,
} from "@/features/evaluation/domain/value-objects/grade-feedback";

export const GRADE_FEEDBACK_GENERATOR_TOKEN: unique symbol = Symbol("GRADE_FEEDBACK_GENERATOR_TOKEN");

export interface IGradeFeedbackGenerator {
  generate(context: GradeFeedbackContext): Promise<GeneratedGradeFeedback>;
}
