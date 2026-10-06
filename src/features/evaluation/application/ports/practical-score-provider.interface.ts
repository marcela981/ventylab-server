/*
 * Funcionalidad: Puerto IPracticalScoreProvider
 * Descripción: Define el contrato, el resultado y el token de inyección del proveedor del puntaje práctico de una sesión del simulador evaluada contra una rúbrica
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

export type PracticalScoreResult =
  | { available: true; score: number; breakdown: unknown[] }
  | { available: false; reason: string };

export const SESSION_NOT_FOUND_REASON: string = "SESSION_NOT_FOUND";
export const EMPTY_PARAMETERS_LOG_REASON: string = "EMPTY_PARAMETERS_LOG";
export const INVALID_LAST_COMMAND_REASON: string = "INVALID_LAST_COMMAND";
export const INVALID_RUBRIC_REASON: string = "INVALID_RUBRIC";

export const PRACTICAL_SCORE_PROVIDER_TOKEN: unique symbol = Symbol("PRACTICAL_SCORE_PROVIDER_TOKEN");

export interface IPracticalScoreProvider {
  getSessionScore(sessionId: string, rubric: unknown): Promise<PracticalScoreResult>;
}
