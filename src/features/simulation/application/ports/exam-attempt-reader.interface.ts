/*
 * Funcionalidad: Puerto de lectura de intentos de examen
 * Descripción: Contrato propio de simulación para leer, sin depender de la feature de evaluaciones, el intento de examen (dueño, estado, fecha límite, evaluación) y la pregunta (tipo, evaluación, caso clínico y rúbrica) que habilitan una sesión en modo examen
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const EXAM_ATTEMPT_READER_TOKEN: unique symbol = Symbol("EXAM_ATTEMPT_READER_TOKEN");

export const IN_PROGRESS_EXAM_ATTEMPT_STATUS: string = "IN_PROGRESS";
export const SIMULATION_QUESTION_TYPE: string = "SIMULATION";

export interface ExamAttemptInfo {
  readonly id: string;
  readonly userId: string;
  readonly evaluationId: string;
  readonly status: string;
  readonly deadlineAt?: Date;
}

export interface ExamQuestionInfo {
  readonly id: string;
  readonly evaluationId: string;
  readonly type: string;
  readonly clinicalCaseId?: string;
  readonly rubric?: unknown;
}

export interface IExamAttemptReader {
  getAttempt(attemptId: string): Promise<ExamAttemptInfo | undefined>;
  getQuestion(questionId: string): Promise<ExamQuestionInfo | undefined>;
}
