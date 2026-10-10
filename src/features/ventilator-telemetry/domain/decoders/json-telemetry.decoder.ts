/*
 * Funcionalidad: Decodificador JSON de telemetría
 * Descripción: Estrategia que valida estrictamente una muestra JSON del ventilador (presión, flujo y volumen numéricos finitos; secuencia, marca de tiempo del dispositivo, modo, parámetros, alarmas, pCO2, SpO2 e identificador opcionales) y la convierte en una trama sin lanzar excepciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type DecodeResult,
  decodeFailure,
  INVALID_JSON_REASON,
  JSON_DECODER_NAME,
  type TelemetryDecoder,
  type TelemetryDecoderName,
} from "@/features/ventilator-telemetry/domain/decoders/telemetry-decoder";
import { type DecodedTelemetry } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";

// Legacy firmware sends `timestamp` either as epoch milliseconds or as uptime; only epoch values are device timestamps
const MIN_EPOCH_MS: number = 1_000_000_000_000;

type MutableDecodedTelemetry = { -readonly [K in keyof DecodedTelemetry]: DecodedTelemetry[K] };

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJsonObject(buffer: Buffer): Record<string, unknown> | string {
  let parsed: unknown;

  try {
    parsed = JSON.parse(buffer.toString("utf-8"));
  } catch {
    return INVALID_JSON_REASON;
  }

  return isRecord(parsed) ? parsed : "not_an_object";
}

export class JsonTelemetryDecoder implements TelemetryDecoder {
  public readonly name: TelemetryDecoderName = JSON_DECODER_NAME;

  public constructor(private readonly _defaultDeviceId: string) {}

  public decode(buffer: Buffer): DecodeResult {
    const parsed: Record<string, unknown> | string = parseJsonObject(buffer);

    if (typeof parsed === "string") {
      return decodeFailure(parsed);
    }

    return this.decodeObject(parsed);
  }

  public decodeObject(raw: Record<string, unknown>): DecodeResult {
    const { pressure, flow, volume } = raw;

    if (!isFiniteNumber(pressure) || !isFiniteNumber(flow) || !isFiniteNumber(volume)) {
      return decodeFailure("missing_fields");
    }

    const frame: MutableDecodedTelemetry = { pressure, flow, volume, deviceId: this._defaultDeviceId };
    const failure: string | undefined = JsonTelemetryDecoder._applyOptionalFields(frame, raw);

    return failure === undefined ? { ok: true, kind: "frame", frame } : decodeFailure(failure);
  }

  private static _applyOptionalFields(frame: MutableDecodedTelemetry, raw: Record<string, unknown>): string | undefined {
    if (raw.seq !== undefined) {
      if (!Number.isInteger(raw.seq) || (raw.seq as number) < 0) {
        return "invalid_seq";
      }

      frame.seq = raw.seq as number;
    }

    if (raw.deviceTs !== undefined) {
      if (!isFiniteNumber(raw.deviceTs)) {
        return "invalid_device_ts";
      }

      frame.deviceTs = raw.deviceTs;
    } else if (isFiniteNumber(raw.timestamp) && raw.timestamp > MIN_EPOCH_MS) {
      frame.deviceTs = raw.timestamp;
    }

    if (raw.mode !== undefined) {
      if (typeof raw.mode !== "string") {
        return "invalid_mode";
      }

      frame.mode = raw.mode;
    }

    if (raw.settings !== undefined) {
      if (!isRecord(raw.settings) || !Object.values(raw.settings).every(isFiniteNumber)) {
        return "invalid_settings";
      }

      frame.settings = raw.settings as Record<string, number>;
    }

    if (raw.alarms !== undefined) {
      if (!Array.isArray(raw.alarms) || !raw.alarms.every((alarm: unknown): boolean => typeof alarm === "string")) {
        return "invalid_alarms";
      }

      frame.alarms = raw.alarms as string[];
    }

    if (raw.pco2 !== undefined) {
      if (!isFiniteNumber(raw.pco2)) {
        return "invalid_pco2";
      }

      frame.pco2 = raw.pco2;
    }

    if (raw.spo2 !== undefined) {
      if (!isFiniteNumber(raw.spo2)) {
        return "invalid_spo2";
      }

      frame.spo2 = raw.spo2;
    }

    if (raw.deviceId !== undefined) {
      if (typeof raw.deviceId !== "string" || raw.deviceId.length === 0) {
        return "invalid_device_id";
      }

      frame.deviceId = raw.deviceId;
    }

    return undefined;
  }
}
