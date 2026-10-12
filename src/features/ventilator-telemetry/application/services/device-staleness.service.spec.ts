/*
 * Funcionalidad: Pruebas de la vigilancia de actividad del ventilador
 * Descripción: Verifica que ventilator:disconnected se emita una sola vez al superar VENTILATOR_STALE_AFTER_MS sin mensajes o al desconectarse el bróker, y que el primer mensaje posterior emita ventilator:connected, con el vigilante de 250 ms y temporizadores falsos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { DeviceStalenessService } from "@/features/ventilator-telemetry/application/services/device-staleness.service";
import {
  buildTelemetrySettings,
  FakeRealtimePublisher,
  FakeTelemetryClock,
} from "@/features/ventilator-telemetry/application/testing/ventilator-telemetry-test-doubles-spec";

function eventsOf(publisher: FakeRealtimePublisher): string[] {
  return publisher.emits.map((emit: { event: string }): string => emit.event);
}

describe("DeviceStalenessService", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts as never and emits connected on the first message", () => {
    const clock: FakeTelemetryClock = new FakeTelemetryClock();
    const publisher: FakeRealtimePublisher = new FakeRealtimePublisher();
    const staleness: DeviceStalenessService = new DeviceStalenessService(buildTelemetrySettings(), publisher, clock, { publish: jest.fn() });
    const initial: string = staleness.state;

    staleness.markMessage(clock.nowMs);
    staleness.markMessage(clock.nowMs + 10);

    expect(initial).toBe("never");
    expect(staleness.state).toBe("online");
    expect(eventsOf(publisher)).toEqual(["ventilator:connected"]);
    expect(publisher.emits[0].method).toBe("broadcast");
  });

  it("emits disconnected once after the stale timeout and connected again on the next message", () => {
    jest.useFakeTimers();
    const clock: FakeTelemetryClock = new FakeTelemetryClock();
    const publisher: FakeRealtimePublisher = new FakeRealtimePublisher();
    const staleness: DeviceStalenessService = new DeviceStalenessService(buildTelemetrySettings({ staleAfterMs: 2000 }), publisher, clock, { publish: jest.fn() });

    staleness.start();
    staleness.markMessage(clock.nowMs);
    clock.advance(2000);
    jest.advanceTimersByTime(250);
    const stillOnline: string = staleness.state;

    clock.advance(250);
    jest.advanceTimersByTime(250);
    clock.advance(5000);
    jest.advanceTimersByTime(5000);
    const staleEvents: string[] = eventsOf(publisher);

    staleness.markMessage(clock.nowMs);
    staleness.stop();

    expect(stillOnline).toBe("online");
    expect(staleEvents).toEqual(["ventilator:connected", "ventilator:disconnected"]);
    expect(publisher.emits[1].payload).toEqual(expect.objectContaining({ reason: "device_stale" }));
    expect(eventsOf(publisher)).toEqual(["ventilator:connected", "ventilator:disconnected", "ventilator:connected"]);
  });

  it("marks the device offline when the broker disconnects", () => {
    const clock: FakeTelemetryClock = new FakeTelemetryClock();
    const publisher: FakeRealtimePublisher = new FakeRealtimePublisher();
    const staleness: DeviceStalenessService = new DeviceStalenessService(buildTelemetrySettings(), publisher, clock, { publish: jest.fn() });

    staleness.markMessage(clock.nowMs);
    staleness.markBrokerDisconnected();
    staleness.markBrokerDisconnected();

    expect(staleness.state).toBe("stale");
    expect(eventsOf(publisher)).toEqual(["ventilator:connected", "ventilator:disconnected"]);
    expect(publisher.emits[1].payload).toEqual(expect.objectContaining({ reason: "broker_disconnected" }));
  });

  it("publishes the device online and offline domain events once per transition", () => {
    const clock: FakeTelemetryClock = new FakeTelemetryClock();
    const published: DomainEvent[] = [];
    const staleness: DeviceStalenessService = new DeviceStalenessService(buildTelemetrySettings(), new FakeRealtimePublisher(), clock, {
      publish: (events: DomainEvent[]): void => {
        published.push(...events);
      },
    });

    staleness.markMessage(clock.nowMs);
    staleness.markMessage(clock.nowMs + 10);
    staleness.markBrokerDisconnected();
    staleness.markBrokerDisconnected();

    expect(published.map((event: DomainEvent): string => event.constructor.name)).toEqual(["VentilatorDeviceOnlineEvent", "VentilatorDeviceOfflineEvent"]);
    expect(published[1]).toEqual(expect.objectContaining({ reason: "broker_disconnected", lastMessageAt: new Date(clock.nowMs + 10) }));
  });
});
