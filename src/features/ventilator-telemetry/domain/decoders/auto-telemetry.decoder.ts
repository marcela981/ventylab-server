/*
 * Funcionalidad: Decodificador automático de telemetría
 * Descripción: Estrategia por defecto que intenta JSON y, solo cuando el mensaje no es JSON, prueba la trama hexadecimal (mismo orden que el relé heredado)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { HexTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/hex-telemetry.decoder";
import { JsonTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/json-telemetry.decoder";
import {
  AUTO_DECODER_NAME,
  type DecodeResult,
  decodeFailure,
  INVALID_JSON_REASON,
  type TelemetryDecoder,
  type TelemetryDecoderName,
} from "@/features/ventilator-telemetry/domain/decoders/telemetry-decoder";

export class AutoTelemetryDecoder implements TelemetryDecoder {
  public readonly name: TelemetryDecoderName = AUTO_DECODER_NAME;
  private readonly _json: JsonTelemetryDecoder;
  private readonly _hex: HexTelemetryDecoder;

  public constructor(defaultDeviceId: string) {
    this._json = new JsonTelemetryDecoder(defaultDeviceId);
    this._hex = new HexTelemetryDecoder(defaultDeviceId);
  }

  public decode(buffer: Buffer): DecodeResult {
    const fromJson: DecodeResult = this._json.decode(buffer);

    if (fromJson.ok || fromJson.reason !== INVALID_JSON_REASON) {
      return fromJson;
    }

    const fromHex: DecodeResult = this._hex.decode(buffer);

    return fromHex.ok ? fromHex : decodeFailure(`invalid_json_and_${fromHex.reason}`);
  }
}
