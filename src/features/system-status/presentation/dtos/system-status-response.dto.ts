/*
 * Funcionalidad: DTOs de respuesta del estado del sistema
 * Descripción: Serialización del estado global y de cada componente (base de datos, broker MQTT, ventilador, proveedores de IA, almacenamiento y proceso) y del resultado de la sonda manual de un proveedor de IA, sin mensajes de error ni datos de configuración
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

const COMPONENT_STATES: string[] = ["up", "degraded", "down", "idle", "not_configured"];

export class DatabaseStatusDTO {
  @ApiProperty({ description: "Component state", enum: COMPONENT_STATES, example: "up" })
  public state: string;

  @ApiProperty({ description: "Whether the database answered the ping within the timeout", example: true })
  public reachable: boolean;

  @ApiProperty({ description: "Ping latency in milliseconds, null when unreachable", example: 4, nullable: true, type: Number })
  public latencyMs: number | null;
}

export class MqttBrokerStatusDTO {
  @ApiProperty({ description: "Component state", enum: COMPONENT_STATES, example: "up" })
  public state: string;

  @ApiProperty({ description: "Whether a broker URL is configured", example: true })
  public enabled: boolean;

  @ApiProperty({ description: "Whether the broker connection is open", example: true })
  public connected: boolean;

  @ApiProperty({ description: "Time of the last telemetry message", example: "2026-10-11T15:04:05.000Z", nullable: true, type: String })
  public lastMessageAt: string | null;

  @ApiProperty({ description: "Telemetry messages per second", example: 25 })
  public messagesPerSecond: number;
}

export class VentilatorStatusDTO {
  @ApiProperty({ description: "Component state; idle means offline with no active reservation", enum: COMPONENT_STATES, example: "idle" })
  public state: string;

  @ApiProperty({ description: "Whether the device is sending telemetry", example: false })
  public online: boolean;

  @ApiProperty({ description: "Whether a reservation is active now, null when it could not be checked", example: false, nullable: true, type: Boolean })
  public activeReservation: boolean | null;
}

export class AiProviderStatusDTO {
  @ApiProperty({ description: "Provider identifier", example: "gemini" })
  public provider: string;

  @ApiProperty({ description: "Whether the provider has credentials configured", example: true })
  public configured: boolean;

  @ApiProperty({ description: "Circuit breaker state", enum: ["closed", "open", "half_open"], example: "closed" })
  public breaker: string;

  @ApiProperty({ description: "Whether the gateway can route calls to it (configured and breaker not open)", example: true })
  public available: boolean;

  @ApiProperty({ description: "Last successful call since the process started", example: "2026-10-11T15:00:00.000Z", nullable: true, type: String })
  public lastSuccessAt: string | null;

  @ApiProperty({ description: "Last failed call since the process started", example: null, nullable: true, type: String })
  public lastErrorAt: string | null;

  @ApiProperty({ description: "Error classification of the last failure (no message)", example: "TIMEOUT", nullable: true, type: String })
  public lastErrorCode: string | null;

  @ApiProperty({ description: "p95 latency in milliseconds over the telemetry window", example: 1800, nullable: true, type: Number })
  public latencyP95Ms: number | null;

  @ApiProperty({ description: "Share of calls that ended in error over the telemetry window (0–1)", example: 0.02, nullable: true, type: Number })
  public errorRate: number | null;

  @ApiProperty({ description: "Calls that reached the provider over the telemetry window", example: 42, nullable: true, type: Number })
  public calls: number | null;
}

export class AiProvidersStatusDTO {
  @ApiProperty({ description: "Component state; down when no provider is available", enum: COMPONENT_STATES, example: "up" })
  public state: string;

  @ApiProperty({ description: "Telemetry window in minutes for latency and error rate", example: 15 })
  public windowMinutes: number;

  @ApiProperty({ description: "Per-provider status", type: AiProviderStatusDTO, isArray: true })
  public providers: AiProviderStatusDTO[];
}

export class StorageStatusDTO {
  @ApiProperty({ description: "Component state of the media storage provider", enum: COMPONENT_STATES, example: "up" })
  public state: string;
}

export class ProcessStatusDTO {
  @ApiProperty({ description: "Component state", enum: COMPONENT_STATES, example: "up" })
  public state: string;

  @ApiProperty({ description: "Process uptime in seconds", example: 86400 })
  public uptimeSeconds: number;

  @ApiProperty({ description: "Resident set size in bytes", example: 157286400 })
  public rssBytes: number;

  @ApiProperty({ description: "Heap in use in bytes", example: 83886080 })
  public heapUsedBytes: number;

  @ApiProperty({ description: "Mean event loop delay in milliseconds since the previous reading", example: 10.4 })
  public eventLoopLagMs: number;

  @ApiProperty({ description: "Application version", example: "1.0.0" })
  public appVersion: string;

  @ApiProperty({ description: "Deployed commit, when provided by the environment", example: "439d429", nullable: true, type: String })
  public appCommit: string | null;

  @ApiProperty({ description: "Simulation engine version", example: "1.0.0" })
  public engineVersion: string;
}

export class SystemStatusComponentsDTO {
  @ApiProperty({ description: "Database status", type: DatabaseStatusDTO })
  public database: DatabaseStatusDTO;

  @ApiProperty({ description: "MQTT broker status", type: MqttBrokerStatusDTO })
  public mqttBroker: MqttBrokerStatusDTO;

  @ApiProperty({ description: "Physical ventilator status", type: VentilatorStatusDTO })
  public ventilator: VentilatorStatusDTO;

  @ApiProperty({ description: "AI providers status", type: AiProvidersStatusDTO })
  public aiProviders: AiProvidersStatusDTO;

  @ApiProperty({ description: "Media storage status", type: StorageStatusDTO })
  public storage: StorageStatusDTO;

  @ApiProperty({ description: "Server process status", type: ProcessStatusDTO })
  public process: ProcessStatusDTO;
}

export class SystemStatusDTO {
  @ApiProperty({ description: "Global state", enum: ["OK", "DEGRADED", "DOWN"], example: "OK" })
  public state: string;

  @ApiProperty({ description: "When the status was computed (results are cached for a few seconds)", example: "2026-10-11T15:04:05.000Z" })
  public checkedAt: string;

  @ApiProperty({ description: "Per-component status", type: SystemStatusComponentsDTO })
  public components: SystemStatusComponentsDTO;
}

export class AiProbeDTO {
  @ApiProperty({ description: "Probed provider", example: "gemini" })
  public provider: string;

  @ApiProperty({ description: "Model used for the probe", example: "gemini-2.0-flash" })
  public model: string;

  @ApiProperty({ description: "Whether the provider answered", example: true })
  public ok: boolean;

  @ApiProperty({ description: "Call latency in milliseconds", example: 640 })
  public latencyMs: number;

  @ApiProperty({ description: "Error classification when the probe failed (no message)", example: null, nullable: true, type: String })
  public errorCode: string | null;

  @ApiProperty({ description: "Identifier of the recorded AI call", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public aiCallId: string;
}
