/*
 * Funcionalidad: Estado de la telemetría del ventilador
 * Descripción: Resultados de la fachada de telemetría: estado (bróker conectado, último mensaje, mensajes por segundo, decodificador, actividad del dispositivo, perdidos e inválidos) y datos de conexión sin credenciales
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type DeviceStalenessValue } from "@/features/ventilator-telemetry/application/services/device-staleness.service";
import { type TelemetryDecoderName } from "@/features/ventilator-telemetry/domain/decoders/telemetry-decoder";

export interface VentilatorTelemetryStatus {
  readonly brokerConnected: boolean;
  readonly lastMessageAt?: number;
  readonly msgRate: number;
  readonly decoder: TelemetryDecoderName;
  readonly staleness: DeviceStalenessValue;
  readonly lostMessages: number;
  readonly invalidMessages: number;
}

export interface VentilatorTelemetryConnectionInfo {
  readonly enabled: boolean;
  readonly brokerUrl?: string;
  readonly telemetryTopic: string;
  readonly alarmTopic: string;
  readonly deviceId: string;
}
