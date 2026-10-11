/*
 * Funcionalidad: Pruebas del ciclo de vida de los comandos enviados
 * Descripción: Verifica la resolución por acuse (applied y pending → ACKED, rejected → REJECTED con motivo, acuses desconocidos o mal formados ignorados), por parámetros aplicados en la telemetría (APPLIED dentro de la tolerancia), por tiempo máximo (TIMEOUT), por publicación sin confirmar (TIMEOUT publish_unconfirmed, sin fugas de temporizadores ni doble resolución) y al apagar (TIMEOUT server_shutdown_unconfirmed si la publicación seguía en curso), la latencia, el orden de las escrituras por comando y la suscripción al tópico de acuse con prefijo de pruebas
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { VENTILATOR_COMMAND_STATUS_EVENT, type VentilatorCommandStatusPayload } from "@/features/ventilator-commands/application/realtime/ventilator-commands-events";
import {
  createVentilatorCommandsHarness,
  REAL_ACK_TOPIC,
  TEST_TOPIC_PREFIX,
  type VentilatorCommandsHarness,
} from "@/features/ventilator-commands/application/testing/ventilator-commands-test-doubles-spec";
import { VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";

const ACK_TOPIC: string = `${TEST_TOPIC_PREFIX}/${REAL_ACK_TOPIC}`;

function newCommand(id: string = "cmd-1"): VentilatorCommand {
  return VentilatorCommand.create({
    correlationId: id,
    reservationId: "res-1",
    userId: "student-1",
    params: { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 },
    encoding: "json",
    encodedPayload: "{}",
    now: new Date(),
  });
}

function frame(settings: Record<string, number>, mode?: string): TelemetryFrame {
  return { serverTs: Date.now(), pressure: 10, flow: 0, volume: 0, deviceId: "dev", settings, mode };
}

function lifecycleHarness(overrides: Parameters<typeof createVentilatorCommandsHarness>[0] = {}): VentilatorCommandsHarness {
  const harness: VentilatorCommandsHarness = createVentilatorCommandsHarness(overrides);

  harness.telemetry.roomReservationResolver = (): string => "res-1";

  return harness;
}

function statuses(harness: VentilatorCommandsHarness): string[] {
  return harness.realtime.payloadsOf<VentilatorCommandStatusPayload>(VENTILATOR_COMMAND_STATUS_EVENT).map((payload: VentilatorCommandStatusPayload): string => payload.status);
}

describe("CommandLifecycleService", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-10T12:00:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("subscribes to the prefixed acknowledgement topic with QoS 1 when it is configured", () => {
    const harness: VentilatorCommandsHarness = lifecycleHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });

    expect(harness.mqtt.subscriptions).toEqual([{ topic: ACK_TOPIC, qos: 1 }]);
  });

  it.each(["applied", "pending"])("resolves an acknowledgement with status %s as ACKED with its latency", async (status: string) => {
    const harness: VentilatorCommandsHarness = lifecycleHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });
    const command: VentilatorCommand = newCommand();

    harness.lifecycle.recordSent(command);
    jest.advanceTimersByTime(120);
    harness.mqtt.deliver(ACK_TOPIC, JSON.stringify({ commandId: "cmd-1", deviceId: "dev", ackedAt: "x", status }));
    await harness.lifecycle.flushPersistence();

    expect(command.status).toBe("ACKED");
    expect(command.latencyMs).toBe(120);
    expect(statuses(harness)).toEqual(["SENT", "ACKED"]);
    expect(harness.repository.writes.map((write: VentilatorCommand): string => write.status)).toEqual(["SENT", "ACKED"]);
    expect(harness.lifecycle.inFlightCount).toBe(0);
  });

  it("resolves a rejected acknowledgement as REJECTED with the device reason", () => {
    const harness: VentilatorCommandsHarness = lifecycleHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });
    const command: VentilatorCommand = newCommand();

    harness.lifecycle.recordSent(command);
    harness.mqtt.deliver(ACK_TOPIC, JSON.stringify({ correlationId: "cmd-1", status: "rejected", reason: "valve_fault" }));

    expect([command.status, command.rejectReason]).toEqual(["REJECTED", "valve_fault"]);
  });

  it("ignores acknowledgements for unknown commands, malformed messages and other topics", () => {
    const harness: VentilatorCommandsHarness = lifecycleHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });
    const command: VentilatorCommand = newCommand();

    harness.lifecycle.recordSent(command);
    harness.mqtt.deliver(ACK_TOPIC, JSON.stringify({ commandId: "cmd-unknown", status: "applied" }));
    harness.mqtt.deliver(ACK_TOPIC, "not json");
    harness.mqtt.deliver(ACK_TOPIC, JSON.stringify({ commandId: "cmd-1", status: "done" }));
    harness.mqtt.deliver("/ventynet/data", JSON.stringify({ commandId: "cmd-1", status: "applied" }));

    expect(command.status).toBe("SENT");
  });

  it("resolves APPLIED when a frame reports the same settings within the tolerance and no acknowledgement topic is configured", () => {
    const harness: VentilatorCommandsHarness = lifecycleHarness();
    const command: VentilatorCommand = newCommand();

    harness.lifecycle.recordSent(command);
    harness.telemetry.emitFrame(frame({ tidalVolume: 480, respiratoryRate: 14, peep: 5, fio2: 0.4 }));
    expect(command.status).toBe("SENT");

    harness.telemetry.emitFrame(frame({ tidalVolume: 460, respiratoryRate: 14, peep: 5.1, fio2: 0.41 }, "vcv"));

    expect(command.status).toBe("APPLIED");
  });

  it("does not resolve APPLIED from frames without settings or with another mode", () => {
    const harness: VentilatorCommandsHarness = lifecycleHarness();
    const command: VentilatorCommand = newCommand();

    harness.lifecycle.recordSent(command);
    harness.telemetry.emitFrame({ serverTs: 0, pressure: 1, flow: 1, volume: 1, deviceId: "dev" });
    harness.telemetry.emitFrame(frame({ tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 }, "PCV"));

    expect(command.status).toBe("SENT");
  });

  it("times out after VENTILATOR_COMMAND_TIMEOUT_MS and never leaves a command SENT", () => {
    const harness: VentilatorCommandsHarness = lifecycleHarness();
    const command: VentilatorCommand = newCommand();

    harness.lifecycle.recordSent(command);
    jest.advanceTimersByTime(2999);
    expect(command.status).toBe("SENT");

    jest.advanceTimersByTime(1);

    expect([command.status, command.latencyMs]).toEqual(["TIMEOUT", 3000]);
    expect(harness.lifecycle.inFlightCount).toBe(0);
  });

  it("does not time out a command already acknowledged", () => {
    const harness: VentilatorCommandsHarness = lifecycleHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });
    const command: VentilatorCommand = newCommand();

    harness.lifecycle.recordSent(command);
    harness.mqtt.deliver(ACK_TOPIC, JSON.stringify({ commandId: "cmd-1", status: "applied" }));
    jest.advanceTimersByTime(10_000);

    expect(statuses(harness)).toEqual(["SENT", "ACKED"]);
  });

  it("resolves every SENT command as TIMEOUT on shutdown", () => {
    const harness: VentilatorCommandsHarness = lifecycleHarness();
    const commands: VentilatorCommand[] = [newCommand("a"), newCommand("b")];

    commands.forEach((command: VentilatorCommand): void => harness.lifecycle.recordSent(command));
    harness.lifecycle.stop();

    expect(commands.map((command: VentilatorCommand): string => command.status)).toEqual(["TIMEOUT", "TIMEOUT"]);
  });

  it("keeps the writes of each command in transition order", async () => {
    const harness: VentilatorCommandsHarness = lifecycleHarness();
    const command: VentilatorCommand = newCommand();

    harness.lifecycle.recordSent(command);
    jest.advanceTimersByTime(3000);
    await harness.lifecycle.flushPersistence();

    expect(harness.repository.writes.map((write: VentilatorCommand): string => write.status)).toEqual(["SENT", "TIMEOUT"]);
    expect(harness.repository.rows.get("cmd-1")?.status).toBe("TIMEOUT");
  });

  it("ends a command whose publish is still unconfirmed on shutdown as TIMEOUT server_shutdown_unconfirmed and ignores its late publish outcome", () => {
    const harness: VentilatorCommandsHarness = lifecycleHarness();
    const command: VentilatorCommand = newCommand();

    harness.lifecycle.track(command);
    harness.lifecycle.stop();
    harness.lifecycle.recordSent(command);
    harness.lifecycle.recordPublishFailure(command, "MqttNotConnectedError");

    expect([command.status, command.rejectReason, command.sentAt]).toEqual(["TIMEOUT", "server_shutdown_unconfirmed", undefined]);
    expect(statuses(harness)).toEqual(["TIMEOUT"]);
    expect(harness.lifecycle.inFlightCount).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  describe("publish confirmation timeout", () => {
    it("ends a command whose publish never settles as TIMEOUT publish_unconfirmed after VENTILATOR_COMMAND_TIMEOUT_MS", () => {
      const harness: VentilatorCommandsHarness = lifecycleHarness();
      const command: VentilatorCommand = newCommand();

      harness.lifecycle.track(command);
      jest.advanceTimersByTime(2999);
      expect(command.status).toBe("PENDING");

      jest.advanceTimersByTime(1);

      expect([command.status, command.rejectReason, command.sentAt]).toEqual(["TIMEOUT", "publish_unconfirmed", undefined]);
      expect(statuses(harness)).toEqual(["TIMEOUT"]);
      expect(harness.lifecycle.inFlightCount).toBe(0);
    });

    it("ignores a publish that settles after the publish confirmation timeout", () => {
      const harness: VentilatorCommandsHarness = lifecycleHarness();
      const resolved: VentilatorCommand = newCommand("late-resolve");
      const rejected: VentilatorCommand = newCommand("late-reject");

      harness.lifecycle.track(resolved);
      harness.lifecycle.track(rejected);
      jest.advanceTimersByTime(3000);
      harness.lifecycle.recordSent(resolved);
      harness.lifecycle.recordPublishFailure(rejected, "MqttNotConnectedError");
      jest.advanceTimersByTime(10_000);

      expect([resolved.status, rejected.status]).toEqual(["TIMEOUT", "TIMEOUT"]);
      expect(statuses(harness)).toEqual(["TIMEOUT", "TIMEOUT"]);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("replaces the publish confirmation timer with the response timer once the publish is confirmed", () => {
      const harness: VentilatorCommandsHarness = lifecycleHarness();
      const command: VentilatorCommand = newCommand();

      harness.lifecycle.track(command);
      jest.advanceTimersByTime(2000);
      harness.lifecycle.recordSent(command);
      jest.advanceTimersByTime(2999);
      expect([command.status, jest.getTimerCount()]).toEqual(["SENT", 1]);

      jest.advanceTimersByTime(1);

      expect([command.status, command.rejectReason, command.latencyMs]).toEqual(["TIMEOUT", undefined, 3000]);
      expect(statuses(harness)).toEqual(["SENT", "TIMEOUT"]);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("clears the publish confirmation timer when the publish fails", () => {
      const harness: VentilatorCommandsHarness = lifecycleHarness();
      const command: VentilatorCommand = newCommand();

      harness.lifecycle.track(command);
      harness.lifecycle.recordPublishFailure(command, "MqttNotConnectedError");

      expect(jest.getTimerCount()).toBe(0);
      jest.advanceTimersByTime(10_000);
      expect([command.status, command.rejectReason]).toEqual(["REJECTED", "MqttNotConnectedError"]);
      expect(statuses(harness)).toEqual(["REJECTED"]);
    });

    it("discards an early acknowledgement when the publish is never confirmed and keeps exactly one terminal state", () => {
      const harness: VentilatorCommandsHarness = lifecycleHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });
      const command: VentilatorCommand = newCommand();

      harness.lifecycle.track(command);
      harness.mqtt.deliver(ACK_TOPIC, JSON.stringify({ commandId: "cmd-1", status: "applied" }));
      jest.advanceTimersByTime(3000);
      harness.lifecycle.recordSent(command);

      expect([command.status, command.rejectReason]).toEqual(["TIMEOUT", "publish_unconfirmed"]);
      expect(statuses(harness)).toEqual(["TIMEOUT"]);
      expect(harness.lifecycle.inFlightCount).toBe(0);
    });
  });

  it("stops waiting for pending writes after the shutdown timeout", async () => {
    const harness: VentilatorCommandsHarness = lifecycleHarness();

    harness.repository.save = async (): Promise<void> => await new Promise<void>((): void => undefined);
    harness.lifecycle.recordSent(newCommand());

    const flushed: Promise<boolean> = harness.lifecycle.flushPersistence(2000);

    await jest.advanceTimersByTimeAsync(2000);

    expect(await flushed).toBe(false);
  });
});
