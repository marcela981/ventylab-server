/*
 * Funcionalidad: Lector de vinculación de sesiones de simulación
 * Descripción: Implementa ISimulationSessionBindingReader con SimulationFacade: busca la sesión con eventos entre las del estudiante indicado (filtro por id) y devuelve su dueño, modo, intento y pregunta; una sesión inexistente o de otro estudiante se reporta como no encontrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import {
  type ISimulationSessionBindingReader,
  type SimulationSessionBinding,
} from "@/features/evaluation/application/ports/simulation-session-binding.interface";
import { SimulationFacade } from "@/features/simulation/application/services/simulation.facade";

type SimulationSessionsPage = Awaited<ReturnType<SimulationFacade["getUserSessions"]>>;
type SimulationSessionViewItem = SimulationSessionsPage["data"][number];

@Injectable()
export class SimulationFacadeSessionBindingReader implements ISimulationSessionBindingReader {
  public constructor(private readonly _simulationFacade: SimulationFacade) {}

  public async getSessionBinding(sessionId: string, userId: string): Promise<SimulationSessionBinding | undefined> {
    const page: SimulationSessionsPage = await this._simulationFacade.getUserSessions(userId, { page: 1, limit: 1, ids: [sessionId] });
    const view: SimulationSessionViewItem | undefined = page.data.find((item: SimulationSessionViewItem): boolean => item.id === sessionId);

    if (!view) {
      return undefined;
    }

    return { sessionId: view.id, userId: view.userId, mode: view.mode, attemptId: view.attemptId, questionId: view.questionId };
  }
}
