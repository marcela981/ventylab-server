/*
 * Funcionalidad: Resultado del stream de asistencia de simulación
 * Descripción: Eventos que produce la asistencia de IA de una sesión de simulación (fragmentos de texto y un evento final con el id del evento AI_HELP registrado, el id de la llamada de IA y su origen LLM o determinista)
 * Versión: 1.1 (el evento final informa el estado analizado: tiempo simulado, gravedad y estado del paciente, y el aviso INCONSISTENT_STATE cuando la IA se reemplazó por la sugerencia determinista)
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiHelpSourceValue } from "@/features/simulation/domain/value-objects/simulation-session-values";

/** The state the answer analyzed, as the server rebuilt it (the console shows it as "Analizado en t = mm:ss") */
export interface SimulationHelpAnalysis {
  /** Simulation sessions: simulated time of the analyzed state */
  readonly simTimeMs?: number;
  /** Simulation sessions with patient evolution: severity 0..1 and status of the analyzed state */
  readonly severity?: number | null;
  readonly patientStatus?: string | null;
  /** Real mode: age of the latest telemetry frame when the help was asked, and whether it was stale (> 2 s) */
  readonly dataAgeMs?: number;
  readonly stale?: boolean;
}

export interface SimulationAssistDeltaEvent {
  readonly type: "delta";
  readonly text: string;
}

export interface SimulationAssistDoneEvent {
  readonly type: "done";
  readonly aiHelpEventId: string;
  readonly aiCallId: string;
  readonly source: AiHelpSourceValue;
  readonly analysis: SimulationHelpAnalysis;
  /** INCONSISTENT_STATE: the AI contradicted the current state twice and the deterministic suggestion was sent */
  readonly notice?: string;
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
