/*
 * Funcionalidad: Lector de sesiones de simulación
 * Descripción: Carga una sesión de simulación para lectura: la sesión debe existir, el actor debe ser su dueño o poder leer las sesiones del dueño, y se aplican las transiciones diferidas (examen vencido, abandono) antes de responder
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type SimulationActor, SimulationSessionAccessService } from "@/features/simulation/application/services/simulation-session-access.service";
import { SimulationSessionRuntime } from "@/features/simulation/application/services/simulation-session-runtime.service";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";

@Injectable()
export class SimulationSessionReader {
  public constructor(
    private readonly _runtime: SimulationSessionRuntime,
    private readonly _accessService: SimulationSessionAccessService,
  ) {}

  public async loadReadable(sessionId: string, actor: SimulationActor, now: Date): Promise<SimulationSession> {
    const session: SimulationSession = await this._runtime.getSession(sessionId);

    await this._accessService.assertCanReadSessionsOf(actor, session.userId);

    return await this._runtime.settleIfNeeded(session, now);
  }
}
