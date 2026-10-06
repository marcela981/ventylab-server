/*
 * Funcionalidad: Telemetría del ventilador
 * Descripción: Define la lectura que se emite por `ventilator:data`, la alarma de `ventilator:alarm`, la muestra que se persiste en InfluxDB, los tipos y severidades de alarma, el estado de conexión del dispositivo y los identificadores de dispositivo por defecto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const DEFAULT_VENTILATOR_DEVICE_ID: string = "ventilab-device-001";
export const UNKNOWN_TELEMETRY_DEVICE_ID: string = "ventilab-device-unknown";

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

export type VentilatorStatusValue = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR" | "RESERVED";

export const DISCONNECTED_STATUS_VALUE: VentilatorStatusValue = "DISCONNECTED";
export const CONNECTING_STATUS_VALUE: VentilatorStatusValue = "CONNECTING";
export const CONNECTED_STATUS_VALUE: VentilatorStatusValue = "CONNECTED";
export const ERROR_STATUS_VALUE: VentilatorStatusValue = "ERROR";

export const ALARM_MESSAGES: Readonly<Record<string, string>> = {
  HIGH_PRESSURE: "High airway pressure detected",
  LOW_PRESSURE: "Low airway pressure detected",
  HIGH_VOLUME: "Tidal volume too high",
  LOW_VOLUME: "Tidal volume too low",
  APNEA: "Apnea detected – no breaths detected",
  DISCONNECTION: "Patient circuit disconnection detected",
  POWER_FAILURE: "Power failure detected",
  TECHNICAL_FAULT: "Technical fault – device malfunction",
};

export interface VentilatorReading {
  pressure: number;
  flow: number;
  volume: number;
  pco2?: number;
  spo2?: number;
  timestamp: number;
  deviceId: string;
}

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

export interface TelemetrySample {
  pressure: number;
  flow: number;
  volume: number;
  timestamp: number;
  deviceId: string;
  pco2?: number;
  spo2?: number;
}
