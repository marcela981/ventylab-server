/*
 * Funcionalidad: Decodificador hexadecimal de telemetría
 * Descripción: Estrategia que envuelve el analizador de tramas hexadecimales existente: fusiona las tramas parciales de presión, flujo y volumen en una lectura acumulada y convierte las tramas de alarma en VentilatorAlarm
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildAlarmFromHexFrame, type HexParseResult, parseHexFrame } from "@/features/ventilator-telemetry/domain/decoders/hex-frame-parser";
import {
  type DecodeResult,
  decodeFailure,
  HEX_DECODER_NAME,
  type TelemetryDecoder,
  type TelemetryDecoderName,
} from "@/features/ventilator-telemetry/domain/decoders/telemetry-decoder";
import { HEX_ALARM_MESSAGE, HEX_FLOW_MESSAGE, HEX_PRESSURE_MESSAGE, type HexData } from "@/features/ventilator-telemetry/domain/value-objects/hex-frame";

interface RollingReading {
  pressure: number;
  flow: number;
  volume: number;
}

export class HexTelemetryDecoder implements TelemetryDecoder {
  public readonly name: TelemetryDecoderName = HEX_DECODER_NAME;
  private readonly _rolling: RollingReading = { pressure: 0, flow: 0, volume: 0 };

  public constructor(private readonly _deviceId: string) {}

  public decode(buffer: Buffer): DecodeResult {
    const parsed: HexParseResult = parseHexFrame(buffer, Date.now());

    if (!parsed.ok) {
      return decodeFailure(parsed.reason);
    }

    const data: HexData = parsed.data;

    if (data.type === HEX_ALARM_MESSAGE) {
      return { ok: true, kind: "alarm", alarm: buildAlarmFromHexFrame(data) };
    }

    if (data.type === HEX_PRESSURE_MESSAGE) {
      this._rolling.pressure = data.pressure;
    } else if (data.type === HEX_FLOW_MESSAGE) {
      this._rolling.flow = data.flow;
    } else {
      this._rolling.volume = data.volume;
    }

    return {
      ok: true,
      kind: "frame",
      frame: { pressure: this._rolling.pressure, flow: this._rolling.flow, volume: this._rolling.volume, deviceId: this._deviceId },
    };
  }
}
