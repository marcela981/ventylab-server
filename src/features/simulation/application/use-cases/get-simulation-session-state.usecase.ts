/*
 * Funcionalidad: Caso de uso GetSimulationSessionStateUseCase
 * Descripción: Estado actual de una sesión legible por el actor: el servidor repite la simulación hasta el último evento aceptado y devuelve los ajustes vigentes, las métricas, las alarmas, el estado de los objetivos y el tiempo simulado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type SimulationSessionStateResult } from "@/features/simulation/application/results/simulation-session.results";
import { type SimulationActor } from "@/features/simulation/application/services/simulation-session-access.service";
import { SimulationSessionReader } from "@/features/simulation/application/services/simulation-session-reader.service";
import {
  type SimulationSessionContext,
  SimulationSessionRuntime,
} from "@/features/simulation/application/services/simulation-session-runtime.service";
import { type ReplayResult } from "@/features/simulation/domain/engine";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { settingsAfterEvents } from "@/features/simulation/domain/sessions/simulation-session-events";

/**
 * @throws {SimulationSessionNotFoundError} If the session does not exist
 * @throws {SimulationSessionAccessDeniedError} If the caller cannot read the session
 * @throws {SimulationCaseNotFoundError} If the session case no longer exists
 * @throws {SimulationCaseNotReadyError} If the session case can no longer be simulated
 * @throws {SimulationRubricInvalidError} If an expired exam session is ended with an invalid rubric
 */
@Injectable()
export class GetSimulationSessionStateUseCase {
  public constructor(
    private readonly _reader: SimulationSessionReader,
    private readonly _runtime: SimulationSessionRuntime,
  ) {}

  public async execute(sessionId: string, actor: SimulationActor): Promise<SimulationSessionStateResult> {
    const session: SimulationSession = await this._reader.loadReadable(sessionId, actor, new Date());
    const context: SimulationSessionContext = await this._runtime.loadContext(session);
    const result: ReplayResult = this._runtime.replay(context, session.lastSimTimeMs);

    return {
      session,
      expiresAt: await this._runtime.getExpiresAt(session),
      simTimeMs: result.final.simTimeMs,
      settings: settingsAfterEvents(context.caseDefinition.engineCase.initialSettings, context.events),
      metrics: result.final,
      alarms: result.final.alarms,
      targets: result.final.targets,
    };
  }
}
