/*
 * Funcionalidad: Puerto ISimulationSessionOwnership
 * Descripción: Contrato y token de inyección para consultar el propietario de una sesión del simulador, con el que el autoguardado verifica que la sesión de una pregunta SIMULATION pertenece al estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const SIMULATION_SESSION_OWNERSHIP_TOKEN: unique symbol = Symbol("SIMULATION_SESSION_OWNERSHIP_TOKEN");

export interface ISimulationSessionOwnership {
  getSessionOwnerId(sessionId: string): Promise<string | undefined>;
}
