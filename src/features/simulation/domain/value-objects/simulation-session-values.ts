/*
 * Funcionalidad: Valores de las sesiones de simulación
 * Descripción: Constantes y tipos de los modos (FREE, EXAM), estados (ACTIVE, ENDED, ABANDONED), tipos de evento, multiplicadores de tiempo y códigos de alarma reconocibles de las sesiones de simulación con eventos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AlarmCode, type TimeMultiplier } from "@/features/simulation/domain/engine";

export type SimulationModeValue = "FREE" | "EXAM";

export const FREE_SIMULATION_MODE: SimulationModeValue = "FREE";
export const EXAM_SIMULATION_MODE: SimulationModeValue = "EXAM";

export const SIMULATION_MODE_VALUES: readonly SimulationModeValue[] = [FREE_SIMULATION_MODE, EXAM_SIMULATION_MODE] as const;

export type SimulationSessionStatusValue = "ACTIVE" | "ENDED" | "ABANDONED";

export const ACTIVE_SIMULATION_STATUS: SimulationSessionStatusValue = "ACTIVE";
export const ENDED_SIMULATION_STATUS: SimulationSessionStatusValue = "ENDED";
export const ABANDONED_SIMULATION_STATUS: SimulationSessionStatusValue = "ABANDONED";

export const SIMULATION_SESSION_STATUS_VALUES: readonly SimulationSessionStatusValue[] = [
  ACTIVE_SIMULATION_STATUS,
  ENDED_SIMULATION_STATUS,
  ABANDONED_SIMULATION_STATUS,
] as const;

export type SimulationEventTypeValue = "PARAM_CHANGE" | "AI_HELP" | "CASE_EVENT" | "ALARM_ACK" | "START" | "END";

export const PARAM_CHANGE_EVENT_TYPE: SimulationEventTypeValue = "PARAM_CHANGE";
export const AI_HELP_EVENT_TYPE: SimulationEventTypeValue = "AI_HELP";
export const ALARM_ACK_EVENT_TYPE: SimulationEventTypeValue = "ALARM_ACK";
export const START_EVENT_TYPE: SimulationEventTypeValue = "START";
export const END_EVENT_TYPE: SimulationEventTypeValue = "END";

export type ClientSimulationEventTypeValue = "PARAM_CHANGE" | "ALARM_ACK";

export const CLIENT_SIMULATION_EVENT_TYPE_VALUES: readonly ClientSimulationEventTypeValue[] = ["PARAM_CHANGE", "ALARM_ACK"] as const;

export const TIME_MULTIPLIER_VALUES: readonly TimeMultiplier[] = [1, 2, 4] as const;

export const ALARM_CODE_VALUES: readonly AlarmCode[] = [
  "HIGH_PRESSURE",
  "LOW_TIDAL_VOLUME",
  "HIGH_TIDAL_VOLUME",
  "APNEA",
  "HIGH_RESPIRATORY_RATE",
  "AUTO_PEEP",
  "DISCONNECTION",
] as const;

export type AiHelpSourceValue = "LLM" | "DETERMINISTIC";

export const AI_HELP_SOURCE_VALUES: readonly AiHelpSourceValue[] = ["LLM", "DETERMINISTIC"] as const;

export function isTimeMultiplier(value: number): value is TimeMultiplier {
  return TIME_MULTIPLIER_VALUES.some((candidate: TimeMultiplier): boolean => candidate === value);
}
