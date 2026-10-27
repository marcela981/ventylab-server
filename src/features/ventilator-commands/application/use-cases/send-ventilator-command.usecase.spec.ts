/*
 * Funcionalidad: Pruebas del envío de comandos al ventilador físico
 * Descripción: Verifica el orden de las guardas (403 sin reserva o no titular, 423 no operador, 429 frecuencia, 422 validación con violaciones, 503 dispositivo fuera de línea sin publicar), la publicación QoS 1 en el tópico con prefijo de pruebas con el JSON plano y el correlationId, el estado SENT emitido y persistido, el fallo de publicación registrado como REJECTED, el estado real sin hora de envío inventada cuando el servidor se apaga con la publicación en curso y la pérdida inmediata del control al desplazarse la reserva; el operador de la reserva de grupo es su líder
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ReservationPreemptedEvent } from "@/features/reservations/domain/events/reservation.events";
import { SendVentilatorCommandCommand, VentilatorControlCommand } from "@/features/ventilator-commands/application/commands/ventilator-commands.commands";
import { VENTILATOR_COMMAND_STATUS_EVENT, type VentilatorCommandStatusPayload } from "@/features/ventilator-commands/application/realtime/ventilator-commands-events";
import { type SentVentilatorCommandResult } from "@/features/ventilator-commands/application/results/ventilator-commands.results";
import {
  createVentilatorCommandsHarness,
  OTHER_RESERVATION,
  REAL_ACK_TOPIC,
  REAL_COMMAND_TOPIC,
  RESERVATION,
  TEST_TOPIC_PREFIX,
  VALID_COMMAND,
  type VentilatorCommandsHarness,
} from "@/features/ventilator-commands/application/testing/ventilator-commands-test-doubles-spec";
import {
  InvalidVentilatorCommandError,
  NoActiveVentilatorReservationError,
  NotReservationHolderError,
  NotVentilatorOperatorError,
  VentilatorCommandRateLimitedError,
  VentilatorDeviceOfflineError,
} from "@/features/ventilator-commands/domain/ventilator-commands.errors";

function sendAs(harness: VentilatorCommandsHarness, userId: string, role: string, params: unknown = VALID_COMMAND): Promise<SentVentilatorCommandResult> {
  return harness.send.execute(new SendVentilatorCommandCommand({ userId, role, params }));
}

function commandStatuses(harness: VentilatorCommandsHarness): string[] {
  return harness.realtime.payloadsOf<VentilatorCommandStatusPayload>(VENTILATOR_COMMAND_STATUS_EVENT).map((payload: VentilatorCommandStatusPayload): string => payload.status);
}

async function operatorHarness(overrides: Parameters<typeof createVentilatorCommandsHarness>[0] = {}): Promise<VentilatorCommandsHarness> {
  const harness: VentilatorCommandsHarness = createVentilatorCommandsHarness(overrides);

  // Only the leader of the holder group operates; student-1 leads it here
  harness.reservations.activate(RESERVATION, ["student-1", "leader-1"], ["student-1"]);
  await harness.takeControl.execute(new VentilatorControlCommand({ userId: "student-1", role: "STUDENT" }), "take");

  return harness;
}

describe("SendVentilatorCommandUseCase", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("rejects with 403 when no reservation is active", async () => {
    const harness: VentilatorCommandsHarness = createVentilatorCommandsHarness();

    await expect(sendAs(harness, "student-1", "STUDENT")).rejects.toBeInstanceOf(NoActiveVentilatorReservationError);
    expect(harness.mqtt.publishes).toHaveLength(0);
  });

  it("rejects with 403 a student who is not a holder", async () => {
    const harness: VentilatorCommandsHarness = await operatorHarness();

    await expect(sendAs(harness, "intruder", "STUDENT")).rejects.toBeInstanceOf(NotReservationHolderError);
    expect(harness.mqtt.publishes).toHaveLength(0);
  });

  it("rejects with 423 a holder who is not the operator", async () => {
    const harness: VentilatorCommandsHarness = await operatorHarness();

    await expect(sendAs(harness, "leader-1", "STUDENT")).rejects.toBeInstanceOf(NotVentilatorOperatorError);
    expect(harness.mqtt.publishes).toHaveLength(0);
  });

  it("rejects with 429 and a retry time once the burst is used", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-10T12:10:00Z") });
    const harness: VentilatorCommandsHarness = await operatorHarness();

    for (let i: number = 0; i < 5; i += 1) {
      await sendAs(harness, "student-1", "STUDENT");
    }

    const error: unknown = await sendAs(harness, "student-1", "STUDENT").catch((caught: unknown): unknown => caught);

    expect(error).toBeInstanceOf(VentilatorCommandRateLimitedError);
    expect((error as VentilatorCommandRateLimitedError).retryAt.getTime()).toBe(Date.now() + 200);
    expect(harness.mqtt.publishes).toHaveLength(5);
  });

  it("rejects with 422 and the violations when the command is invalid", async () => {
    const harness: VentilatorCommandsHarness = await operatorHarness();

    const error: unknown = await sendAs(harness, "student-1", "STUDENT", { ...VALID_COMMAND, tidalVolume: Number.NaN, peep: "5" }).catch((caught: unknown): unknown => caught);

    expect(error).toBeInstanceOf(InvalidVentilatorCommandError);
    expect((error as InvalidVentilatorCommandError).details.violations.map((violation: { field: string }): string => violation.field)).toEqual(["tidalVolume", "peep"]);
    expect(harness.mqtt.publishes).toHaveLength(0);
  });

  it("rejects with 503 without publishing when the device is offline", async () => {
    const harness: VentilatorCommandsHarness = await operatorHarness();

    harness.telemetry.deviceOnline = false;

    await expect(sendAs(harness, "student-1", "STUDENT")).rejects.toBeInstanceOf(VentilatorDeviceOfflineError);
    expect(harness.mqtt.publishes).toHaveLength(0);
    expect(harness.repository.writes).toHaveLength(0);
  });

  it("rejects with 503 without publishing when the broker is disconnected", async () => {
    const harness: VentilatorCommandsHarness = await operatorHarness();

    harness.mqtt.isConnected = false;

    await expect(sendAs(harness, "student-1", "STUDENT")).rejects.toBeInstanceOf(VentilatorDeviceOfflineError);
    expect(harness.mqtt.publishes).toHaveLength(0);
  });

  it("publishes the flat JSON with its correlationId on the prefixed test topic with QoS 1", async () => {
    const harness: VentilatorCommandsHarness = await operatorHarness();

    const result: SentVentilatorCommandResult = await sendAs(harness, "student-1", "STUDENT");
    await harness.lifecycle.flushPersistence();

    expect(harness.mqtt.publishes).toHaveLength(1);
    expect(harness.mqtt.publishes[0].topic).toBe(`${TEST_TOPIC_PREFIX}/${REAL_COMMAND_TOPIC}`);
    expect(harness.mqtt.publishes[0].options).toEqual({ qos: 1 });
    expect(JSON.parse(String(harness.mqtt.publishes[0].payload))).toEqual({ ...VALID_COMMAND, correlationId: result.commandId });
    expect(result.status).toBe("SENT");
    expect(harness.realtime.payloadsOf<VentilatorCommandStatusPayload>(VENTILATOR_COMMAND_STATUS_EVENT).map((payload: VentilatorCommandStatusPayload): string => payload.status)).toEqual(["SENT"]);
    expect(harness.repository.writes.map((command: { status: string }): string => command.status)).toEqual(["SENT"]);
  });

  it("lets a teacher who took control command without being a holder", async () => {
    const harness: VentilatorCommandsHarness = createVentilatorCommandsHarness();

    harness.reservations.activate(RESERVATION, ["student-1"]);
    await harness.takeControl.execute(new VentilatorControlCommand({ userId: "teacher-9", role: "TEACHER" }), "take");

    const result: SentVentilatorCommandResult = await sendAs(harness, "teacher-9", "TEACHER");

    expect(result.reservationId).toBe(RESERVATION.id);
    expect(harness.mqtt.publishes).toHaveLength(1);
  });

  it("records a failed publish as REJECTED and answers 503", async () => {
    const harness: VentilatorCommandsHarness = await operatorHarness();

    harness.mqtt.failPublish = true;

    await expect(sendAs(harness, "student-1", "STUDENT")).rejects.toBeInstanceOf(VentilatorDeviceOfflineError);
    await harness.lifecycle.flushPersistence();

    expect(harness.repository.writes.map((command: { status: string; rejectReason?: string }): string => `${command.status}:${command.rejectReason}`)).toEqual(["REJECTED:MqttNotConnectedError"]);
    expect(harness.lifecycle.inFlightCount).toBe(0);
  });

  it("keeps publishing when persistence fails", async () => {
    const harness: VentilatorCommandsHarness = await operatorHarness();

    harness.repository.failWrites = true;

    const result: SentVentilatorCommandResult = await sendAs(harness, "student-1", "STUDENT");
    await harness.lifecycle.flushPersistence();

    expect(result.status).toBe("SENT");
    expect(harness.mqtt.publishes).toHaveLength(1);
  });

  it("revokes control when the active reservation is preempted and answers 403 to the next command", async () => {
    const harness: VentilatorCommandsHarness = await operatorHarness();

    harness.reservations.activate(OTHER_RESERVATION, ["teacher-1"]);
    harness.handlers.handleReservationPreempted(
      new ReservationPreemptedEvent({
        reservationId: RESERVATION.id,
        previousHolder: { type: "GROUP", groupId: "group-1" },
        window: { startsAt: RESERVATION.startsAt, endsAt: RESERVATION.endsAt },
        wasActive: true,
        preemptedById: "teacher-1",
        replacedByReservationId: OTHER_RESERVATION.id,
      }),
    );

    expect(harness.control.state).toBeUndefined();
    await expect(sendAs(harness, "student-1", "STUDENT")).rejects.toBeInstanceOf(NotReservationHolderError);
    expect(harness.mqtt.publishes).toHaveLength(0);
  });

  describe("acknowledgements and matching frames that arrive before the publish resolves", () => {
    const ACK_TOPIC: string = `${TEST_TOPIC_PREFIX}/${REAL_ACK_TOPIC}`;

    function correlationIdOf(payload: string | Buffer): string {
      return String((JSON.parse(String(payload)) as { correlationId: string }).correlationId);
    }

    it("resolves ACKED when the device acknowledges before the broker confirms the publish", async () => {
      jest.useFakeTimers({ now: new Date("2026-10-10T12:10:00Z") });
      const harness: VentilatorCommandsHarness = await operatorHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });

      harness.mqtt.beforePublishResolves = (_topic: string, payload: string | Buffer): void => {
        harness.mqtt.deliver(ACK_TOPIC, JSON.stringify({ commandId: correlationIdOf(payload), status: "applied" }));
      };

      await sendAs(harness, "student-1", "STUDENT");
      jest.advanceTimersByTime(10_000);
      await harness.lifecycle.flushPersistence();

      expect(commandStatuses(harness)).toEqual(["SENT", "ACKED"]);
      expect(harness.repository.writes.map((command: { status: string }): string => command.status)).toEqual(["SENT", "ACKED"]);
      expect(harness.lifecycle.inFlightCount).toBe(0);
    });

    it("resolves APPLIED when a matching frame arrives before the broker confirms the publish", async () => {
      jest.useFakeTimers({ now: new Date("2026-10-10T12:10:00Z") });
      const harness: VentilatorCommandsHarness = await operatorHarness();

      harness.mqtt.beforePublishResolves = (): void => {
        harness.telemetry.emitFrame({ serverTs: Date.now(), pressure: 10, flow: 0, volume: 0, deviceId: "dev", settings: { tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 }, mode: "VCV" });
      };

      await sendAs(harness, "student-1", "STUDENT");
      jest.advanceTimersByTime(10_000);

      expect(commandStatuses(harness)).toEqual(["SENT", "APPLIED"]);
      expect(harness.lifecycle.inFlightCount).toBe(0);
    });

    it("keeps exactly one terminal state when the early acknowledgement is followed by a failed publish", async () => {
      const harness: VentilatorCommandsHarness = await operatorHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });

      harness.mqtt.beforePublishResolves = (_topic: string, payload: string | Buffer): void => {
        harness.mqtt.deliver(ACK_TOPIC, JSON.stringify({ commandId: correlationIdOf(payload), status: "applied" }));
        harness.mqtt.failPublish = true;
      };

      await expect(sendAs(harness, "student-1", "STUDENT")).rejects.toBeInstanceOf(VentilatorDeviceOfflineError);
      await harness.lifecycle.flushPersistence();

      expect(commandStatuses(harness)).toEqual(["REJECTED"]);
      expect(harness.lifecycle.inFlightCount).toBe(0);
    });

    it("returns the actual TIMEOUT status without a send time when the server shuts down while the publish is in flight", async () => {
      const harness: VentilatorCommandsHarness = await operatorHarness();

      harness.mqtt.beforePublishResolves = (): void => {
        harness.lifecycle.stop();
      };

      const result: SentVentilatorCommandResult = await sendAs(harness, "student-1", "STUDENT");
      await harness.lifecycle.flushPersistence();

      expect([result.status, result.sentAt]).toEqual(["TIMEOUT", undefined]);
      expect(commandStatuses(harness)).toEqual(["TIMEOUT"]);
      expect(harness.repository.writes.map((command: { status: string; rejectReason?: string }): string => `${command.status}:${command.rejectReason}`)).toEqual(["TIMEOUT:server_shutdown_unconfirmed"]);
      expect(harness.lifecycle.inFlightCount).toBe(0);
    });
  });

  it("announces late statuses of a previous reservation only to the sender, teachers and administrators", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-10T12:10:00Z") });
    const harness: VentilatorCommandsHarness = await operatorHarness();

    await sendAs(harness, "student-1", "STUDENT");
    harness.reservations.activate(OTHER_RESERVATION, ["teacher-1"]);
    harness.realtime.roomEmits.length = 0;
    jest.advanceTimersByTime(3000);

    const timeouts: { room: string; payload: unknown }[] = harness.realtime.roomEmits.filter((emit: { event: string }): boolean => emit.event === VENTILATOR_COMMAND_STATUS_EVENT);

    expect(timeouts.map((emit: { room: string }): string => emit.room)).toEqual(["user:student-1", "role:TEACHER", "role:ADMIN"]);
    expect((timeouts[0].payload as VentilatorCommandStatusPayload).status).toBe("TIMEOUT");
  });
});
