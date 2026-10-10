/*
 * Funcionalidad: Alarma del ventilador
 * Descripción: Tipos, severidades, mensajes por defecto y forma VentilatorAlarm del evento ventilator:alarm emitido a partir de las alarmas del ventilador físico (JSON o trama hexadecimal)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type AlarmTypeValue =
  | "HIGH_PRESSURE"
  | "LOW_PRESSURE"
  | "HIGH_VOLUME"
  | "LOW_VOLUME"
  | "APNEA"
  | "DISCONNECTION"
  | "POWER_FAILURE"
  | "TECHNICAL_FAULT";

export type AlarmSeverityValue = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const ALARM_TYPE_VALUES: readonly AlarmTypeValue[] = [
  "HIGH_PRESSURE",
  "LOW_PRESSURE",
  "HIGH_VOLUME",
  "LOW_VOLUME",
  "APNEA",
  "DISCONNECTION",
  "POWER_FAILURE",
  "TECHNICAL_FAULT",
] as const;

export const ALARM_SEVERITY_VALUES: readonly AlarmSeverityValue[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const DEFAULT_ALARM_SEVERITY: AlarmSeverityValue = "MEDIUM";

export const ALARM_MESSAGES: Readonly<Record<AlarmTypeValue, string>> = {
  HIGH_PRESSURE: "High airway pressure detected",
  LOW_PRESSURE: "Low airway pressure detected",
  HIGH_VOLUME: "Tidal volume too high",
  LOW_VOLUME: "Tidal volume too low",
  APNEA: "Apnea detected – no breaths detected",
  DISCONNECTION: "Patient circuit disconnection detected",
  POWER_FAILURE: "Power failure detected",
  TECHNICAL_FAULT: "Technical fault – device malfunction",
};

export interface VentilatorAlarm {
  type: AlarmTypeValue;
  severity: AlarmSeverityValue;
  message: string;
  currentValue?: number;
  thresholdValue?: number;
  timestamp: number;
  active: boolean;
  acknowledged: boolean;
}

export function defaultAlarmMessage(type: AlarmTypeValue, severity: AlarmSeverityValue): string {
  return `[${severity}] ${ALARM_MESSAGES[type]}`;
}

export function isAlarmType(value: unknown): value is AlarmTypeValue {
  return typeof value === "string" && ALARM_TYPE_VALUES.includes(value as AlarmTypeValue);
}

export function isAlarmSeverity(value: unknown): value is AlarmSeverityValue {
  return typeof value === "string" && ALARM_SEVERITY_VALUES.includes(value as AlarmSeverityValue);
}
