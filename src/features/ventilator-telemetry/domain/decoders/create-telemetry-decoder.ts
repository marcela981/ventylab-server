/*
 * Funcionalidad: Selección del decodificador de telemetría
 * Descripción: Crea la estrategia de decodificación (auto, json o hex) indicada por la configuración VENTILATOR_TELEMETRY_DECODER
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AutoTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/auto-telemetry.decoder";
import { HexTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/hex-telemetry.decoder";
import { JsonTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/json-telemetry.decoder";
import {
  HEX_DECODER_NAME,
  JSON_DECODER_NAME,
  type TelemetryDecoder,
  type TelemetryDecoderName,
} from "@/features/ventilator-telemetry/domain/decoders/telemetry-decoder";

export function createTelemetryDecoder(name: TelemetryDecoderName, defaultDeviceId: string): TelemetryDecoder {
  if (name === JSON_DECODER_NAME) {
    return new JsonTelemetryDecoder(defaultDeviceId);
  }

  if (name === HEX_DECODER_NAME) {
    return new HexTelemetryDecoder(defaultDeviceId);
  }

  return new AutoTelemetryDecoder(defaultDeviceId);
}
