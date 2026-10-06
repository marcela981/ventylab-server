/*
 * Funcionalidad: Caso de uso GetSimulatorSessionsUseCase
 * Descripción: Lista las sesiones del simulador del usuario autenticado, más recientes primero y con límite opcional
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type SimulatorSession } from "@/features/simulation/domain/entities/simulator-session.entity";
import {
  type ISimulatorSessionsRepository,
  SIMULATOR_SESSIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/simulator-sessions.repository";

@Injectable()
export class GetSimulatorSessionsUseCase {
  public constructor(
    @Inject(SIMULATOR_SESSIONS_REPOSITORY_TOKEN)
    private readonly _sessionsRepository: ISimulatorSessionsRepository,
  ) {}

  public async execute(userId: string, limit?: number): Promise<SimulatorSession[]> {
    return await this._sessionsRepository.getByUser(userId, limit);
  }
}
