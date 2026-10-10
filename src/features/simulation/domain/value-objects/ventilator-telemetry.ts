/*
 * Funcionalidad: Telemetría del ventilador
 * Descripción: Define la lectura que se emite por `ventilator:data`, la alarma de `ventilator:alarm` que devuelve el estado del ventilador, los tipos y severidades de alarma y el estado de conexión del dispositivo
 * Versión: 1.1
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

export type VentilatorStatusValue = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR" | "RESERVED";

export const DISCONNECTED_STATUS_VALUE: VentilatorStatusValue = "DISCONNECTED";
export const CONNECTED_STATUS_VALUE: VentilatorStatusValue = "CONNECTED";

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
