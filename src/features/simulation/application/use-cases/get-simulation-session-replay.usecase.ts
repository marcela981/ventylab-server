/*
 * Funcionalidad: Caso de uso GetSimulationSessionReplayUseCase
 * Descripción: Datos para repetir una sesión legible por el actor: caso del motor, semilla, eventos persistidos, versión del motor y multiplicador de la sesión, junto con la versión actual del motor y si ambas difieren
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type SimulationSessionReplayResult } from "@/features/simulation/application/results/simulation-session.results";
import { type SimulationActor } from "@/features/simulation/application/services/simulation-session-access.service";
import { SimulationSessionReader } from "@/features/simulation/application/services/simulation-session-reader.service";
import {
  type SimulationSessionContext,
  SimulationSessionRuntime,
} from "@/features/simulation/application/services/simulation-session-runtime.service";
import { ENGINE_VERSION } from "@/features/simulation/domain/engine";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";

/**
 * @throws {SimulationSessionNotFoundError} If the session does not exist
 * @throws {SimulationSessionAccessDeniedError} If the caller cannot read the session
 * @throws {SimulationCaseNotFoundError} If the session case no longer exists
 * @throws {SimulationCaseNotReadyError} If the session case can no longer be simulated
 * @throws {SimulationRubricInvalidError} If an expired exam session is ended with an invalid rubric
 */
@Injectable()
export class GetSimulationSessionReplayUseCase {
  public constructor(
    private readonly _reader: SimulationSessionReader,
    private readonly _runtime: SimulationSessionRuntime,
  ) {}

  public async execute(sessionId: string, actor: SimulationActor): Promise<SimulationSessionReplayResult> {
    const session: SimulationSession = await this._reader.loadReadable(sessionId, actor, new Date());
    const context: SimulationSessionContext = await this._runtime.loadContext(session);

    return {
      session,
      engineCase: context.caseDefinition.engineCase,
      events: context.events,
      currentEngineVersion: ENGINE_VERSION,
      engineVersionMismatch: session.engineVersion !== ENGINE_VERSION,
    };
  }
}
