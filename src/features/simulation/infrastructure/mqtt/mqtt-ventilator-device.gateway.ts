/*
 * Funcionalidad: Adaptador MQTT del ventilador físico
 * Descripción: Implementa IVentilatorDeviceGateway con mqtt.js hacia Node-RED/ESP: conexión con reconexión manual por backoff exponencial (5 s base, tope 60 s, 5 intentos), suscripción qos 1 a telemetría y alarmas, re-suscripción al reconectar y publicación JSON qos 1 de comandos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { connect as mqttConnect, type IClientOptions, type MqttClient } from "mqtt";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import {
  type DeviceConnectionInfo,
  type DevicePayloadListener,
  type IVentilatorDeviceGateway,
} from "@/features/simulation/application/ports/ventilator-device-gateway.interface";
import { type VentilatorCommand } from "@/features/simulation/domain/value-objects/ventilator-command";
import {
  CONNECTED_STATUS_VALUE,
  CONNECTING_STATUS_VALUE,
  DISCONNECTED_STATUS_VALUE,
  ERROR_STATUS_VALUE,
  type VentilatorStatusValue,
} from "@/features/simulation/domain/value-objects/ventilator-telemetry";
import { type MqttSettings, readMqttSettings, stripBrokerCredentials } from "@/features/simulation/infrastructure/config/simulation-config";

const RECONNECT_BASE_MS: number = 5_000;
const RECONNECT_MAX_DELAY_MS: number = 60_000;
const MAX_RECONNECT_ATTEMPTS: number = 5;
const KEEP_ALIVE_SECONDS: number = 60;
const CONNECT_TIMEOUT_MS: number = 10_000;
const SUBSCRIPTION_QOS: 0 | 1 | 2 = 1;

@Injectable()
export class MqttVentilatorDeviceGateway implements IVentilatorDeviceGateway {
  private readonly _logger: Logger = new Logger(MqttVentilatorDeviceGateway.name);
  private readonly _settings: MqttSettings;
  private _status: VentilatorStatusValue = DISCONNECTED_STATUS_VALUE;
  private _client: MqttClient | null = null;
  private _reconnectAttempts: number = 0;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _intentionalDisconnect: boolean = false;
  private readonly _telemetryListeners: DevicePayloadListener[] = [];
  private readonly _alarmListeners: DevicePayloadListener[] = [];

  public constructor(configService: ConfigService<EnvironmentVariables>) {
    this._settings = readMqttSettings(configService);
  }

  public get connectionInfo(): DeviceConnectionInfo {
    return {
      brokerUrl: stripBrokerCredentials(this._settings.brokerUrl),
      telemetryTopic: this._settings.telemetryTopic,
    };
  }

  public async connect(): Promise<void> {
    if (this._client?.connected) {
      return;
    }

    this._intentionalDisconnect = false;
    this._reconnectAttempts = 0;
    this._status = CONNECTING_STATUS_VALUE;

    return await new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      const options: IClientOptions = {
        clientId: this._settings.clientId,
        username: this._settings.username,
        password: this._settings.password,
        keepalive: KEEP_ALIVE_SECONDS,
        connectTimeout: CONNECT_TIMEOUT_MS,
        reconnectPeriod: 0,
        clean: true,
      };

      const client: MqttClient = mqttConnect(this._settings.brokerUrl, options);

      this._client = client;

      const onFirstConnect = (): void => {
        client.removeListener("error", onFirstError);
        this._status = CONNECTED_STATUS_VALUE;
        this._reconnectAttempts = 0;
        resolve();
      };

      const onFirstError = (error: Error): void => {
        client.removeListener("connect", onFirstConnect);
        this._status = ERROR_STATUS_VALUE;
        reject(error);
      };

      client.once("connect", onFirstConnect);
      client.once("error", onFirstError);

      client.on("connect", (): void => {
        this._status = CONNECTED_STATUS_VALUE;
        this._reconnectAttempts = 0;
        this._clearReconnectTimer();
        this._resubscribe();
      });

      client.on("error", (error: Error): void => {
        this._logger.error(`Error: ${error.message}`);
        this._status = ERROR_STATUS_VALUE;
      });

      client.on("close", (): void => {
        if (!this._intentionalDisconnect) {
          this._status = DISCONNECTED_STATUS_VALUE;
          this._handleReconnect();
        }
      });

      client.on("message", (topic: string, payload: Buffer): void => {
        this._dispatch(topic, payload);
      });
    });
  }

  public async disconnect(): Promise<void> {
    this._intentionalDisconnect = true;
    this._clearReconnectTimer();

    return await new Promise<void>((resolve: () => void): void => {
      const client: MqttClient | null = this._client;

      if (!client) {
        this._status = DISCONNECTED_STATUS_VALUE;
        resolve();

        return;
      }

      client.end(true, {}, (): void => {
        client.removeAllListeners();
        this._status = DISCONNECTED_STATUS_VALUE;
        resolve();
      });
    });
  }

  public async publishCommand(command: VentilatorCommand): Promise<void> {
    const client: MqttClient | null = this._client;

    if (!this.isConnected() || !client) {
      throw new Error(`Cannot publish: connection is ${this._status}`);
    }

    const payload: string = JSON.stringify(command);

    return await new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      client.publish(this._settings.commandTopic, payload, { qos: 1, retain: false }, (error?: Error): void => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  public onTelemetry(listener: DevicePayloadListener): void {
    this._telemetryListeners.push(listener);
    this._subscribeAll();
  }

  public onAlarm(listener: DevicePayloadListener): void {
    this._alarmListeners.push(listener);
    this._subscribeAll();
  }

  public getStatus(): VentilatorStatusValue {
    return this._status;
  }

  public isConnected(): boolean {
    return this._status === CONNECTED_STATUS_VALUE;
  }

  private _dispatch(topic: string, payload: Buffer): void {
    let listeners: DevicePayloadListener[] = [];

    if (topic === this._settings.telemetryTopic) {
      listeners = this._telemetryListeners;
    } else if (topic === this._settings.alarmTopic) {
      listeners = this._alarmListeners;
    }

    for (const listener of listeners) {
      listener(payload);
    }
  }

  private _handleReconnect(): void {
    this._reconnectAttempts++;

    if (this._reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      this._logger.error(`Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
      this._status = ERROR_STATUS_VALUE;

      return;
    }

    const delay: number = Math.min(RECONNECT_BASE_MS * 2 ** (this._reconnectAttempts - 1), RECONNECT_MAX_DELAY_MS);

    this._reconnectTimer = setTimeout((): void => {
      this._status = CONNECTING_STATUS_VALUE;
      this._client?.reconnect();
    }, delay);
  }

  private _clearReconnectTimer(): void {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }

  private _resubscribe(): void {
    if (this._telemetryListeners.length + this._alarmListeners.length === 0) {
      return;
    }

    this._subscribeAll();
  }

  private _subscribeAll(): void {
    this._subscribeToTopic(this._settings.telemetryTopic);
    this._subscribeToTopic(this._settings.alarmTopic);
  }

  private _subscribeToTopic(topic: string): void {
    const client: MqttClient | null = this._client;

    if (!client?.connected) {
      return;
    }

    client.subscribe(topic, { qos: SUBSCRIPTION_QOS }, (error: Error | null): void => {
      if (error) {
        this._logger.error(`Failed to subscribe to ${topic}: ${error.message}`);
      }
    });
  }
}
