/*
 * Funcionalidad: Pruebas de la conexión MQTT del ventilador
 * Descripción: Verifica con un cliente MQTT falso (sin red) el cliente único por proceso (reutiliza el propio y cierra el anterior en recarga en caliente), el retroceso exponencial con fluctuación que crece, se limita al máximo y no se rinde, la restauración de suscripciones al conectar, la publicación con QoS y el modo deshabilitado sin MQTT_BROKER_URL
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { buildTelemetrySettings, FakeMqttClient } from "@/features/ventilator-telemetry/application/testing/ventilator-telemetry-test-doubles-spec";
import { type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { type MqttClientFactory, type MqttClientLike, registeredMqttClient } from "@/features/ventilator-telemetry/infrastructure/mqtt/mqtt-client";
import { MqttVentilatorConnection } from "@/features/ventilator-telemetry/infrastructure/mqtt/mqtt-ventilator.connection";
import { computeReconnectDelay } from "@/features/ventilator-telemetry/infrastructure/mqtt/reconnect-backoff";

interface FactoryFixture {
  readonly factory: MqttClientFactory;
  readonly clients: FakeMqttClient[];
}

function fakeFactory(): FactoryFixture {
  const clients: FakeMqttClient[] = [];

  const factory: MqttClientFactory = (): MqttClientLike => {
    const client: FakeMqttClient = new FakeMqttClient();

    clients.push(client);

    return client;
  };

  return { factory, clients };
}

describe("computeReconnectDelay", () => {
  it("grows exponentially, stays within the jitter band and is capped at the maximum", () => {
    const minimum: number[] = [0, 1, 2, 3, 4, 5, 10, 100].map((attempt: number): number => computeReconnectDelay(attempt, 1000, 30000, 0));
    const maximum: number[] = [0, 1, 2, 3, 4, 5, 10, 100].map((attempt: number): number => computeReconnectDelay(attempt, 1000, 30000, 1));

    expect(maximum).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000]);
    expect(minimum).toEqual([500, 1000, 2000, 4000, 8000, 15000, 15000, 15000]);
  });
});

describe("MqttVentilatorConnection", () => {
  let connections: MqttVentilatorConnection[] = [];

  function build(settings: VentilatorTelemetrySettings, factory: MqttClientFactory): MqttVentilatorConnection {
    const connection: MqttVentilatorConnection = new MqttVentilatorConnection(settings, factory);

    connections.push(connection);

    return connection;
  }

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation((): void => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation((): void => undefined);
  });

  afterEach(() => {
    for (const connection of connections) {
      connection.stop();
    }

    connections = [];
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("creates a single client and reuses it when started twice", () => {
    const { factory, clients }: FactoryFixture = fakeFactory();
    const connection: MqttVentilatorConnection = build(buildTelemetrySettings(), factory);

    connection.start();
    connection.start();

    expect(clients).toHaveLength(1);
    expect(registeredMqttClient()).toBe(clients[0]);
  });

  it("ends the previous client before a second instance creates its own (hot reload)", () => {
    const { factory, clients }: FactoryFixture = fakeFactory();
    const first: MqttVentilatorConnection = build(buildTelemetrySettings(), factory);
    const second: MqttVentilatorConnection = build(buildTelemetrySettings(), factory);

    first.start();
    second.start();

    expect(clients).toHaveLength(2);
    expect(clients[0].ended).toBe(true);
    expect(clients[1].ended).toBe(false);
    expect(registeredMqttClient()).toBe(clients[1]);
  });

  it("ends the client on stop", () => {
    const { factory, clients }: FactoryFixture = fakeFactory();
    const connection: MqttVentilatorConnection = build(buildTelemetrySettings(), factory);

    connection.start();
    connection.stop();

    expect(clients[0].ended).toBe(true);
    expect(registeredMqttClient()).toBeUndefined();
  });

  it("restores subscriptions with their qos on every connect and notifies connection changes", () => {
    const { factory, clients }: FactoryFixture = fakeFactory();
    const connection: MqttVentilatorConnection = build(buildTelemetrySettings(), factory);
    const states: boolean[] = [];

    connection.subscribe("/ventynet/data", 0);
    connection.subscribe("ventilab/device/001/alarm", 1);
    connection.onConnectionChange((connected: boolean): void => {
      states.push(connected);
    });
    connection.start();
    clients[0].simulateConnect();

    expect(clients[0].subscriptions).toEqual([{ topic: "/ventynet/data", qos: 0 }, { topic: "ventilab/device/001/alarm", qos: 1 }]);
    expect(connection.isConnected).toBe(true);
    expect(states).toEqual([true]);
  });

  it("reconnects forever with exponential backoff capped at the maximum", () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(1);
    const { factory, clients }: FactoryFixture = fakeFactory();
    const connection: MqttVentilatorConnection = build(buildTelemetrySettings({
      mqtt: { brokerUrl: "mqtt://broker.test:1883", clientId: "test", reconnectBaseMs: 1000, reconnectMaxMs: 8000 },
    }), factory);
    const observedDelays: number[] = [];

    connection.start();

    for (let attempt: number = 0; attempt < 12; attempt++) {
      clients[0].simulateClose();
      const before: number = clients[0].reconnectCalls;
      let waited: number = 0;

      while (clients[0].reconnectCalls === before) {
        jest.advanceTimersByTime(500);
        waited += 500;
      }

      observedDelays.push(waited);
    }

    expect(observedDelays.slice(0, 5)).toEqual([1000, 2000, 4000, 8000, 8000]);
    expect(observedDelays.slice(5).every((delay: number): boolean => delay === 8000)).toBe(true);
    expect(clients[0].reconnectCalls).toBe(12);
    expect(clients).toHaveLength(1);
  });

  it("resets the backoff after a successful connection", () => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(1);
    const { factory, clients }: FactoryFixture = fakeFactory();
    const connection: MqttVentilatorConnection = build(buildTelemetrySettings(), factory);

    connection.start();
    clients[0].simulateClose();
    jest.advanceTimersByTime(1000);
    clients[0].simulateClose();
    jest.advanceTimersByTime(2000);
    clients[0].simulateConnect();
    clients[0].simulateClose();
    jest.advanceTimersByTime(999);
    const beforeBase: number = clients[0].reconnectCalls;

    jest.advanceTimersByTime(1);

    expect(beforeBase).toBe(2);
    expect(clients[0].reconnectCalls).toBe(3);
  });

  it("publishes with the requested qos only while connected", async () => {
    const { factory, clients }: FactoryFixture = fakeFactory();
    const connection: MqttVentilatorConnection = build(buildTelemetrySettings(), factory);

    connection.start();
    const whileDisconnected: Promise<void> = connection.publish("ventilab/device/001/command", "{}", { qos: 1 });

    clients[0].simulateConnect();
    await connection.publish("ventilab/device/001/command", "{\"peep\":5}", { qos: 1 });

    await expect(whileDisconnected).rejects.toThrow("MQTT broker is not connected");
    expect(clients[0].published).toEqual([{ topic: "ventilab/device/001/command", payload: "{\"peep\":5}", qos: 1 }]);
  });

  it("does not crash when the client cannot be created", () => {
    jest.spyOn(Logger.prototype, "error").mockImplementation((): void => undefined);
    const throwingFactory: MqttClientFactory = (): MqttClientLike => {
      throw new Error("Unknown protocol");
    };
    const connection: MqttVentilatorConnection = build(buildTelemetrySettings(), throwingFactory);

    expect(() => connection.start()).not.toThrow();
    expect(connection.isConnected).toBe(false);
  });

  it("stays disabled without a broker url", () => {
    const { factory, clients }: FactoryFixture = fakeFactory();
    const connection: MqttVentilatorConnection = build(buildTelemetrySettings({ mqtt: undefined }), factory);

    connection.start();

    expect(connection.isEnabled).toBe(false);
    expect(connection.brokerUrl).toBeUndefined();
    expect(clients).toHaveLength(0);
  });

  it("hides broker credentials", () => {
    const connection: MqttVentilatorConnection = build(buildTelemetrySettings({
      mqtt: { brokerUrl: "mqtt://user:secret@broker.test:1883", clientId: "test", reconnectBaseMs: 1000, reconnectMaxMs: 30000 },
    }), fakeFactory().factory);

    expect(connection.brokerUrl).toBe("mqtt://broker.test:1883");
  });
});
