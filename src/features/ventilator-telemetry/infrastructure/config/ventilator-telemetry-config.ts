/*
 * Funcionalidad: Configuración de la telemetría del ventilador
 * Descripción: Resuelve desde ConfigService los ajustes de la telemetría (conexión MQTT solo cuando MQTT_BROKER_URL está definido, identificador de cliente único por proceso, tópicos, decodificador, intervalos y grabación) y de InfluxDB, y oculta las credenciales de la URL del bróker
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { randomUUID } from "crypto";

import { type ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { type MqttConnectionSettings, type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";

export interface InfluxSettings {
  readonly url: string;
  readonly token: string;
  readonly org: string;
  readonly bucket: string;
}

export function readVentilatorTelemetrySettings(configService: ConfigService<EnvironmentVariables, true>): VentilatorTelemetrySettings {
  return {
    mqtt: readMqttConnectionSettings(configService),
    telemetryTopic: configService.get("MQTT_TELEMETRY_TOPIC", { infer: true }),
    alarmTopic: configService.get("MQTT_ALARM_TOPIC", { infer: true }),
    decoder: configService.get("VENTILATOR_TELEMETRY_DECODER", { infer: true }),
    deviceId: configService.get("VENTILATOR_DEVICE_ID", { infer: true }),
    flushIntervalMs: configService.get("VENTILATOR_FLUSH_INTERVAL_MS", { infer: true }),
    staleAfterMs: configService.get("VENTILATOR_STALE_AFTER_MS", { infer: true }),
    roomRefreshMs: configService.get("VENTILATOR_ROOM_REFRESH_MS", { infer: true }),
    metricsWindow: configService.get("VENTILATOR_METRICS_WINDOW", { infer: true }),
    invalidLogIntervalMs: configService.get("VENTILATOR_INVALID_LOG_INTERVAL_MS", { infer: true }),
    recordingHz: configService.get("VENTILATOR_RECORDING_HZ", { infer: true }),
    recordingFlushSeconds: configService.get("VENTILATOR_RECORDING_FLUSH_SECONDS", { infer: true }),
  };
}

export function readInfluxSettings(configService: ConfigService<EnvironmentVariables, true>): InfluxSettings | undefined {
  const url: string | undefined = configService.get("INFLUXDB_URL", { infer: true });
  const token: string | undefined = configService.get("INFLUXDB_TOKEN", { infer: true });
  const org: string | undefined = configService.get("INFLUXDB_ORG", { infer: true });
  const bucket: string | undefined = configService.get("INFLUXDB_BUCKET", { infer: true });

  if (!url || !token || !org || !bucket) {
    return undefined;
  }

  return { url, token, org, bucket };
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

function readMqttConnectionSettings(configService: ConfigService<EnvironmentVariables, true>): MqttConnectionSettings | undefined {
  const brokerUrl: string | undefined = configService.get("MQTT_BROKER_URL", { infer: true });

  if (!brokerUrl) {
    return undefined;
  }

  return {
    brokerUrl,
    clientId: configService.get("MQTT_CLIENT_ID", { infer: true }) ?? `ventylab-server-${process.pid}-${randomUUID().slice(0, 8)}`,
    username: configService.get("MQTT_USERNAME", { infer: true }),
    password: configService.get("MQTT_PASSWORD", { infer: true }),
    reconnectBaseMs: configService.get("MQTT_RECONNECT_BASE_MS", { infer: true }),
    reconnectMaxMs: configService.get("MQTT_RECONNECT_MAX_MS", { infer: true }),
  };
}
