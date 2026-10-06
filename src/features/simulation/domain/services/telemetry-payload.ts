/*
 * Funcionalidad: Interpretación de telemetría JSON
 * Descripción: Convierte los mensajes MQTT JSON del ventilador en la lectura que se emite por WebSocket y en la muestra normalizada que se guarda en InfluxDB, y arma la alarma a partir de una trama hexadecimal de alarma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type HexAlarmData } from "@/features/simulation/domain/value-objects/hex-frame";
import {
  ALARM_MESSAGES,
  type TelemetrySample,
  UNKNOWN_TELEMETRY_DEVICE_ID,
  type VentilatorAlarm,
  type VentilatorReading,
} from "@/features/simulation/domain/value-objects/ventilator-telemetry";

const MIN_EPOCH_MS: number = 1_000_000_000_000;

export type TelemetryParseResult<T> =
  | { kind: "parsed"; value: T }
  | { kind: "invalid_json"; error: string }
  | { kind: "missing_fields" };

interface RawTelemetry {
  pressure: number;
  flow: number;
  volume: number;
  timestamp?: unknown;
  deviceId?: unknown;
  pco2?: unknown;
  spo2?: unknown;
}

export function parseTelemetryReading(raw: Buffer, defaultDeviceId: string, now: number): TelemetryParseResult<VentilatorReading> {
  const decoded: TelemetryParseResult<RawTelemetry> = decodeTelemetry(raw);

  if (decoded.kind !== "parsed") {
    return decoded;
  }

  const telemetry: RawTelemetry = decoded.value;

  const reading: VentilatorReading = {
    pressure: telemetry.pressure,
    flow: telemetry.flow,
    volume: telemetry.volume,
    ...(telemetry.pco2 !== undefined ? { pco2: telemetry.pco2 as number } : {}),
    ...(telemetry.spo2 !== undefined ? { spo2: telemetry.spo2 as number } : {}),
    timestamp: (telemetry.timestamp as number | undefined) ?? now,
    deviceId: (telemetry.deviceId as string | undefined) ?? defaultDeviceId,
  };

  return { kind: "parsed", value: reading };
}

export function normalizeTelemetrySample(raw: Buffer, now: number): TelemetryParseResult<TelemetrySample> {
  const decoded: TelemetryParseResult<RawTelemetry> = decodeTelemetry(raw);

  if (decoded.kind !== "parsed") {
    return decoded;
  }

  const telemetry: RawTelemetry = decoded.value;
  const timestampLooksValid: boolean = typeof telemetry.timestamp === "number" && telemetry.timestamp > MIN_EPOCH_MS;

  const sample: TelemetrySample = {
    pressure: telemetry.pressure,
    flow: telemetry.flow,
    volume: telemetry.volume,
    timestamp: timestampLooksValid ? (telemetry.timestamp as number) : now,
    deviceId: typeof telemetry.deviceId === "string" && telemetry.deviceId.length > 0
      ? telemetry.deviceId
      : UNKNOWN_TELEMETRY_DEVICE_ID,
    ...(typeof telemetry.pco2 === "number" ? { pco2: telemetry.pco2 } : {}),
    ...(typeof telemetry.spo2 === "number" ? { spo2: telemetry.spo2 } : {}),
  };

  return { kind: "parsed", value: sample };
}

export function buildAlarmFromHexFrame(alarmData: HexAlarmData): VentilatorAlarm {
  return {
    type: alarmData.alarmType,
    severity: alarmData.severity,
    message: `[${alarmData.severity}] ${ALARM_MESSAGES[alarmData.alarmType] ?? "Unknown alarm"}`,
    timestamp: alarmData.timestamp,
    active: true,
    acknowledged: false,
  };
}

function decodeTelemetry(raw: Buffer): TelemetryParseResult<RawTelemetry> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw.toString("utf-8"));
  } catch (error) {
    return { kind: "invalid_json", error: error instanceof Error ? error.message : String(error) };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as RawTelemetry).pressure !== "number" ||
    typeof (parsed as RawTelemetry).flow !== "number" ||
    typeof (parsed as RawTelemetry).volume !== "number"
  ) {
    return { kind: "missing_fields" };
  }

  return { kind: "parsed", value: parsed as RawTelemetry };
}
