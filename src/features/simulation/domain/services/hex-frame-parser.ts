/*
 * Funcionalidad: Parser de tramas hexadecimales
 * Descripción: Valida y convierte tramas binarias del ventilador ([0xFF][TYPE][LENGTH][DATA][CHECKSUM], checksum XOR) en datos tipados de presión, flujo, volumen o alarma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  HEX_ALARM_MESSAGE,
  HEX_FLOW_MESSAGE,
  HEX_FRAME,
  HEX_PRESSURE_MESSAGE,
  HEX_VOLUME_MESSAGE,
  type HexAlarmData,
  type HexData,
  type HexFlowData,
  type HexPressureData,
  type HexVolumeData,
} from "@/features/simulation/domain/value-objects/hex-frame";
import { type AlarmSeverityValue, type AlarmTypeValue } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

export type HexWarningListener = (message: string) => void;

const ALARM_TYPE_BY_CODE: Readonly<Record<number, AlarmTypeValue>> = {
  0x01: "HIGH_PRESSURE",
  0x02: "LOW_PRESSURE",
  0x03: "HIGH_VOLUME",
  0x04: "LOW_VOLUME",
  0x05: "APNEA",
  0x06: "DISCONNECTION",
  0x07: "POWER_FAILURE",
  0x08: "TECHNICAL_FAULT",
};

const ALARM_SEVERITY_BY_CODE: Readonly<Record<number, AlarmSeverityValue>> = {
  0x01: "LOW",
  0x02: "MEDIUM",
  0x03: "HIGH",
  0x04: "CRITICAL",
};

const TELEMETRY_MESSAGE_TYPES: ReadonlySet<number> = new Set<number>([
  HEX_PRESSURE_MESSAGE,
  HEX_FLOW_MESSAGE,
  HEX_VOLUME_MESSAGE,
  HEX_ALARM_MESSAGE,
]);

export function calculateHexChecksum(buffer: Buffer): number {
  let checksum: number = 0;

  for (let i: number = 0; i < buffer.length - 1; i++) {
    checksum ^= buffer[i];
  }

  return checksum;
}

export function isValidHexFrame(buffer: Buffer, onWarning?: HexWarningListener): boolean {
  if (buffer.length < HEX_FRAME.MIN_LENGTH) return false;
  if (buffer.length > HEX_FRAME.MAX_LENGTH) return false;
  if (buffer[HEX_FRAME.POSITION.START] !== HEX_FRAME.START_BYTE) return false;

  const declaredLength: number = buffer[HEX_FRAME.POSITION.LENGTH];
  const expectedTotal: number = HEX_FRAME.POSITION.DATA_START + declaredLength + 1;

  if (buffer.length !== expectedTotal) return false;
  if (!TELEMETRY_MESSAGE_TYPES.has(buffer[HEX_FRAME.POSITION.TYPE])) return false;

  const expected: number = calculateHexChecksum(buffer);
  const received: number = buffer[buffer.length - 1];

  if (expected !== received) {
    onWarning?.(`Checksum mismatch — expected 0x${expected.toString(16)}, received 0x${received.toString(16)}`);

    return false;
  }

  return true;
}

export function parseHexFrame(buffer: Buffer, onWarning?: HexWarningListener): HexData | null {
  if (!isValidHexFrame(buffer, onWarning)) {
    return null;
  }

  const type: number = buffer[HEX_FRAME.POSITION.TYPE];
  const dataLength: number = buffer[HEX_FRAME.POSITION.LENGTH];
  const payload: Buffer = buffer.subarray(HEX_FRAME.POSITION.DATA_START, HEX_FRAME.POSITION.DATA_START + dataLength);

  switch (type) {
    case HEX_PRESSURE_MESSAGE:
      return parsePressure(payload);
    case HEX_FLOW_MESSAGE:
      return parseFlow(payload);
    case HEX_VOLUME_MESSAGE:
      return parseVolume(payload);
    case HEX_ALARM_MESSAGE:
      return parseAlarm(payload);
    default:
      onWarning?.(`Unknown message type: 0x${type.toString(16)}`);

      return null;
  }
}

function parsePressure(payload: Buffer): HexPressureData {
  const raw: number = payload.readUInt16BE(0);

  return { type: HEX_PRESSURE_MESSAGE, pressure: raw / 10, timestamp: Date.now() };
}

function parseFlow(payload: Buffer): HexFlowData {
  const raw: number = payload.readInt16BE(0);

  return { type: HEX_FLOW_MESSAGE, flow: raw / 10, timestamp: Date.now() };
}

function parseVolume(payload: Buffer): HexVolumeData {
  const raw: number = payload.readUInt16BE(0);

  return { type: HEX_VOLUME_MESSAGE, volume: raw, timestamp: Date.now() };
}

function parseAlarm(payload: Buffer): HexAlarmData {
  const alarmType: AlarmTypeValue = ALARM_TYPE_BY_CODE[payload[0]] ?? "TECHNICAL_FAULT";
  const severity: AlarmSeverityValue = ALARM_SEVERITY_BY_CODE[payload[1]] ?? "MEDIUM";

  return { type: HEX_ALARM_MESSAGE, alarmType, severity, timestamp: Date.now() };
}
