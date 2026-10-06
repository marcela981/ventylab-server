/*
 * Funcionalidad: Repositorio de sesiones del simulador
 * Descripción: Contrato de persistencia del agregado SimulatorSession: sesiones de un usuario (más recientes primero, con límite opcional) y guardado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type SimulatorSession } from "@/features/simulation/domain/entities/simulator-session.entity";

export const SIMULATOR_SESSIONS_REPOSITORY_TOKEN: unique symbol = Symbol("SIMULATOR_SESSIONS_REPOSITORY_TOKEN");

export interface ISimulatorSessionsRepository {
  getByUser(userId: string, limit?: number): Promise<SimulatorSession[]>;
  save(session: SimulatorSession, transaction?: unknown): Promise<void>;
}
