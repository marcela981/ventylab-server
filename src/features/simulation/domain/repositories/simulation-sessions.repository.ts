/*
 * Funcionalidad: Repositorio de sesiones de simulación
 * Descripción: Contrato de persistencia de las sesiones de simulación con eventos y sus eventos: lectura con bloqueo de fila, guardado, lectura e inserción de eventos, dueños de ids de evento para la idempotencia, listado paginado con filtros y conteo por estado de las sesiones de un conjunto de usuarios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import {
  type SimulationEventRecord,
  type SimulationSessionStatusCount,
} from "@/features/simulation/domain/read-models/simulation-session.read-model";
import {
  type SimulationModeValue,
  type SimulationSessionStatusValue,
} from "@/features/simulation/domain/value-objects/simulation-session-values";

export const SIMULATION_SESSIONS_REPOSITORY_TOKEN: unique symbol = Symbol("SIMULATION_SESSIONS_REPOSITORY_TOKEN");

export interface GetSimulationSessionsQuery extends ListQuery {
  userId: string;
  caseId?: string;
  mode?: SimulationModeValue;
  status?: SimulationSessionStatusValue;
}

export interface ISimulationSessionsRepository {
  getById(id: string, transaction?: unknown): Promise<SimulationSession | undefined>;
  getByIdForUpdate(id: string, transaction: unknown): Promise<SimulationSession | undefined>;
  save(session: SimulationSession, transaction?: unknown): Promise<void>;
  getEvents(sessionId: string, transaction?: unknown): Promise<SimulationEventRecord[]>;
  getEventSessionIds(eventIds: readonly string[], transaction?: unknown): Promise<Map<string, string>>;
  insertEvents(events: readonly SimulationEventRecord[], transaction?: unknown): Promise<void>;
  getAll(query: GetSimulationSessionsQuery): Promise<Paginated<SimulationSession>>;
  countByStatusForUsers(userIds: readonly string[]): Promise<SimulationSessionStatusCount[]>;
}
