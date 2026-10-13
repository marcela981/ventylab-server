/*
 * Funcionalidad: Cliente MQTT de pruebas que simula el ventilador
 * Descripción: Se conecta solo a un broker Mosquitto local de prueba, publica tramas JSON de telemetría en el tópico de telemetría con prefijo test/<runId> (de forma periódica para mantener el dispositivo en línea, con los ajustes aplicados que confirman un comando) y se suscribe al tópico de comandos con el mismo prefijo para leer lo que publica la aplicación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { connectAsync, type MqttClient } from "mqtt";

import { assertLocalTestEnvironment } from "./test-env";

const TELEMETRY_INTERVAL_MS: number = 200;

export interface SimulatedVentilator {
  readonly commands: Record<string, unknown>[];
  applySettings(mode: string, settings: Readonly<Record<string, number>>): void;
  start(): void;
  stop(): void;
  close(): Promise<void>;
}

function requireEnv(key: string): string {
  const value: string | undefined = process.env[key];

  if (!value) {
    throw new Error(`${key} is not set in the test environment`);
  }

  return value;
}

export function testTelemetryTopic(): string {
  return requireEnv("MQTT_TELEMETRY_TOPIC");
}

export function testCommandTopic(): string {
  return `${requireEnv("MQTT_TEST_TOPIC_PREFIX").replace(/\/+$/, "")}/${requireEnv("MQTT_COMMAND_TOPIC").replace(/^\/+/, "")}`;
}

// Refuses any topic outside the per-run "test/<runId>" namespace so a misconfiguration can never reach a real device topic.
function assertTestTopic(topic: string): void {
  if (!topic.startsWith("test/")) {
    throw new Error(`Refusing to use MQTT topic ${topic}: tests only use the test/<runId> namespace`);
  }
}

export async function connectSimulatedVentilator(brokerUrl: string = requireEnv("MQTT_BROKER_URL")): Promise<SimulatedVentilator> {
  assertLocalTestEnvironment({ ...process.env, MQTT_BROKER_URL: brokerUrl });

  const telemetryTopic: string = testTelemetryTopic();
  const commandTopic: string = testCommandTopic();

  assertTestTopic(telemetryTopic);
  assertTestTopic(commandTopic);

  const client: MqttClient = await connectAsync(brokerUrl, { clientId: `ventylab-test-ventilator-${Date.now().toString(36)}`, reconnectPeriod: 500, connectTimeout: 5_000 });
  const commands: Record<string, unknown>[] = [];
  let mode: string = "VCV";
  let settings: Record<string, number> = {};
  let seq: number = 0;
  let timer: NodeJS.Timeout | undefined;

  client.on("message", (topic: string, payload: Buffer): void => {
    if (topic === commandTopic) {
      commands.push(JSON.parse(payload.toString("utf-8")) as Record<string, unknown>);
    }
  });
  await client.subscribeAsync(commandTopic, { qos: 1 });

  const publishFrame = (): void => {
    seq += 1;

    if (client.connected) {
      client.publish(telemetryTopic, JSON.stringify({ seq, deviceTs: Date.now(), pressure: 18, flow: 30, volume: 420, mode, settings }));
    }
  };

  return {
    commands,
    applySettings: (nextMode: string, nextSettings: Readonly<Record<string, number>>): void => {
      mode = nextMode;
      settings = { ...nextSettings };
    },
    start: (): void => {
      timer ??= setInterval(publishFrame, TELEMETRY_INTERVAL_MS);
      publishFrame();
    },
    stop: (): void => {
      clearInterval(timer);
      timer = undefined;
    },
    close: async (): Promise<void> => {
      clearInterval(timer);
      timer = undefined;
      await client.endAsync(true);
    },
  };
}
