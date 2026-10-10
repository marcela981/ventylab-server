/*
 * Funcionalidad: Fábrica del cliente MQTT.js
 * Descripción: Único punto del código que abre una conexión con la librería mqtt (sesión limpia, sin reconexión automática porque la conexión aplica su propio retroceso exponencial) y la adapta al contrato MqttClientLike
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import * as mqtt from "mqtt";

import { type MqttQos } from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";
import { type MqttClientLike, type MqttClientOptions } from "@/features/ventilator-telemetry/infrastructure/mqtt/mqtt-client";

class MqttJsClientAdapter implements MqttClientLike {
  public constructor(private readonly _client: mqtt.MqttClient) {}

  public get connected(): boolean {
    return this._client.connected;
  }

  public onConnect(listener: () => void): void {
    this._client.on("connect", (): void => listener());
  }

  public onClose(listener: () => void): void {
    this._client.on("close", (): void => listener());
  }

  public onError(listener: (error: Error) => void): void {
    this._client.on("error", (error: Error): void => listener(error));
  }

  public onMessage(listener: (topic: string, payload: Buffer) => void): void {
    this._client.on("message", (topic: string, payload: Buffer): void => listener(topic, payload));
  }

  public async subscribe(topic: string, qos: MqttQos): Promise<void> {
    await this._client.subscribeAsync(topic, { qos });
  }

  public async publish(topic: string, payload: string | Buffer, qos: MqttQos, retain: boolean): Promise<void> {
    await this._client.publishAsync(topic, payload, { qos, retain });
  }

  public reconnect(): void {
    this._client.reconnect();
  }

  public end(): void {
    this._client.removeAllListeners();
    this._client.on("error", (): void => undefined);
    this._client.end(true);
  }
}

export function createMqttJsClient(brokerUrl: string, options: MqttClientOptions): MqttClientLike {
  const client: mqtt.MqttClient = mqtt.connect(brokerUrl, {
    clientId: options.clientId,
    username: options.username,
    password: options.password,
    keepalive: options.keepaliveSeconds,
    connectTimeout: options.connectTimeoutMs,
    reconnectPeriod: 0,
    clean: true,
  });

  return new MqttJsClientAdapter(client);
}
