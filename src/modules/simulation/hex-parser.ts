/**
 * @module HexParser
 * @description Parser de tramas hexadecimales del ventilador.
 * Implementa la interfaz IHexParser definida en los contratos.
 *
 * Convierte buffers binarios recibidos via MQTT en objetos tipados
 * (presión, flujo, volumen, alarmas) según la especificación de trama:
 *
 *   [START=0xFF] [TYPE] [LENGTH] [DATA...] [CHECKSUM]
 *
 * Tipos de mensaje:
 * - 0xA1 → Presión (cmH₂O), uint16 BE, unidad × 10
 * - 0xA2 → Flujo (L/min),   int16  BE, unidad × 10
 * - 0xA3 → Volumen (ml),    uint16 BE, unidad directa
 * - 0xA4 → Alarma,          byte[alarm_type, severity]
 *
 * Checksum: XOR de todos los bytes del frame excepto el último.
 */

import type {
  IHexParser,
  HexData,
  HexPressureData,
  HexFlowData,
  HexVolumeData,
  HexAlarmData,
} from '../../../contracts/simulation.contracts';
import {
  HexMessageType,
  HEX_FRAME,
  AlarmType,
  AlarmSeverity,
} from '../../../contracts/simulation.contracts';

/** Byte codes used in the wire frame to identify alarm types. */
const ALARM_TYPE_MAP: Record<number, AlarmType> = {
  0x01: AlarmType.HIGH_PRESSURE,
  0x02: AlarmType.LOW_PRESSURE,
  0x03: AlarmType.HIGH_VOLUME,
  0x04: AlarmType.LOW_VOLUME,
  0x05: AlarmType.APNEA,
  0x06: AlarmType.DISCONNECTION,
  0x07: AlarmType.POWER_FAILURE,
  0x08: AlarmType.TECHNICAL_FAULT,
};

/** Byte codes used in the wire frame to identify alarm severity. */
const ALARM_SEVERITY_MAP: Record<number, AlarmSeverity> = {
  0x01: AlarmSeverity.LOW,
  0x02: AlarmSeverity.MEDIUM,
  0x03: AlarmSeverity.HIGH,
  0x04: AlarmSeverity.CRITICAL,
};

/** Telemetry message types the parser handles (excludes COMMAND/ACK). */
const VALID_TYPES = new Set<number>([
  HexMessageType.PRESSURE,
  HexMessageType.FLOW,
  HexMessageType.VOLUME,
  HexMessageType.ALARM,
]);

export class HexParser implements IHexParser {
  // ---------------------------------------------------------------------------
  // IHexParser implementation
  // ---------------------------------------------------------------------------

  /**
   * Parsea un buffer hexadecimal a un objeto de datos tipado.
   * @param buffer - Buffer crudo recibido desde MQTT
   * @returns Objeto HexData tipado, o null si el buffer es inválido
   */
  parse(buffer: Buffer): HexData | null {
    if (!this.validate(buffer)) return null;

    const type = buffer[HEX_FRAME.POSITION.TYPE];
    const dataLength = buffer[HEX_FRAME.POSITION.LENGTH];
    const payload = buffer.subarray(
      HEX_FRAME.POSITION.DATA_START,
      HEX_FRAME.POSITION.DATA_START + dataLength,
    );

    switch (type) {
      case HexMessageType.PRESSURE:
        return this.parsePressure(payload);
      case HexMessageType.FLOW:
        return this.parseFlow(payload);
      case HexMessageType.VOLUME:
        return this.parseVolume(payload);
      case HexMessageType.ALARM:
        return this.parseAlarm(payload);
      default:
        console.warn('[HexParser] Unknown message type:', `0x${type.toString(16)}`);
        return null;
    }
  }

  /**
   * Valida el formato estructural de un buffer hexadecimal.
   *
   * Checks (in order):
   * 1. Length within [MIN_LENGTH, MAX_LENGTH]
   * 2. START_BYTE at position 0
   * 3. Declared LENGTH matches actual payload size
   * 4. TYPE is a known telemetry type
   * 5. Checksum is correct
   *
   * @param buffer - Buffer a validar
   * @returns true si el formato es correcto
   */
  validate(buffer: Buffer): boolean {
    if (buffer.length < HEX_FRAME.MIN_LENGTH) return false;
    if (buffer.length > HEX_FRAME.MAX_LENGTH) return false;

    if (buffer[HEX_FRAME.POSITION.START] !== HEX_FRAME.START_BYTE) return false;

    // Total frame = DATA_START (3) + declared_length + checksum (1)
    const declaredLength = buffer[HEX_FRAME.POSITION.LENGTH];
    const expectedTotal = HEX_FRAME.POSITION.DATA_START + declaredLength + 1;
    if (buffer.length !== expectedTotal) return false;

    if (!VALID_TYPES.has(buffer[HEX_FRAME.POSITION.TYPE])) return false;

    const expected = this.calculateChecksum(buffer);
    const received = buffer[buffer.length - 1];
    if (expected !== received) {
      console.warn(
        `[HexParser] Checksum mismatch — expected 0x${expected.toString(16)}, received 0x${received.toString(16)}`,
      );
      return false;
    }

    return true;
  }

  /**
   * Calcula el checksum de un buffer.
   * Algoritmo: XOR de todos los bytes excepto el último.
   * @param buffer - Buffer completo (incluyendo o excluyendo checksum)
   * @returns Valor del checksum calculado
   */
  calculateChecksum(buffer: Buffer): number {
    let checksum = 0;
    for (let i = 0; i < buffer.length - 1; i++) {
      checksum ^= buffer[i];
    }
    return checksum;
  }

  // ---------------------------------------------------------------------------
  // Private parsers por tipo de mensaje
  // ---------------------------------------------------------------------------

  /**
   * Parsea payload de presión.
   * Encoding: uint16 BE, valor = presión_cmH₂O × 10
   */
  private parsePressure(payload: Buffer): HexPressureData {
    const raw = payload.readUInt16BE(0);
    return {
      type: HexMessageType.PRESSURE,
      pressure: raw / 10,
      timestamp: Date.now(),
    };
  }

  /**
   * Parsea payload de flujo.
   * Encoding: int16 BE (signed), valor = flujo_L/min × 10
   */
  private parseFlow(payload: Buffer): HexFlowData {
    const raw = payload.readInt16BE(0);
    return {
      type: HexMessageType.FLOW,
      flow: raw / 10,
      timestamp: Date.now(),
    };
  }

  /**
   * Parsea payload de volumen.
   * Encoding: uint16 BE, valor en ml (sin escala)
   */
  private parseVolume(payload: Buffer): HexVolumeData {
    const raw = payload.readUInt16BE(0);
    return {
      type: HexMessageType.VOLUME,
      volume: raw,
      timestamp: Date.now(),
    };
  }

  /**
   * Parsea payload de alarma.
   * Encoding: byte[0] = alarm type code, byte[1] = severity code
   */
  private parseAlarm(payload: Buffer): HexAlarmData {
    const alarmType =
      ALARM_TYPE_MAP[payload[0]] ?? AlarmType.TECHNICAL_FAULT;
    const severity =
      ALARM_SEVERITY_MAP[payload[1]] ?? AlarmSeverity.MEDIUM;

    return {
      type: HexMessageType.ALARM,
      alarmType,
      severity,
      timestamp: Date.now(),
    };
  }
}
