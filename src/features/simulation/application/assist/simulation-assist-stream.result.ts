/*
 * Funcionalidad: Resultado del stream de asistencia de simulación
 * Descripción: Eventos que produce la asistencia de IA de una sesión de simulación (fragmentos de texto y un evento final con el id del evento AI_HELP registrado, el id de la llamada de IA y su origen LLM o determinista)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiHelpSourceValue } from "@/features/simulation/domain/value-objects/simulation-session-values";

export interface SimulationAssistDeltaEvent {
  readonly type: "delta";
  readonly text: string;
}

export interface SimulationAssistDoneEvent {
  readonly type: "done";
  readonly aiHelpEventId: string;
  readonly aiCallId: string;
  readonly source: AiHelpSourceValue;
}

export type SimulationAssistEvent = SimulationAssistDeltaEvent | SimulationAssistDoneEvent;

export class SimulationAssistStreamResult {
  public readonly sessionId: string;
  public readonly events: AsyncIterable<SimulationAssistEvent>;

  public constructor({ sessionId, events }: { sessionId: string; events: AsyncIterable<SimulationAssistEvent> }) {
    this.sessionId = sessionId;
    this.events = events;
  }
}
