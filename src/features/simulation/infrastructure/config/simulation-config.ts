/*
 * Funcionalidad: Configuración de simulación
 * Descripción: Valores por defecto del contrato con el ventilador físico (broker MQTT, tópicos de telemetría, comandos y alarmas, frecuencia máxima WebSocket) y su resolución desde las variables de entorno validadas; los tópicos de comandos y alarmas son fijos del contrato del dispositivo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";

export const DEFAULT_MQTT_BROKER_URL: string = "mqtt://test.mosquitto.org:1883";
export const DEFAULT_TELEMETRY_TOPIC: string = "/ventynet/data";
export const CONTRACT_COMMAND_TOPIC: string = "ventilab/device/001/command";
export const CONTRACT_ALARM_TOPIC: string = "ventilab/device/001/alarm";
export const DEFAULT_WS_MAX_HZ: number = 30;

export interface MqttSettings {
  brokerUrl: string;
  clientId: string;
  username?: string;
  password?: string;
  telemetryTopic: string;
  commandTopic: string;
  alarmTopic: string;
}

export interface InfluxSettings {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

export function readMqttSettings(configService: ConfigService<EnvironmentVariables>): MqttSettings {
  return {
    brokerUrl: configService.get("MQTT_BROKER_URL", { infer: true }) ?? DEFAULT_MQTT_BROKER_URL,
    clientId: configService.get("MQTT_CLIENT_ID", { infer: true }) ?? `ventylab-server-${process.pid}-${Date.now()}`,
    username: configService.get("MQTT_USERNAME", { infer: true }),
    password: configService.get("MQTT_PASSWORD", { infer: true }),
    telemetryTopic: configService.get("MQTT_TELEMETRY_TOPIC", { infer: true }) ?? DEFAULT_TELEMETRY_TOPIC,
    commandTopic: CONTRACT_COMMAND_TOPIC,
    alarmTopic: CONTRACT_ALARM_TOPIC,
  };
}

export function readInfluxSettings(configService: ConfigService<EnvironmentVariables>): InfluxSettings | undefined {
  const url: string | undefined = configService.get("INFLUXDB_URL", { infer: true });
  const token: string | undefined = configService.get("INFLUXDB_TOKEN", { infer: true });
  const org: string | undefined = configService.get("INFLUXDB_ORG", { infer: true });
  const bucket: string | undefined = configService.get("INFLUXDB_BUCKET", { infer: true });

  if (!url || !token || !org || !bucket) {
    return undefined;
  }

  return { url, token, org, bucket };
}

export function resolveWsMaxHz(configured: number | undefined): { maxHz: number; isFallback: boolean } {
  if (configured === undefined) {
    return { maxHz: DEFAULT_WS_MAX_HZ, isFallback: false };
  }

  const truncated: number = Math.trunc(configured);

  if (isNaN(truncated) || truncated <= 0) {
    return { maxHz: DEFAULT_WS_MAX_HZ, isFallback: true };
  }

  return { maxHz: truncated, isFallback: false };
}

export function stripBrokerCredentials(brokerUrl: string): string {
  try {
    const url: URL = new URL(brokerUrl);

    url.username = "";
    url.password = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return brokerUrl;
  }
}
