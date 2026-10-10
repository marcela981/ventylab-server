/*
 * Funcionalidad: Puerto ISimulationSessionBindingReader
 * Descripción: Define el contrato, el token de inyección y la regla de vinculación de una sesión de simulación con una respuesta de evaluación: la sesión debe ser del mismo estudiante, en modo EXAM y del mismo intento y pregunta antes de confiar en ella
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const SIMULATION_SESSION_BINDING_READER_TOKEN: unique symbol = Symbol("SIMULATION_SESSION_BINDING_READER_TOKEN");

export const EXAM_SESSION_MODE: string = "EXAM";

export interface SimulationSessionBinding {
  readonly sessionId: string;
  readonly userId: string;
  readonly mode: string;
  readonly attemptId?: string;
  readonly questionId?: string;
}

export interface SimulationAnswerTarget {
  readonly userId: string;
  readonly attemptId: string;
  readonly questionId: string;
}

export interface ISimulationSessionBindingReader {
  getSessionBinding(sessionId: string, userId: string): Promise<SimulationSessionBinding | undefined>;
}

export function isSessionBoundTo(binding: SimulationSessionBinding, target: SimulationAnswerTarget): boolean {
  return (
    binding.userId === target.userId &&
    binding.mode === EXAM_SESSION_MODE &&
    binding.attemptId === target.attemptId &&
    binding.questionId === target.questionId
  );
}
