/*
 * Funcionalidad: Trama hexadecimal del ventilador
 * Descripción: Define los códigos de tipo de mensaje, la estructura de la trama [START][TYPE][LENGTH][DATA][CHECKSUM] y los datos tipados que produce el parser (presión, flujo, volumen y alarma)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AlarmSeverityValue, type AlarmTypeValue } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

export type HexPressureMessage = 0xA1;
export type HexFlowMessage = 0xA2;
export type HexVolumeMessage = 0xA3;
export type HexAlarmMessage = 0xA4;
export type HexCommandMessage = 0xB1;
export type HexAckMessage = 0xB2;

export const HEX_PRESSURE_MESSAGE: HexPressureMessage = 0xA1;
export const HEX_FLOW_MESSAGE: HexFlowMessage = 0xA2;
export const HEX_VOLUME_MESSAGE: HexVolumeMessage = 0xA3;
export const HEX_ALARM_MESSAGE: HexAlarmMessage = 0xA4;
export const HEX_COMMAND_MESSAGE: HexCommandMessage = 0xB1;
export const HEX_ACK_MESSAGE: HexAckMessage = 0xB2;

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
