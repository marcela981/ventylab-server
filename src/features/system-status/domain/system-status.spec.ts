/*
 * Funcionalidad: Pruebas de las reglas del estado del sistema
 * Descripción: Verifica las reglas del estado global (base de datos caída → DOWN; broker, ventilador en reserva activa, IA sin proveedores o almacenamiento caídos → DEGRADED; resto → OK), el estado derivado del ventilador y de los proveedores de IA, y la detección de cambios entre evaluaciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type AiProviderComponentStatus,
  type ComponentStateValue,
  deriveAiProvidersState,
  deriveVentilatorState,
  diffSystemStatus,
  evaluateSystemState,
  type SystemStatusChange,
  type SystemStatusComponents,
  type SystemStatusReport,
} from "@/features/system-status/domain/system-status";

function components(states: Partial<Record<keyof SystemStatusComponents, ComponentStateValue>> = {}): SystemStatusComponents {
  return {
    database: { state: states.database ?? "up", reachable: states.database !== "down" },
    mqttBroker: { state: states.mqttBroker ?? "up", enabled: true, connected: states.mqttBroker !== "down", messagesPerSecond: 0 },
    ventilator: { state: states.ventilator ?? "up", online: states.ventilator === "up" },
    aiProviders: { state: states.aiProviders ?? "up", windowMinutes: 15, providers: [] },
    storage: { state: states.storage ?? "up" },
    process: { state: "up", uptimeSeconds: 1, rssBytes: 1, heapUsedBytes: 1, eventLoopLagMs: 0, appVersion: "1.0.0", engineVersion: "1.0.0" },
  };
}

function report(states: Partial<Record<keyof SystemStatusComponents, ComponentStateValue>> = {}): SystemStatusReport {
  const parts: SystemStatusComponents = components(states);

  return { state: evaluateSystemState(parts), checkedAt: new Date("2026-10-11T12:00:00Z"), components: parts };
}

function provider(overrides: Partial<AiProviderComponentStatus>): AiProviderComponentStatus {
  return { provider: "gemini", configured: true, breaker: "closed", available: true, ...overrides };
}

describe("evaluateSystemState", () => {
  it("is DOWN when the database is down, whatever else happens", () => {
    const parts: SystemStatusComponents = components({ database: "down", mqttBroker: "down" });

    const state: string = evaluateSystemState(parts);

    expect(state).toBe("DOWN");
  });

  it.each([["mqttBroker"], ["ventilator"], ["aiProviders"], ["storage"]] as const)("is DEGRADED when %s is down", (component: keyof SystemStatusComponents) => {
    const parts: SystemStatusComponents = components({ [component]: "down" });

    const state: string = evaluateSystemState(parts);

    expect(state).toBe("DEGRADED");
  });

  it("is OK with idle, not configured or partially degraded components", () => {
    const parts: SystemStatusComponents = components({ ventilator: "idle", mqttBroker: "not_configured", storage: "not_configured", aiProviders: "degraded" });

    const state: string = evaluateSystemState(parts);

    expect(state).toBe("OK");
  });
});

describe("deriveVentilatorState", () => {
  it("is down only when offline during an active reservation", () => {
    expect(deriveVentilatorState(true, false, true)).toBe("down");
    expect(deriveVentilatorState(true, false, false)).toBe("idle");
    expect(deriveVentilatorState(true, false, undefined)).toBe("idle");
    expect(deriveVentilatorState(true, true, true)).toBe("up");
    expect(deriveVentilatorState(false, false, true)).toBe("not_configured");
  });
});

describe("deriveAiProvidersState", () => {
  it("is down when every provider is unconfigured or has its breaker open", () => {
    const providers: AiProviderComponentStatus[] = [
      provider({ provider: "gemini", breaker: "open", available: false }),
      provider({ provider: "openai", configured: false, available: false }),
    ];

    const state: ComponentStateValue = deriveAiProvidersState(providers);

    expect(state).toBe("down");
  });

  it("is degraded when a configured provider is unavailable but another one answers", () => {
    const providers: AiProviderComponentStatus[] = [provider({ breaker: "open", available: false }), provider({ provider: "openai" })];

    const state: ComponentStateValue = deriveAiProvidersState(providers);

    expect(state).toBe("degraded");
  });

  it("is up when every configured provider is available", () => {
    const providers: AiProviderComponentStatus[] = [provider({ breaker: "half_open" }), provider({ provider: "openai", configured: false, available: false })];

    const state: ComponentStateValue = deriveAiProvidersState(providers);

    expect(state).toBe("up");
  });
});

describe("diffSystemStatus", () => {
  it("returns nothing when no state changed", () => {
    const change: SystemStatusChange | undefined = diffSystemStatus(report(), report());

    expect(change).toBeUndefined();
  });

  it("lists the changed components with the global transition", () => {
    const change: SystemStatusChange | undefined = diffSystemStatus(report(), report({ mqttBroker: "down", ventilator: "idle" }));

    expect(change).toMatchObject({
      state: "DEGRADED",
      previousState: "OK",
      changedComponents: [
        { component: "mqttBroker", state: "down", previousState: "up" },
        { component: "ventilator", state: "idle", previousState: "up" },
      ],
    });
  });
});
