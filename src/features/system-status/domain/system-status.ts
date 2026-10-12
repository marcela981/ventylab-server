/*
 * Funcionalidad: Estado del sistema
 * Descripción: Modelo del estado de cada componente (base de datos, broker MQTT, ventilador, proveedores de IA, almacenamiento y proceso) y reglas puras del estado global OK, DEGRADED o DOWN, del estado derivado del ventilador y de los proveedores de IA, y de la detección de cambios entre dos evaluaciones
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ComponentStateValue = "up" | "degraded" | "down" | "idle" | "not_configured";

export type SystemStateValue = "OK" | "DEGRADED" | "DOWN";

export type AiBreakerStateValue = "closed" | "open" | "half_open";

export type SystemComponentName = "database" | "mqttBroker" | "ventilator" | "aiProviders" | "storage" | "process";

export const SYSTEM_COMPONENT_NAMES: readonly SystemComponentName[] = ["database", "mqttBroker", "ventilator", "aiProviders", "storage", "process"] as const;

export interface DatabaseComponentStatus {
  readonly state: ComponentStateValue;
  readonly reachable: boolean;
  readonly latencyMs?: number;
}

export interface MqttBrokerComponentStatus {
  readonly state: ComponentStateValue;
  readonly enabled: boolean;
  readonly connected: boolean;
  readonly lastMessageAt?: Date;
  readonly messagesPerSecond: number;
}

export interface VentilatorComponentStatus {
  readonly state: ComponentStateValue;
  readonly online: boolean;
  readonly activeReservation?: boolean;
}

export interface AiProviderComponentStatus {
  readonly provider: string;
  readonly configured: boolean;
  readonly breaker: AiBreakerStateValue;
  readonly available: boolean;
  readonly lastSuccessAt?: Date;
  readonly lastErrorAt?: Date;
  readonly lastErrorCode?: string;
  readonly latencyP95Ms?: number;
  readonly errorRate?: number;
  readonly calls?: number;
}

export interface AiProvidersComponentStatus {
  readonly state: ComponentStateValue;
  readonly windowMinutes: number;
  readonly providers: AiProviderComponentStatus[];
}

export interface StorageComponentStatus {
  readonly state: ComponentStateValue;
}

export interface ProcessComponentStatus {
  readonly state: ComponentStateValue;
  readonly uptimeSeconds: number;
  readonly rssBytes: number;
  readonly heapUsedBytes: number;
  readonly eventLoopLagMs: number;
  readonly appVersion: string;
  readonly appCommit?: string;
  readonly engineVersion: string;
}

export interface SystemStatusComponents {
  readonly database: DatabaseComponentStatus;
  readonly mqttBroker: MqttBrokerComponentStatus;
  readonly ventilator: VentilatorComponentStatus;
  readonly aiProviders: AiProvidersComponentStatus;
  readonly storage: StorageComponentStatus;
  readonly process: ProcessComponentStatus;
}

export interface SystemStatusReport {
  readonly state: SystemStateValue;
  readonly checkedAt: Date;
  readonly components: SystemStatusComponents;
}

export interface SystemComponentChange {
  readonly component: SystemComponentName;
  readonly state: ComponentStateValue;
  readonly previousState: ComponentStateValue;
}

export interface SystemStatusChange {
  readonly state: SystemStateValue;
  readonly previousState: SystemStateValue;
  readonly changedComponents: SystemComponentChange[];
  readonly checkedAt: Date;
}

// The ventilator only matters while someone holds it: offline with no active reservation (or an unknown one) is idle, not a fault.
export function deriveVentilatorState(mqttEnabled: boolean, online: boolean, activeReservation: boolean | undefined): ComponentStateValue {
  if (!mqttEnabled) {
    return "not_configured";
  }

  if (online) {
    return "up";
  }

  return activeReservation === true ? "down" : "idle";
}

export function deriveAiProvidersState(providers: readonly AiProviderComponentStatus[]): ComponentStateValue {
  const configured: AiProviderComponentStatus[] = providers.filter((provider: AiProviderComponentStatus) => provider.configured);

  if (configured.length === 0) {
    return "not_configured";
  }

  if (!configured.some((provider: AiProviderComponentStatus) => provider.available)) {
    return "down";
  }

  return configured.every((provider: AiProviderComponentStatus) => provider.available) ? "up" : "degraded";
}

/*
 * Global state rules:
 * - DOWN when the database is down (no request can be served correctly).
 * - DEGRADED when the MQTT broker is down, the ventilator is offline during an active reservation,
 *   at least one AI provider is configured but none is available (every configured one has its breaker open), or the media storage is down.
 * - OK otherwise. "not_configured" (including no AI provider configured at all), "idle" and a partially degraded AI provider set never lower the global state.
 */
export function evaluateSystemState(components: SystemStatusComponents): SystemStateValue {
  if (components.database.state === "down") {
    return "DOWN";
  }

  const degraded: boolean =
    components.mqttBroker.state === "down" ||
    components.ventilator.state === "down" ||
    components.aiProviders.state === "down" ||
    components.storage.state === "down";

  return degraded ? "DEGRADED" : "OK";
}

export function diffSystemStatus(previous: SystemStatusReport, current: SystemStatusReport): SystemStatusChange | undefined {
  const changedComponents: SystemComponentChange[] = SYSTEM_COMPONENT_NAMES.filter(
    (component: SystemComponentName) => previous.components[component].state !== current.components[component].state,
  ).map(
    (component: SystemComponentName): SystemComponentChange => ({
      component,
      state: current.components[component].state,
      previousState: previous.components[component].state,
    }),
  );

  if (changedComponents.length === 0 && previous.state === current.state) {
    return undefined;
  }

  return { state: current.state, previousState: previous.state, changedComponents, checkedAt: current.checkedAt };
}
