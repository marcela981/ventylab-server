/*
 * Funcionalidad: Pruebas de SystemStatusService
 * Descripción: Verifica el estado calculado por componente, DOWN con la base de datos caída, DEGRADED con el broker caído y system:status-changed emitido una sola vez por transición a ADMIN y TEACHER (y al recuperarse), la caché por SYSTEM_STATUS_CACHE_SECONDS, que un chequeo colgado no bloquea el estado y que nunca se llama a un modelo de IA
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { SYSTEM_STATUS_CHANGED_EVENT, type SystemStatusChangedPayload } from "@/features/system-status/application/services/system-status.service";
import { createSystemStatusHarness, type SystemStatusHarness } from "@/features/system-status/application/testing/system-status-test-doubles-spec";
import { type SystemStatusReport } from "@/features/system-status/domain/system-status";

const NOW: number = Date.parse("2026-10-11T12:00:00Z");

describe("SystemStatusService", () => {
  let harness: SystemStatusHarness;
  let clock: jest.SpyInstance<number, []>;

  beforeEach(() => {
    harness = createSystemStatusHarness();
    clock = jest.spyOn(Date, "now").mockReturnValue(NOW);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function advance(ms: number): void {
    const current: number = Date.now();

    clock.mockReturnValue(current + ms);
  }

  it("reports OK with every component healthy", async () => {
    harness.getActiveReservation.mockResolvedValue({ id: "reservation-1" });

    const report: SystemStatusReport = await harness.service.getStatus();

    expect(report.state).toBe("OK");
    expect(report.components.database).toMatchObject({ state: "up", reachable: true });
    expect(report.components.mqttBroker).toMatchObject({ state: "up", enabled: true, connected: true, messagesPerSecond: 25 });
    expect(report.components.ventilator).toEqual({ state: "up", online: true, activeReservation: true });
    expect(report.components.aiProviders.providers.find((provider: { provider: string }) => provider.provider === "gemini")).toMatchObject({
      configured: true,
      breaker: "closed",
      available: true,
      latencyP95Ms: 1200,
      errorRate: 0.1,
    });
    expect(report.components.storage.state).toBe("up");
    expect(report.components.process).toMatchObject({ appVersion: "1.0.0", appCommit: "abc1234", engineVersion: "1.0.0", eventLoopLagMs: 1.5 });
    expect(harness.getProviderStats).toHaveBeenCalledWith(new Date(NOW - 15 * 60_000));
  });

  it("never calls a language model while computing the status", async () => {
    await harness.service.refresh();

    expect(harness.llm.calls).toBe(0);
    expect(harness.aiCalls.records).toHaveLength(0);
  });

  it("is DOWN when the database ping fails", async () => {
    harness.ping.mockRejectedValue(new Error("connection refused"));

    const report: SystemStatusReport = await harness.service.refresh();

    expect(report.state).toBe("DOWN");
    expect(report.components.database).toEqual({ state: "down", reachable: false });
  });

  it("does not let a hanging dependency block the status", async () => {
    harness.ping.mockReturnValue(new Promise<void>(() => undefined));
    harness.checkHealth.mockReturnValue(new Promise<never>(() => undefined));
    harness.getActiveReservation.mockReturnValue(new Promise<never>(() => undefined));

    const report: SystemStatusReport = await harness.service.refresh();

    expect(report.state).toBe("DOWN");
    expect(report.components.storage.state).toBe("down");
    expect(report.components.ventilator.activeReservation).toBeUndefined();
  });

  it("is DEGRADED when the ventilator goes offline during an active reservation", async () => {
    harness.getActiveReservation.mockResolvedValue({ id: "reservation-1" });
    harness.ventilator.online = false;

    const report: SystemStatusReport = await harness.service.refresh();

    expect(report.state).toBe("DEGRADED");
    expect(report.components.ventilator.state).toBe("down");
  });

  it("emits system:status-changed once per transition to admins and teachers, and again on recovery", async () => {
    await harness.service.refresh();
    harness.ventilator.brokerConnected = false;

    const degraded: SystemStatusReport = await harness.service.refresh();
    await harness.service.refresh();
    const emittedWhileDown: number = harness.emitToRole.mock.calls.length;
    harness.ventilator.brokerConnected = true;
    const recovered: SystemStatusReport = await harness.service.refresh();

    expect(degraded.state).toBe("DEGRADED");
    expect(emittedWhileDown).toBe(2);
    expect(harness.emitToRole.mock.calls.slice(0, 2).map((call: unknown[]) => call[0])).toEqual(["ADMIN", "TEACHER"]);
    expect(harness.emitToRole.mock.calls[0][1]).toBe(SYSTEM_STATUS_CHANGED_EVENT);
    expect(harness.emitToRole.mock.calls[0][2]).toMatchObject<Partial<SystemStatusChangedPayload>>({
      state: "DEGRADED",
      previousState: "OK",
      changedComponents: [
        { component: "mqttBroker", state: "down", previousState: "up" },
        { component: "ventilator", state: "idle", previousState: "up" },
      ],
    });
    expect(recovered.state).toBe("OK");
    expect(harness.emitToRole).toHaveBeenCalledTimes(4);
    expect(harness.emitToRole.mock.calls[2][2]).toMatchObject({ state: "OK", previousState: "DEGRADED" });
  });

  it("does not emit on the first evaluation", async () => {
    harness.ping.mockRejectedValue(new Error("down"));

    await harness.service.refresh();

    expect(harness.emitToRole).not.toHaveBeenCalled();
  });

  it("serves the cached status within the TTL and recomputes after it", async () => {
    const first: SystemStatusReport = await harness.service.getStatus();
    advance(4_000);
    const cached: SystemStatusReport = await harness.service.getStatus();
    advance(1_500);
    const recomputed: SystemStatusReport = await harness.service.getStatus();

    expect(cached).toBe(first);
    expect(recomputed).not.toBe(first);
    expect(harness.ping).toHaveBeenCalledTimes(2);
  });

  it("shares one evaluation between concurrent refreshes", async () => {
    const [first, second]: SystemStatusReport[] = await Promise.all([harness.service.refresh(), harness.service.refresh()]);

    expect(first).toBe(second);
    expect(harness.ping).toHaveBeenCalledTimes(1);
  });
});
