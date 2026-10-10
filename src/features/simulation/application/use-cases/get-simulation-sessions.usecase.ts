/*
 * Funcionalidad: Caso de uso GetSimulationSessionsUseCase
 * Descripción: Listado paginado de sesiones de simulación con eventos de un estudiante, filtrable por caso, modo y estado: las propias por defecto, o las de otro estudiante cuando el actor es administrador o docente que gestiona o supervisa su grupo; antes de consultar aplica las transiciones diferidas (ABANDONED por inactividad, fin por fecha límite del examen) a las sesiones activas del estudiante para no listar ACTIVE obsoletas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { type SimulationActor, SimulationSessionAccessService } from "@/features/simulation/application/services/simulation-session-access.service";
import { SimulationSessionRuntime } from "@/features/simulation/application/services/simulation-session-runtime.service";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import {
  type GetSimulationSessionsQuery,
  type ISimulationSessionsRepository,
  SIMULATION_SESSIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/simulation-sessions.repository";

/**
 * @throws {SimulationSessionAccessDeniedError} If the caller cannot read the sessions of the requested user
 */
@Injectable()
export class GetSimulationSessionsUseCase {
  public constructor(
    @Inject(SIMULATION_SESSIONS_REPOSITORY_TOKEN)
    private readonly _sessionsRepository: ISimulationSessionsRepository,
    private readonly _accessService: SimulationSessionAccessService,
    private readonly _runtime: SimulationSessionRuntime,
  ) {}

  public async execute(actor: SimulationActor, query: GetSimulationSessionsQuery): Promise<Paginated<SimulationSession>> {
    await this._accessService.assertCanReadSessionsOf(actor, query.userId);
    await this._runtime.settleActiveSessionsOf(query.userId, new Date());

    return await this._sessionsRepository.getAll(query);
  }
}
