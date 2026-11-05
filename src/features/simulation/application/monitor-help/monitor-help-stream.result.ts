/*
 * Funcionalidad: Eventos de la ayuda del monitor (alarmas y asistencia en modo real)
 * Descripción: Unión de eventos que transmiten por SSE la ayuda de alarmas "¿Cómo estabilizar?" y la asistencia en modo real: primero las reglas deterministas (solo en la ayuda de alarmas), luego los fragmentos de la respuesta de IA o del respaldo determinista y al final el cierre con el aiCallId, el origen y, en simulación, el evento AI_HELP
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type StabilizationRule } from "@/features/simulation/domain/assist/alarm-stabilization-rules";
import { type AiHelpSourceValue } from "@/features/simulation/domain/value-objects/simulation-session-values";

export interface MonitorHelpRulesEvent {
  readonly type: "rules";
  readonly alarmCode: string;
  readonly rules: readonly StabilizationRule[];
}

export interface MonitorHelpDeltaEvent {
  readonly type: "delta";
  readonly text: string;
}

export interface MonitorHelpDoneEvent {
  readonly type: "done";
  readonly aiCallId: string;
  readonly source: AiHelpSourceValue;
  /** Simulation sessions only: the AI_HELP event recorded for the answer */
  readonly aiHelpEventId?: string;
}

export type MonitorHelpEvent = MonitorHelpRulesEvent | MonitorHelpDeltaEvent | MonitorHelpDoneEvent;
