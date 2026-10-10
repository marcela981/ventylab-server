/*
 * Funcionalidad: Caso de uso GetSimulationSessionSummaryUseCase
 * Descripción: Resumen calificado de una sesión legible por el actor: el resumen guardado al terminar o, si la sesión sigue activa o fue abandonada, uno calculado en el servidor repitiendo la simulación hasta el último evento aceptado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type SimulationSessionSummaryResult } from "@/features/simulation/application/results/simulation-session.results";
import { type SimulationActor } from "@/features/simulation/application/services/simulation-session-access.service";
import { SimulationSessionReader } from "@/features/simulation/application/services/simulation-session-reader.service";
import { SimulationSessionRuntime } from "@/features/simulation/application/services/simulation-session-runtime.service";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";

/**
 * @throws {SimulationSessionNotFoundError} If the session does not exist
 * @throws {SimulationSessionAccessDeniedError} If the caller cannot read the session
 * @throws {SimulationCaseNotFoundError} If the session case no longer exists
 * @throws {SimulationCaseNotReadyError} If the session case can no longer be simulated
 * @throws {SimulationRubricInvalidError} If the session rubric is invalid
 */
@Injectable()
export class GetSimulationSessionSummaryUseCase {
  public constructor(
    private readonly _reader: SimulationSessionReader,
    private readonly _runtime: SimulationSessionRuntime,
  ) {}

  public async execute(sessionId: string, actor: SimulationActor): Promise<SimulationSessionSummaryResult> {
    const now: Date = new Date();
    const session: SimulationSession = await this._reader.loadReadable(sessionId, actor, now);

    if (session.summary) {
      return { session, summary: session.summary };
    }

    return {
      session,
      summary: await this._runtime.computeSummary(await this._runtime.loadContext(session), session.lastSimTimeMs, session.endedAt ?? now),
    };
  }
}
