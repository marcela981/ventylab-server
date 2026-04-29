/**
 * @module MqttClient
 * @description Cliente MQTT para comunicación bidireccional con Node-RED.
 * Implementa la interfaz IVentilatorConnection definida en los contratos.
 *
 * Responsabilidades:
 * - Conectar/desconectar al broker MQTT
 * - Suscribir a topics de telemetría del ventilador
 * - Publicar comandos al ventilador
 * - Manejar reconexión automática con backoff exponencial
 * - Reportar estado de conexión
 */

import { connect as mqttConnect } from 'mqtt';
import type { MqttClient as MqttClientLib, IClientOptions } from 'mqtt';
import type {
  IVentilatorConnection,
  VentilatorCommand,
} from '../../../contracts/simulation.contracts';
import { VentilatorStatus, MQTT_TOPICS } from '../../../contracts/simulation.contracts';

// ============================================================================
// Telemetry JSON payload (ESP simulation)
// ============================================================================

/**
 * Shape of the JSON telemetry payload published by the ESP simulator
 * at 5–60 Hz on the telemetry topic.
 */
export interface TelemetryPayload {
  /** Airway pressure in cmH₂O */
  pressure: number;
  /** Flow rate in L/min */
  flow: number;
  /** Volume in ml */
  volume: number;
  /** Timestamp in milliseconds (epoch) */
  timestamp: number;
  /** Device identifier */
  deviceId: string;
  /** Partial pressure of CO₂ in mmHg (optional) */
  pco2?: number;
  /** SpO₂ percentage (optional) */
  spo2?: number;
}

/** Opciones de configuración del cliente MQTT */
export interface MqttClientOptions {
  /** URL del broker MQTT (e.g., mqtt://localhost:1883) */
  brokerUrl: string;

  /** ID del cliente MQTT */
  clientId?: string;

  /** Usuario de autenticación */
  username?: string;

  /** Contraseña de autenticación */
  password?: string;

  /** Intervalo base de reconexión en ms (default: 5000) */
  reconnectInterval?: number;

  /** Máximo de intentos de reconexión (default: 10) */
  maxReconnectAttempts?: number;

  /** Keep-alive interval en segundos (default: 60) */
  keepAlive?: number;

  /**
   * Topic MQTT del que se recibe telemetría del ventilador.
   * Sobrescribe MQTT_TOPICS.TELEMETRY cuando se especifica.
   * Útil para usar un broker público con un topic propio
   * (e.g., process.env.MQTT_TOPIC).
   */
  telemetryTopic?: string;
}

export class MqttClient implements IVentilatorConnection {
  private status: VentilatorStatus = VentilatorStatus.DISCONNECTED;
  private client: MqttClientLib | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalDisconnect = false;
  private telemetryCallbacks: Array<(data: Buffer) => void> = [];

  constructor(private readonly options: MqttClientOptions) {}

  /** Telemetry topic resolved from options or the default contract constant. */
  private get telemetryTopic(): string {
    return this.options.telemetryTopic ?? MQTT_TOPICS.TELEMETRY;
  }

  // ---------------------------------------------------------------------------
  // IVentilatorConnection implementation
  // ---------------------------------------------------------------------------

  /**
   * Conecta al broker MQTT.
   * Configura handlers de conexión, error y reconexión.
   * @returns Promise que resuelve cuando la conexión está establecida.
   */
  async connect(): Promise<void> {
    if (this.client?.connected) {
      return;
    }

    this.intentionalDisconnect = false;
    this.reconnectAttempts = 0;
    this.status = VentilatorStatus.CONNECTING;

    return new Promise<void>((resolve, reject) => {
      const mqttOptions: IClientOptions = {
        clientId:
          this.options.clientId ??
          `ventylab-${Math.random().toString(16).slice(2, 8)}`,
        username: this.options.username,
        password: this.options.password,
        keepalive: this.options.keepAlive ?? 60,
        connectTimeout: 10_000,
        // Desactivamos reconexión automática de la librería;
        // la manejamos manualmente con backoff exponencial.
        reconnectPeriod: 0,
        clean: true,
      };

      this.client = mqttConnect(this.options.brokerUrl, mqttOptions);

      // --- Handlers de un solo disparo para resolver/rechazar la promesa ---
      const onFirstConnect = () => {
        this.client!.removeListener('error', onFirstError);
        this.status = VentilatorStatus.CONNECTED;
        this.reconnectAttempts = 0;
        resolve();
      };

      const onFirstError = (err: Error) => {
        this.client!.removeListener('connect', onFirstConnect);
        this.status = VentilatorStatus.ERROR;
        reject(err);
      };

      this.client.once('connect', onFirstConnect);
      this.client.once('error', onFirstError);

      // --- Handlers persistentes para eventos posteriores ---
      this.client.on('connect', () => {
        this.status = VentilatorStatus.CONNECTED;
        this.reconnectAttempts = 0;
        this.clearReconnectTimer();
        this.resubscribe();
      });

      this.client.on('error', (err: Error) => {
        console.error('[MqttClient] Error:', err.message);
        this.status = VentilatorStatus.ERROR;
      });

      this.client.on('close', () => {
        if (!this.intentionalDisconnect) {
          this.status = VentilatorStatus.DISCONNECTED;
          this.handleReconnect();
        }
      });

      this.client.on('message', (topic: string, payload: Buffer) => {
        if (
          this.telemetryCallbacks.length > 0 &&
          (topic === this.telemetryTopic || topic === MQTT_TOPICS.ALARM)
        ) {
          for (const cb of this.telemetryCallbacks) {
            cb(payload);
          }
        }
      });
    });
  }

  /**
   * Desconecta del broker MQTT de forma limpia.
   */
  async disconnect(): Promise<void> {
    this.intentionalDisconnect = true;
    this.clearReconnectTimer();

    return new Promise<void>((resolve) => {
      if (!this.client) {
        this.status = VentilatorStatus.DISCONNECTED;
        resolve();
        return;
      }

      this.client.end(true, {}, () => {
        this.client!.removeAllListeners();
        this.status = VentilatorStatus.DISCONNECTED;
        resolve();
      });
    });
  }

  /**
   * Publica un comando al ventilador via MQTT.
   * Serializa el comando a JSON (la codificación hex se hace en la capa superior).
   * @param command - Comando del ventilador
   */
  async publishCommand(command: VentilatorCommand): Promise<void> {
    if (!this.isConnected() || !this.client) {
      throw new Error(
        `[MqttClient] Cannot publish: connection is ${this.status}`,
      );
    }

    const payload = JSON.stringify(command);

    return new Promise<void>((resolve, reject) => {
      this.client!.publish(
        MQTT_TOPICS.COMMAND,
        payload,
        { qos: 1, retain: false },
        (err) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  }

  /**
   * Suscribe al topic de telemetría (y alarmas).
   * Cada mensaje recibido invoca el callback con el buffer crudo.
   * @param callback - Función a invocar con cada buffer recibido
   */
  subscribeTelemetry(callback: (data: Buffer) => void): void {
    this.telemetryCallbacks.push(callback);
    this.subscribeToTopic(this.telemetryTopic, 1);
    this.subscribeToTopic(MQTT_TOPICS.ALARM, 1);
  }

  /**
   * Convenience wrapper over subscribeTelemetry that parses each incoming
   * buffer as JSON and delivers a typed TelemetryPayload.
   *
   * Parse errors are logged via console.warn and silently discarded so the
   * server never crashes due to a malformed frame.
   *
   * @param callback - Invoked with each successfully-parsed telemetry object
   */
  subscribeTelemetryJson(callback: (data: TelemetryPayload) => void): void {
    this.subscribeTelemetry((raw: Buffer) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw.toString('utf-8'));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[MqttClient] JSON parse error – discarding frame: ${msg}`);
        return;
      }
  
      // Only pressure/flow/volume are strictly required.
      // timestamp and deviceId are filled with defaults downstream in
      // SimulationService.handleTelemetryJson() when missing.
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        typeof (parsed as any).pressure !== 'number' ||
        typeof (parsed as any).flow !== 'number' ||
        typeof (parsed as any).volume !== 'number'
      ) {
        console.warn(
          '[MqttClient] Telemetry missing required fields (pressure/flow/volume) – discarding',
        );
        return;
      }
  
      // Normalize timestamp: if missing or clearly not an epoch (e.g. < year 2001),
      // replace with server wall clock. Keeps frontend charts time-consistent.
      const p = parsed as any;
      const now = Date.now();
      const tsLooksValid = typeof p.timestamp === 'number' && p.timestamp > 1_000_000_000_000;
      const normalized: TelemetryPayload = {
        pressure: p.pressure,
        flow: p.flow,
        volume: p.volume,
        timestamp: tsLooksValid ? p.timestamp : now,
        deviceId: typeof p.deviceId === 'string' && p.deviceId.length > 0
          ? p.deviceId
          : 'ventilab-device-unknown',
        ...(typeof p.pco2 === 'number' ? { pco2: p.pco2 } : {}),
        ...(typeof p.spo2 === 'number' ? { spo2: p.spo2 } : {}),
      };
  
      callback(normalized);
    });
  }

  /**
   * Retorna el estado actual de la conexión MQTT.
   */
  getStatus(): VentilatorStatus {
    return this.status;
  }

  /**
   * Verifica si el cliente está conectado al broker.
   */
  isConnected(): boolean {
    return this.status === VentilatorStatus.CONNECTED;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Maneja la lógica de reconexión con backoff exponencial.
   * Cada intento duplica el intervalo base, con un máximo de 60 s.
   */
  private handleReconnect(): void {
    const max = this.options.maxReconnectAttempts ?? 5;
    this.reconnectAttempts++;

    if (this.reconnectAttempts > max) {
      console.error(
        `[MqttClient] Max reconnect attempts (${max}) reached. Giving up.`,
      );
      this.status = VentilatorStatus.ERROR;
      return;
    }

    // Backoff exponencial: base * 2^(attempt-1), tope en 60 s
    const baseMs = this.options.reconnectInterval ?? 5_000;
    const delay = Math.min(baseMs * 2 ** (this.reconnectAttempts - 1), 60_000);

    this.reconnectTimer = setTimeout(() => {
      this.status = VentilatorStatus.CONNECTING;
      this.client?.reconnect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /** Re-suscribe a telemetría y alarmas tras reconexión. */
  private resubscribe(): void {
    if (this.telemetryCallbacks.length === 0) return;
    this.subscribeToTopic(this.telemetryTopic, 1);
    this.subscribeToTopic(MQTT_TOPICS.ALARM, 1);
  }

  /**
   * Suscribe a un topic MQTT específico.
   * @param topic - Topic MQTT
   * @param qos   - Nivel QoS (0, 1 o 2)
   */
  private subscribeToTopic(topic: string, qos: 0 | 1 | 2 = 1): void {
    if (!this.client?.connected) return;

    this.client.subscribe(topic, { qos }, (err) => {
      if (err) {
        console.error(
          `[MqttClient] Failed to subscribe to ${topic}:`,
          err.message,
        );
      } else {
      }
    });
  }
}
