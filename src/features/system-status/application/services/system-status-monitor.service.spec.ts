/*
 * Funcionalidad: Pruebas de SystemStatusMonitor y sus manejadores de eventos
 * Descripción: Verifica que el estado se reevalúa al cambiar la conexión MQTT y con los eventos del bus del dispositivo, que el temporizador solo reevalúa mientras hay sockets de ADMIN o TEACHER conectados, y que una caída del broker detectada así emite system:status-changed sin sondeo del cliente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { createSystemStatusHarness, type SystemStatusHarness } from "@/features/system-status/application/testing/system-status-test-doubles-spec";
import { SystemStatusEventsHandlers } from "@/features/system-status/infrastructure/events/system-status-events.handlers";

function flush(): Promise<void> {
  return new Promise<void>((resolve: () => void) => setTimeout(resolve, 50));
}

describe("SystemStatusMonitor", () => {
  let harness: SystemStatusHarness;
  let handlers: SystemStatusEventsHandlers;

  beforeEach(() => {
    harness = createSystemStatusHarness();
    handlers = new SystemStatusEventsHandlers(harness.monitor);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    harness.monitor.onModuleDestroy();
    jest.restoreAllMocks();
  });

  it("re-evaluates when the MQTT connection changes and pushes the transition", async () => {
    harness.monitor.onModuleInit();
    await harness.service.refresh();
    harness.ventilator.brokerConnected = false;

    harness.ventilator.connectionListeners.forEach((listener: (connected: boolean) => void) => listener(false));
    await flush();

    expect(harness.emitToRole).toHaveBeenCalledWith("ADMIN", "system:status-changed", expect.objectContaining({ state: "DEGRADED" }));
    expect(harness.emitToRole).toHaveBeenCalledWith("TEACHER", "system:status-changed", expect.objectContaining({ state: "DEGRADED" }));
  });

  it("re-evaluates on device offline and online bus events", async () => {
    const refresh: jest.SpyInstance = jest.spyOn(harness.service, "refresh");

    handlers.handleDeviceOffline();
    handlers.handleDeviceOnline();
    await flush();

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("runs the periodic re-evaluation only while an admin or teacher socket is connected", () => {
    const refresh: jest.SpyInstance = jest.spyOn(harness.service, "refresh");

    handlers.handleClientAuthenticated({ userId: "student-1", role: "STUDENT", socketId: "s-1" });
    harness.monitor.tick();
    handlers.handleClientAuthenticated({ userId: "teacher-1", role: "TEACHER", socketId: "s-2" });
    harness.monitor.tick();
    handlers.handleClientDisconnected({ userId: "teacher-1", socketId: "s-2", remainingSockets: 0 });
    harness.monitor.tick();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(harness.monitor.watcherCount).toBe(0);
  });
});
