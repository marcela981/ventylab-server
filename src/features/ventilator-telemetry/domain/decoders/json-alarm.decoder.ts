/*
 * Funcionalidad: Decodificador de alarmas JSON
 * Descripción: Interpreta un objeto JSON con campo type recibido en el tópico de alarmas como VentilatorAlarm (tipo conocido, severidad, mensaje, valores, marca de tiempo y estado); devuelve undefined cuando el mensaje no es una alarma JSON para que el decodificador configurado lo procese
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { isFiniteNumber, parseJsonObject } from "@/features/ventilator-telemetry/domain/decoders/json-telemetry.decoder";
import { type DecodeResult, decodeFailure } from "@/features/ventilator-telemetry/domain/decoders/telemetry-decoder";
import {
  type AlarmSeverityValue,
  DEFAULT_ALARM_SEVERITY,
  defaultAlarmMessage,
  isAlarmSeverity,
  isAlarmType,
  type VentilatorAlarm,
} from "@/features/ventilator-telemetry/domain/value-objects/ventilator-alarm";

export function decodeJsonAlarm(buffer: Buffer, now: number): DecodeResult | undefined {
  const raw: Record<string, unknown> | string = parseJsonObject(buffer);

  if (typeof raw === "string" || raw.type === undefined) {
    return undefined;
  }

  if (!isAlarmType(raw.type)) {
    return decodeFailure("unknown_alarm_type");
  }

  if (raw.severity !== undefined && !isAlarmSeverity(raw.severity)) {
    return decodeFailure("invalid_alarm_severity");
  }

  const optionalNumbers: unknown[] = [raw.currentValue, raw.thresholdValue, raw.timestamp];

  if (optionalNumbers.some((value: unknown): boolean => value !== undefined && !isFiniteNumber(value))) {
    return decodeFailure("invalid_alarm_values");
  }

  const optionalFlags: unknown[] = [raw.active, raw.acknowledged];

  if (optionalFlags.some((value: unknown): boolean => value !== undefined && typeof value !== "boolean")) {
    return decodeFailure("invalid_alarm_flags");
  }

  if (raw.message !== undefined && typeof raw.message !== "string") {
    return decodeFailure("invalid_alarm_message");
  }

  const severity: AlarmSeverityValue = isAlarmSeverity(raw.severity) ? raw.severity : DEFAULT_ALARM_SEVERITY;

  const alarm: VentilatorAlarm = {
    type: raw.type,
    severity,
    message: typeof raw.message === "string" ? raw.message : defaultAlarmMessage(raw.type, severity),
    timestamp: isFiniteNumber(raw.timestamp) ? raw.timestamp : now,
    active: typeof raw.active === "boolean" ? raw.active : true,
    acknowledged: typeof raw.acknowledged === "boolean" ? raw.acknowledged : false,
  };

  if (isFiniteNumber(raw.currentValue)) {
    alarm.currentValue = raw.currentValue;
  }

  if (isFiniteNumber(raw.thresholdValue)) {
    alarm.thresholdValue = raw.thresholdValue;
  }

  return { ok: true, kind: "alarm", alarm };
}
