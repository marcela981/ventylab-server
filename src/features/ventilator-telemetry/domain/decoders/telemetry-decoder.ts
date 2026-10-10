/*
 * Funcionalidad: Decodificador de telemetría
 * Descripción: Contrato Strategy TelemetryDecoder (json, hex, auto) que convierte un mensaje MQTT en una trama de telemetría o una alarma, o informa el motivo por el que se descarta sin lanzar excepciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type DecodedTelemetry } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";
import { type VentilatorAlarm } from "@/features/ventilator-telemetry/domain/value-objects/ventilator-alarm";

export type TelemetryDecoderName = "auto" | "json" | "hex";

export const AUTO_DECODER_NAME: TelemetryDecoderName = "auto";
export const JSON_DECODER_NAME: TelemetryDecoderName = "json";
export const HEX_DECODER_NAME: TelemetryDecoderName = "hex";

export const TELEMETRY_DECODER_NAMES: readonly TelemetryDecoderName[] = [AUTO_DECODER_NAME, JSON_DECODER_NAME, HEX_DECODER_NAME] as const;

export const INVALID_JSON_REASON: string = "invalid_json";

export interface DecodedFrameResult {
  readonly ok: true;
  readonly kind: "frame";
  readonly frame: DecodedTelemetry;
}

export interface DecodedAlarmResult {
  readonly ok: true;
  readonly kind: "alarm";
  readonly alarm: VentilatorAlarm;
}

export interface DecodeFailure {
  readonly ok: false;
  readonly reason: string;
}

export type DecodeResult = DecodedFrameResult | DecodedAlarmResult | DecodeFailure;

export interface TelemetryDecoder {
  readonly name: TelemetryDecoderName;
  decode(buffer: Buffer): DecodeResult;
}

export function decodeFailure(reason: string): DecodeFailure {
  return { ok: false, reason };
}
