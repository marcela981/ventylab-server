/*
 * Funcionalidad: Modelos de retroalimentación de calificación
 * Descripción: Estructuras del contexto anonimizado de una evaluación calificada (preguntas, respuestas, puntos y nota) y de la retroalimentación generada por pregunta y global, con su origen (modelo de lenguaje o determinística)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type GradeFeedbackSource = "LLM" | "DETERMINISTIC";

export const LLM_FEEDBACK_SOURCE: GradeFeedbackSource = "LLM";
export const DETERMINISTIC_FEEDBACK_SOURCE: GradeFeedbackSource = "DETERMINISTIC";

export interface GradeFeedbackEvaluationContext {
  type: string;
  title: string;
}

export interface GradeFeedbackQuestionContext {
  questionId: string;
  type: string;
  promptText: string;
  points: number;
  earnedPoints: number;
  studentAnswerText: string;
  correctAnswerText?: string;
  rubricSummary?: string;
  explanation?: string;
}

export interface GradeFeedbackContext {
  evaluation: GradeFeedbackEvaluationContext;
  grade: number;
  passingGrade: number;
  questions: GradeFeedbackQuestionContext[];
}

export interface QuestionFeedback {
  questionId: string;
  content: string;
}

export interface GradeFeedbackContent {
  perQuestion: QuestionFeedback[];
  overall: string;
}

export interface GeneratedGradeFeedback extends GradeFeedbackContent {
  source: GradeFeedbackSource;
  provider?: string;
  model?: string;
}
