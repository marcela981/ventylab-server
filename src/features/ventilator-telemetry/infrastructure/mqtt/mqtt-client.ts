/*
 * Funcionalidad: Cliente MQTT y registro global
 * Descripción: Contrato mínimo MqttClientLike del cliente MQTT, token de su fábrica y registro en globalThis (clave Symbol.for) que garantiza un único cliente vivo por proceso incluso con recarga en caliente: antes de crear otro cierra el anterior
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type MqttQos } from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";

export const MQTT_CLIENT_FACTORY_TOKEN: unique symbol = Symbol("MQTT_CLIENT_FACTORY_TOKEN");

export interface MqttClientOptions {
  readonly clientId: string;
  readonly username?: string;
  readonly password?: string;
  readonly keepaliveSeconds: number;
  readonly connectTimeoutMs: number;
}

export interface MqttClientLike {
  readonly connected: boolean;
  onConnect(listener: () => void): void;
  onClose(listener: () => void): void;
  onError(listener: (error: Error) => void): void;
  onMessage(listener: (topic: string, payload: Buffer) => void): void;
  subscribe(topic: string, qos: MqttQos): Promise<void>;
  publish(topic: string, payload: string | Buffer, qos: MqttQos, retain: boolean): Promise<void>;
  reconnect(): void;
  end(): void;
}

export type MqttClientFactory = (brokerUrl: string, options: MqttClientOptions) => MqttClientLike;

const MQTT_CLIENT_REGISTRY_KEY: symbol = Symbol.for("ventylab.ventilator-telemetry.mqtt-client");

type MqttClientRegistry = Record<symbol, MqttClientLike | undefined>;

function registry(): MqttClientRegistry {
  return globalThis;
}

export function registerMqttClient(create: () => MqttClientLike): MqttClientLike {
  const previous: MqttClientLike | undefined = registry()[MQTT_CLIENT_REGISTRY_KEY];

  if (previous !== undefined) {
    previous.end();
    registry()[MQTT_CLIENT_REGISTRY_KEY] = undefined;
  }

  const client: MqttClientLike = create();

  registry()[MQTT_CLIENT_REGISTRY_KEY] = client;

  return client;
}

export function releaseMqttClient(client: MqttClientLike): void {
  client.end();

  if (registry()[MQTT_CLIENT_REGISTRY_KEY] === client) {
    registry()[MQTT_CLIENT_REGISTRY_KEY] = undefined;
  }
}

export function registeredMqttClient(): MqttClientLike | undefined {
  return registry()[MQTT_CLIENT_REGISTRY_KEY];
}
