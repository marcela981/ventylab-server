/*
 * Funcionalidad: Comparación del estado del cliente con la repetición del servidor
 * Descripción: Compara la foto que la consola envía al pedir ayuda (signos, gases, gravedad y ajustes) con el estado que el servidor reconstruye al mismo tiempo simulado, con tolerancias por campo; la IA siempre recibe el estado del servidor y una diferencia solo se registra (registro estructurado y telemetría) como DIVERGED, así nunca se confía en el cliente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EngineMetrics, type VentilatorSettings } from "../engine";

export type AssistContextCheck = "MATCH" | "DIVERGED" | "NO_CLIENT_SNAPSHOT";

/** What the console shows when the help is asked (all optional: the client may know only part of it) */
export interface ClientAssistSnapshot {
  readonly spo2Percent?: number;
  readonly pao2MmHg?: number;
  readonly paco2MmHg?: number;
  readonly ph?: number;
  readonly mapMmHg?: number;
  readonly heartRateBpm?: number;
  readonly severity?: number;
  readonly status?: string;
  readonly alarms?: readonly { readonly code: string; readonly severity?: string }[];
  readonly settings?: Partial<Record<"tidalVolumeMl" | "respiratoryRateBpm" | "peepCmH2O" | "fio2", number>> & { readonly mode?: string };
}

export interface AssistContextDifference {
  readonly field: string;
  readonly client: number | string;
  readonly server: number | string;
}

export interface AssistContextComparison {
  readonly check: AssistContextCheck;
  readonly differences: readonly AssistContextDifference[];
}

/**
 * Tolerances absorb the console refresh (metrics up to ~1 s older than its clock) and rounding; anything beyond them
 * means the client and the server simulate different patients (unsent events, tampering or an engine mismatch).
 */
export const ASSIST_CONTEXT_TOLERANCES: Readonly<Record<string, number>> = {
  spo2Percent: 3,
  pao2MmHg: 10,
  paco2MmHg: 5,
  ph: 0.05,
  mapMmHg: 6,
  heartRateBpm: 10,
  severity: 0.1,
};

const SETTING_KEYS: readonly ("tidalVolumeMl" | "respiratoryRateBpm" | "peepCmH2O" | "fio2")[] = ["tidalVolumeMl", "respiratoryRateBpm", "peepCmH2O", "fio2"];
const SETTING_TOLERANCE: number = 1e-6;

function serverValues(metrics: EngineMetrics): Readonly<Record<string, number | null>> {
  return {
    spo2Percent: metrics.gasExchange.spo2Percent,
    pao2MmHg: metrics.gasExchange.pao2MmHg,
    paco2MmHg: metrics.gasExchange.paco2MmHg,
    ph: metrics.gasExchange.ph,
    mapMmHg: metrics.hemodynamics.meanArterialPressureMmHg,
    heartRateBpm: metrics.hemodynamics.heartRateBpm,
    severity: metrics.patient?.severity ?? null,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function compareClientSnapshot(client: ClientAssistSnapshot | undefined, metrics: EngineMetrics, settings: VentilatorSettings): AssistContextComparison {
  if (client === undefined) {
    return { check: "NO_CLIENT_SNAPSHOT", differences: [] };
  }

  const differences: AssistContextDifference[] = [];
  const server: Readonly<Record<string, number | null>> = serverValues(metrics);

  for (const [field, tolerance] of Object.entries(ASSIST_CONTEXT_TOLERANCES)) {
    const clientValue: unknown = (client as Readonly<Record<string, unknown>>)[field];
    const serverValue: number | null = server[field] ?? null;

    if (isFiniteNumber(clientValue) && serverValue !== null && Math.abs(clientValue - serverValue) > tolerance) {
      differences.push({ field, client: clientValue, server: serverValue });
    }
  }

  for (const key of SETTING_KEYS) {
    const clientValue: number | undefined = client.settings?.[key];
    const serverValue: unknown = settings[key];

    if (isFiniteNumber(clientValue) && isFiniteNumber(serverValue) && Math.abs(clientValue - serverValue) > SETTING_TOLERANCE) {
      differences.push({ field: `settings.${key}`, client: clientValue, server: serverValue });
    }
  }

  if (client.settings?.mode !== undefined && client.settings.mode !== settings.mode) {
    differences.push({ field: "settings.mode", client: client.settings.mode, server: settings.mode });
  }

  return { check: differences.length === 0 ? "MATCH" : "DIVERGED", differences };
}
