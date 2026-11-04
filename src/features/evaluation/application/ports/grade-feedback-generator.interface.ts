/*
 * Funcionalidad: Puerto IGradeFeedbackGenerator
 * Descripción: Define el contrato y el token de inyección del generador de retroalimentación de una evaluación calificada a partir de un contexto sin datos personales del estudiante; las opciones llevan el identificador del intento solo para enlazar la telemetría, nunca para el prompt; v1.2: las opciones llevan el estudiante dueño del intento (atribución en la telemetría) y el solicitante opcional (idioma de la retroalimentación y cuota de IA)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GeneratedGradeFeedback, type GradeFeedbackContext } from "@/features/evaluation/domain/value-objects/grade-feedback";
import { type GradeFeedbackRequester } from "@/features/evaluation/domain/value-objects/grade-feedback-requester";

export type {
  GeneratedGradeFeedback,
  GradeFeedbackContext,
  GradeFeedbackQuestionContext,
  GradeFeedbackSource,
  QuestionFeedback,
} from "@/features/evaluation/domain/value-objects/grade-feedback";

export const GRADE_FEEDBACK_GENERATOR_TOKEN: unique symbol = Symbol("GRADE_FEEDBACK_GENERATOR_TOKEN");

export interface GradeFeedbackGenerationOptions {
  readonly attemptId: string;
  // Owner of the attempt: the call is attributed to the student in the AI telemetry.
  readonly studentId?: string;
  // Whose action triggered the generation: its language is the feedback language and its quota applies; none for system closes.
  readonly requester?: GradeFeedbackRequester;
}

export interface IGradeFeedbackGenerator {
  generate(context: GradeFeedbackContext, options: GradeFeedbackGenerationOptions): Promise<GeneratedGradeFeedback>;
}
