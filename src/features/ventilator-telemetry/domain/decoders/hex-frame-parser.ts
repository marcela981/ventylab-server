/*
 * Funcionalidad: Analizador de tramas hexadecimales
 * Descripción: Valida la trama [0xFF][TIPO][LONGITUD][DATOS][XOR] (longitud, byte de inicio, tipo y suma XOR) y extrae presión (décimas de cmH2O), flujo (décimas de L/min con signo), volumen (mL) o alarma (tipo y severidad); conserva la lógica del analizador hexadecimal existente
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
} from "@/features/ventilator-telemetry/domain/value-objects/hex-frame";
import {
  type AlarmSeverityValue,
  type AlarmTypeValue,
  DEFAULT_ALARM_SEVERITY,
  defaultAlarmMessage,
  type VentilatorAlarm,
} from "@/features/ventilator-telemetry/domain/value-objects/ventilator-alarm";

export type HexParseResult = { readonly ok: true; readonly data: HexData } | { readonly ok: false; readonly reason: string };

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

export function validateHexFrame(buffer: Buffer): string | undefined {
  if (buffer.length < HEX_FRAME.MIN_LENGTH) {
    return "hex_too_short";
  }

  if (buffer.length > HEX_FRAME.MAX_LENGTH) {
    return "hex_too_long";
  }

  if (buffer[HEX_FRAME.POSITION.START] !== HEX_FRAME.START_BYTE) {
    return "hex_bad_start_byte";
  }

  const declaredLength: number = buffer[HEX_FRAME.POSITION.LENGTH];

  if (buffer.length !== HEX_FRAME.POSITION.DATA_START + declaredLength + 1) {
    return "hex_length_mismatch";
  }

  if (!TELEMETRY_MESSAGE_TYPES.has(buffer[HEX_FRAME.POSITION.TYPE])) {
    return "hex_unknown_type";
  }

  if (calculateHexChecksum(buffer) !== buffer[buffer.length - 1]) {
    return "hex_checksum_mismatch";
  }

  return undefined;
}

export function parseHexFrame(buffer: Buffer, now: number): HexParseResult {
  const invalidReason: string | undefined = validateHexFrame(buffer);

  if (invalidReason !== undefined) {
    return { ok: false, reason: invalidReason };
  }

  const type: number = buffer[HEX_FRAME.POSITION.TYPE];
  const dataLength: number = buffer[HEX_FRAME.POSITION.LENGTH];
  const payload: Buffer = buffer.subarray(HEX_FRAME.POSITION.DATA_START, HEX_FRAME.POSITION.DATA_START + dataLength);

  if (type === HEX_PRESSURE_MESSAGE) {
    return { ok: true, data: parsePressure(payload, now) };
  }

  if (type === HEX_FLOW_MESSAGE) {
    return { ok: true, data: parseFlow(payload, now) };
  }

  if (type === HEX_VOLUME_MESSAGE) {
    return { ok: true, data: parseVolume(payload, now) };
  }

  return { ok: true, data: parseAlarm(payload, now) };
}

export function buildAlarmFromHexFrame(alarmData: HexAlarmData): VentilatorAlarm {
  return {
    type: alarmData.alarmType,
    severity: alarmData.severity,
    message: defaultAlarmMessage(alarmData.alarmType, alarmData.severity),
    timestamp: alarmData.timestamp,
    active: true,
    acknowledged: false,
  };
}

function parsePressure(payload: Buffer, now: number): HexPressureData {
  return { type: HEX_PRESSURE_MESSAGE, pressure: payload.readUInt16BE(0) / 10, timestamp: now };
}

function parseFlow(payload: Buffer, now: number): HexFlowData {
  return { type: HEX_FLOW_MESSAGE, flow: payload.readInt16BE(0) / 10, timestamp: now };
}

function parseVolume(payload: Buffer, now: number): HexVolumeData {
  return { type: HEX_VOLUME_MESSAGE, volume: payload.readUInt16BE(0), timestamp: now };
}

function parseAlarm(payload: Buffer, now: number): HexAlarmData {
  const alarmType: AlarmTypeValue = ALARM_TYPE_BY_CODE[payload[0]] ?? "TECHNICAL_FAULT";
  const severity: AlarmSeverityValue = ALARM_SEVERITY_BY_CODE[payload[1]] ?? DEFAULT_ALARM_SEVERITY;

  return { type: HEX_ALARM_MESSAGE, alarmType, severity, timestamp: now };
}
