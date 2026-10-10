/*
 * Funcionalidad: Ajustes de la telemetría del ventilador
 * Descripción: Ajustes resueltos desde la configuración: conexión MQTT (solo cuando MQTT_BROKER_URL está definido), tópicos, decodificador, identificador del dispositivo, intervalos de envío, máximo de tramas en el búfer de lotes, inactividad, refresco de sala, ventana de métricas, muestreo de registros de mensajes inválidos y grabación; y el token del decodificador seleccionado
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TelemetryDecoderName } from "@/features/ventilator-telemetry/domain/decoders/telemetry-decoder";

export const VENTILATOR_TELEMETRY_SETTINGS_TOKEN: unique symbol = Symbol("VENTILATOR_TELEMETRY_SETTINGS_TOKEN");

export const TELEMETRY_DECODER_TOKEN: unique symbol = Symbol("TELEMETRY_DECODER_TOKEN");

export interface MqttConnectionSettings {
  readonly brokerUrl: string;
  readonly clientId: string;
  readonly username?: string;
  readonly password?: string;
  readonly reconnectBaseMs: number;
  readonly reconnectMaxMs: number;
}

export interface VentilatorTelemetrySettings {
  readonly mqtt: MqttConnectionSettings | undefined;
  readonly telemetryTopic: string;
  readonly alarmTopic: string;
  readonly decoder: TelemetryDecoderName;
  readonly deviceId: string;
  readonly flushIntervalMs: number;
  readonly maxBufferedFrames: number;
  readonly staleAfterMs: number;
  readonly roomRefreshMs: number;
  readonly metricsWindow: number;
  readonly invalidLogIntervalMs: number;
  readonly recordingHz: number;
  readonly recordingFlushSeconds: number;
}
