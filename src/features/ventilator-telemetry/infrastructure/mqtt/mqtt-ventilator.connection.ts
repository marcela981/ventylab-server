/*
 * Funcionalidad: Conexión MQTT del ventilador
 * Descripción: Implementación única de IMqttConnection: crea el cliente a través del registro global (nunca dos clientes vivos), restaura las suscripciones en cada conexión (telemetría QoS 0, alarmas QoS 1), reconecta indefinidamente con retroceso exponencial con fluctuación limitado a MQTT_RECONNECT_MAX_MS y cierra el cliente al apagar; queda deshabilitada sin MQTT_BROKER_URL
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import {
  type IMqttConnection,
  type MqttConnectionStateListener,
  type MqttMessageListener,
  type MqttPublishOptions,
  type MqttQos,
} from "@/features/ventilator-telemetry/application/ports/mqtt-connection.interface";
import {
  type MqttConnectionSettings,
  VENTILATOR_TELEMETRY_SETTINGS_TOKEN,
  type VentilatorTelemetrySettings,
} from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { stripBrokerCredentials } from "@/features/ventilator-telemetry/infrastructure/config/ventilator-telemetry-config";
import {
  MQTT_CLIENT_FACTORY_TOKEN,
  type MqttClientFactory,
  type MqttClientLike,
  registerMqttClient,
  releaseMqttClient,
} from "@/features/ventilator-telemetry/infrastructure/mqtt/mqtt-client";
import { computeReconnectDelay } from "@/features/ventilator-telemetry/infrastructure/mqtt/reconnect-backoff";

const KEEP_ALIVE_SECONDS: number = 60;
const CONNECT_TIMEOUT_MS: number = 10_000;

export class MqttNotConnectedError extends Error {
  public constructor() {
    super("MQTT broker is not connected");
    this.name = MqttNotConnectedError.name;
  }
}

@Injectable()
export class MqttVentilatorConnection implements IMqttConnection {
  private readonly _logger: Logger = new Logger(MqttVentilatorConnection.name);
  private readonly _subscriptions: Map<string, MqttQos> = new Map<string, MqttQos>();
  private readonly _messageListeners: Set<MqttMessageListener> = new Set<MqttMessageListener>();
  private readonly _stateListeners: Set<MqttConnectionStateListener> = new Set<MqttConnectionStateListener>();
  private _client: MqttClientLike | undefined;
  private _connected: boolean = false;
  private _stopped: boolean = true;
  private _attempt: number = 0;
  private _reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  public constructor(
    @Inject(VENTILATOR_TELEMETRY_SETTINGS_TOKEN)
    private readonly _settings: VentilatorTelemetrySettings,
    @Inject(MQTT_CLIENT_FACTORY_TOKEN)
    private readonly _clientFactory: MqttClientFactory,
  ) {}

  public get isEnabled(): boolean {
    return this._settings.mqtt !== undefined;
  }

  public get isConnected(): boolean {
    return this._connected;
  }

  public get brokerUrl(): string | undefined {
    return this._settings.mqtt ? stripBrokerCredentials(this._settings.mqtt.brokerUrl) : undefined;
  }

  public get reconnectAttempt(): number {
    return this._attempt;
  }

  public start(): void {
    const mqttSettings: MqttConnectionSettings | undefined = this._settings.mqtt;

    if (!mqttSettings) {
      this._logger.warn("MQTT_BROKER_URL is not set: the physical ventilator connection is disabled");

      return;
    }

    this._stopped = false;

    if (this._client !== undefined) {
      return;
    }

    let client: MqttClientLike;

    try {
      client = registerMqttClient((): MqttClientLike => this._clientFactory(mqttSettings.brokerUrl, {
        clientId: mqttSettings.clientId,
        username: mqttSettings.username,
        password: mqttSettings.password,
        keepaliveSeconds: KEEP_ALIVE_SECONDS,
        connectTimeoutMs: CONNECT_TIMEOUT_MS,
      }));
    } catch (error: unknown) {
      this._logger.error(`MQTT client could not be created for ${this.brokerUrl ?? "unknown broker"}: ${error instanceof Error ? error.message : String(error)}`);

      return;
    }

    this._client = client;

    client.onConnect((): void => this._handleConnect(client));
    client.onClose((): void => this._handleClose());
    client.onError((error: Error): void => this._logger.warn(`MQTT error (${this.brokerUrl ?? "disabled"}): ${error.message}`));
    client.onMessage((topic: string, payload: Buffer): void => this._dispatch(topic, payload));
  }

  public stop(): void {
    this._stopped = true;
    this._clearReconnectTimer();

    const client: MqttClientLike | undefined = this._client;

    this._client = undefined;

    if (client !== undefined) {
      releaseMqttClient(client);
    }

    this._setConnected(false);
  }

  public async publish(topic: string, payload: string | Buffer, options: MqttPublishOptions): Promise<void> {
    const client: MqttClientLike | undefined = this._client;

    if (!client || !this._connected) {
      throw new MqttNotConnectedError();
    }

    await client.publish(topic, payload, options.qos, options.retain ?? false);
  }

  public subscribe(topic: string, qos: MqttQos): void {
    this._subscriptions.set(topic, qos);

    if (this._client && this._connected) {
      this._subscribeOne(this._client, topic, qos);
    }
  }

  public onMessage(listener: MqttMessageListener): () => void {
    this._messageListeners.add(listener);

    return (): void => {
      this._messageListeners.delete(listener);
    };
  }

  public onConnectionChange(listener: MqttConnectionStateListener): () => void {
    this._stateListeners.add(listener);

    return (): void => {
      this._stateListeners.delete(listener);
    };
  }

  private _handleConnect(client: MqttClientLike): void {
    this._attempt = 0;
    this._clearReconnectTimer();

    for (const [topic, qos] of this._subscriptions) {
      this._subscribeOne(client, topic, qos);
    }

    this._logger.log(`MQTT connected to ${this.brokerUrl ?? "unknown broker"}`);
    this._setConnected(true);
  }

  private _handleClose(): void {
    this._setConnected(false);

    if (this._stopped || this._reconnectTimer !== undefined) {
      return;
    }

    const mqttSettings: MqttConnectionSettings | undefined = this._settings.mqtt;

    if (!mqttSettings) {
      return;
    }

    const delay: number = computeReconnectDelay(this._attempt, mqttSettings.reconnectBaseMs, mqttSettings.reconnectMaxMs, Math.random());

    this._attempt++;

    this._reconnectTimer = setTimeout((): void => {
      this._reconnectTimer = undefined;

      if (!this._stopped && this._client !== undefined) {
        this._client.reconnect();
      }
    }, delay);
    this._reconnectTimer.unref();
  }

  private _subscribeOne(client: MqttClientLike, topic: string, qos: MqttQos): void {
    client.subscribe(topic, qos).catch((error: unknown): void => {
      this._logger.error(`Subscribing to ${topic} failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  private _dispatch(topic: string, payload: Buffer): void {
    for (const listener of this._messageListeners) {
      try {
        listener(topic, payload);
      } catch (error: unknown) {
        this._logger.error(`MQTT message listener failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private _setConnected(connected: boolean): void {
    if (this._connected === connected) {
      return;
    }

    this._connected = connected;

    for (const listener of this._stateListeners) {
      try {
        listener(connected);
      } catch (error: unknown) {
        this._logger.error(`MQTT connection listener failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private _clearReconnectTimer(): void {
    if (this._reconnectTimer !== undefined) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = undefined;
    }
  }
}
