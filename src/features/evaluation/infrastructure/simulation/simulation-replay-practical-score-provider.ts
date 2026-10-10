/*
 * Funcionalidad: Proveedor de puntaje práctico por repetición de la simulación
 * Descripción: Implementa IPracticalScoreProvider con SimulationFacade: verifica que la sesión sea del mismo estudiante, en modo EXAM y del mismo intento y pregunta de la respuesta, y devuelve la calificación recalculada siempre en el servidor repitiendo la sesión con el motor (hasta su último evento si aún no terminó) junto con su desglose; nunca usa un puntaje enviado por el cliente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type IPracticalScoreProvider,
  type PracticalScoreResult,
  SESSION_NOT_BOUND_REASON,
  SESSION_NOT_FOUND_REASON,
} from "@/features/evaluation/application/ports/practical-score-provider.interface";
import {
  type ISimulationSessionBindingReader,
  isSessionBoundTo,
  SIMULATION_SESSION_BINDING_READER_TOKEN,
  type SimulationAnswerTarget,
  type SimulationSessionBinding,
} from "@/features/evaluation/application/ports/simulation-session-binding.interface";
import { SimulationFacade } from "@/features/simulation/application/services/simulation.facade";

type SimulationScoreOutcome = Awaited<ReturnType<SimulationFacade["getSessionScore"]>>;

@Injectable()
export class SimulationReplayPracticalScoreProvider implements IPracticalScoreProvider {
  public constructor(
    private readonly _simulationFacade: SimulationFacade,
    @Inject(SIMULATION_SESSION_BINDING_READER_TOKEN)
    private readonly _bindingReader: ISimulationSessionBindingReader,
  ) {}

  public async getSessionScore(sessionId: string, rubric: unknown, target: SimulationAnswerTarget): Promise<PracticalScoreResult> {
    const binding: SimulationSessionBinding | undefined = await this._bindingReader.getSessionBinding(sessionId, target.userId);

    if (!binding) {
      return { available: false, reason: SESSION_NOT_FOUND_REASON };
    }

    if (!isSessionBoundTo(binding, target)) {
      return { available: false, reason: SESSION_NOT_BOUND_REASON };
    }

    const outcome: SimulationScoreOutcome = await this._simulationFacade.getSessionScore(sessionId, rubric);

    if (!outcome.available) {
      return { available: false, reason: outcome.reason };
    }

    return { available: true, score: outcome.score, breakdown: [...outcome.breakdown] };
  }
}
