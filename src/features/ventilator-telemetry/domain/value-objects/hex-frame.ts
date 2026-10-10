/*
 * Funcionalidad: Trama hexadecimal de telemetría
 * Descripción: Disposición [0xFF][TIPO][LONGITUD][DATOS][XOR] y tipos de mensaje de presión, flujo, volumen y alarma que el ventilador físico puede enviar en binario, tomados del analizador hexadecimal existente (no hay especificación del firmware)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AlarmSeverityValue, type AlarmTypeValue } from "@/features/ventilator-telemetry/domain/value-objects/ventilator-alarm";

export type HexPressureMessage = 0xA1;
export type HexFlowMessage = 0xA2;
export type HexVolumeMessage = 0xA3;
export type HexAlarmMessage = 0xA4;

export const HEX_PRESSURE_MESSAGE: HexPressureMessage = 0xA1;
export const HEX_FLOW_MESSAGE: HexFlowMessage = 0xA2;
export const HEX_VOLUME_MESSAGE: HexVolumeMessage = 0xA3;
export const HEX_ALARM_MESSAGE: HexAlarmMessage = 0xA4;

export interface HexFramePositions {
  readonly START: number;
  readonly TYPE: number;
  readonly LENGTH: number;
  readonly DATA_START: number;
}

export interface HexFrameLayout {
  readonly START_BYTE: number;
  readonly MIN_LENGTH: number;
  readonly MAX_LENGTH: number;
  readonly POSITION: HexFramePositions;
}

export const HEX_FRAME: HexFrameLayout = {
  START_BYTE: 0xFF,
  MIN_LENGTH: 6,
  MAX_LENGTH: 256,
  POSITION: {
    START: 0,
    TYPE: 1,
    LENGTH: 2,
    DATA_START: 3,
  },
};

export interface HexPressureData {
  type: HexPressureMessage;
  pressure: number;
  timestamp: number;
}

export interface HexFlowData {
  type: HexFlowMessage;
  flow: number;
  timestamp: number;
}

export interface HexVolumeData {
  type: HexVolumeMessage;
  volume: number;
  timestamp: number;
}

export interface HexAlarmData {
  type: HexAlarmMessage;
  alarmType: AlarmTypeValue;
  severity: AlarmSeverityValue;
  timestamp: number;
}

export type HexData = HexPressureData | HexFlowData | HexVolumeData | HexAlarmData;
