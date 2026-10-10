/*
 * Funcionalidad: Propiedades UPPAAL del camino de comandos
 * Descripción: Contrasta la implementación con las consultas del modelo ventilab-commands-uppaal.xml (S2/SM1, S6/P1, S7/P2, L1, L2, S3, R1, R2, R3) mediante pruebas ejecutables sobre los servicios reales con dobles en memoria; las propiedades de seguridad usan un generador pseudoaleatorio con semilla sobre miles de comandos y actores. No sustituye a verifyta: es evidencia de prueba, no una verificación de modelos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { SendVentilatorCommandCommand, VentilatorControlCommand } from "@/features/ventilator-commands/application/commands/ventilator-commands.commands";
import {
  createVentilatorCommandsHarness,
  OTHER_RESERVATION,
  REAL_ACK_TOPIC,
  RESERVATION,
  TEST_TOPIC_PREFIX,
  VALID_COMMAND,
  type VentilatorCommandsHarness,
} from "@/features/ventilator-commands/application/testing/ventilator-commands-test-doubles-spec";
import { VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { validateVentilatorCommand, type VentilatorCommandValidation } from "@/features/ventilator-commands/domain/validation/ventilator-command-validator";
import { TERMINAL_COMMAND_STATUSES, type VentilatorCommandStatusValue } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-status";
import {
  InvalidVentilatorCommandError,
  NoActiveVentilatorReservationError,
  NotReservationHolderError,
} from "@/features/ventilator-commands/domain/ventilator-commands.errors";

const SEED: number = 20261010;
const RANDOM_COMMANDS: number = 3000;
const RANDOM_ACTIONS: number = 2000;
const MODEL_ACK_TIMEOUT_MS: number = 1000;

type Random = () => number;

function mulberry32(seed: number): Random {
  let state: number = seed >>> 0;

  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;

    let t: number = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: Random, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)];
}

const PARAMETER_RANGES: Readonly<Record<string, [number, number]>> = {
  tidalVolume: [100, 900],
  respiratoryRate: [2, 50],
  peep: [-2, 25],
  fio2: [0.1, 1.2],
  pressureLimit: [5, 60],
  inspiratoryTime: [0.2, 4],
  flowRate: [10, 120],
  sensitivity: [0.1, 12],
  ieRatio: [0.1, 3],
};

function randomValue(random: Random, range: [number, number]): unknown {
  const roll: number = random();

  if (roll < 0.05) {
    return Number.NaN;
  }

  if (roll < 0.08) {
    return Number.POSITIVE_INFINITY;
  }

  if (roll < 0.12) {
    return String(Math.round(range[0] + random() * (range[1] - range[0])));
  }

  if (roll < 0.14) {
    return true;
  }

  if (roll < 0.3) {
    return undefined;
  }

  return Math.round((range[0] + random() * (range[1] - range[0])) * 100) / 100;
}

function randomCommand(random: Random): Record<string, unknown> {
  const command: Record<string, unknown> = { mode: pick(random, ["VCV", "PCV", "SIMV", "PSV", "VCV", "PCV", "CPAP", "vcv", 3, undefined]) };

  for (const [field, range] of Object.entries(PARAMETER_RANGES)) {
    command[field] = field === "ieRatio" && random() < 0.8 ? undefined : randomValue(random, range);
  }

  return command;
}

async function operatorHarness(overrides: Parameters<typeof createVentilatorCommandsHarness>[0] = {}): Promise<VentilatorCommandsHarness> {
  const harness: VentilatorCommandsHarness = createVentilatorCommandsHarness(overrides);

  harness.reservations.activate(RESERVATION, ["student-1", "leader-1"], ["leader-1"]);
  await harness.takeControl.execute(new VentilatorControlCommand({ userId: "student-1", role: "STUDENT" }), "take");

  return harness;
}

function send(harness: VentilatorCommandsHarness, userId: string, role: string, params: unknown): Promise<unknown> {
  return harness.send.execute(new SendVentilatorCommandCommand({ userId, role, params })).catch((error: unknown): unknown => error);
}

describe("UPPAAL commands model properties", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-10T12:10:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("S2/SM1", () => {
    it("A[] (mqttClient.PUBLISHING imply params_in_safe_range): only commands passing validation are ever published (seeded random NaN, strings, booleans and out-of-range values)", async () => {
      const random: Random = mulberry32(SEED);
      const harness: VentilatorCommandsHarness = await operatorHarness({ VENTILATOR_COMMAND_RATE_PER_SECOND: 100 });
      let accepted: number = 0;
      let rejected: number = 0;

      for (let i: number = 0; i < RANDOM_COMMANDS; i += 1) {
        const command: Record<string, unknown> = randomCommand(random);
        const expected: VentilatorCommandValidation = validateVentilatorCommand(command, harness.settings.safety);
        const outcome: unknown = await send(harness, "student-1", "STUDENT", command);

        if (expected.valid) {
          accepted += 1;
          expect(outcome).not.toBeInstanceOf(Error);
        } else {
          rejected += 1;
          expect(outcome).toBeInstanceOf(InvalidVentilatorCommandError);
        }

        jest.advanceTimersByTime(20);
      }

      expect(harness.mqtt.publishes).toHaveLength(accepted);
      expect(accepted).toBeGreaterThan(0);
      expect(rejected).toBeGreaterThan(accepted);

      for (const published of harness.mqtt.publishes) {
        expect(published.topic.startsWith(`${TEST_TOPIC_PREFIX}/`)).toBe(true);
        expect(validateVentilatorCommand(JSON.parse(String(published.payload)), harness.settings.safety).valid).toBe(true);
      }
    });
  });

  describe("S6/P1 and S7/P2", () => {
    it("A[] (apiGateway.EXECUTING imply hasPermission()) and A[] not (user_role == 1 and is_real_ventilator and apiGateway.EXECUTING): no publish without an active reservation and the exclusive operator; a student without a reservation never publishes (traceability deviation: the model allows only ADMIN on the real ventilator, the code allows the reservation operator)", async () => {
      const random: Random = mulberry32(SEED + 1);
      const harness: VentilatorCommandsHarness = createVentilatorCommandsHarness({ VENTILATOR_COMMAND_RATE_PER_SECOND: 100 });
      const actors: readonly { userId: string; role: string }[] = [
        { userId: "student-1", role: "STUDENT" },
        { userId: "student-2", role: "STUDENT" },
        { userId: "intruder", role: "STUDENT" },
        { userId: "teacher-1", role: "TEACHER" },
        { userId: "admin-1", role: "ADMIN" },
      ];

      for (let i: number = 0; i < RANDOM_ACTIONS; i += 1) {
        const roll: number = random();
        const caller: { userId: string; role: string } = pick(random, actors);

        if (roll < 0.1) {
          harness.reservations.active = undefined;
        } else if (roll < 0.2) {
          harness.reservations.activate(pick(random, [RESERVATION, OTHER_RESERVATION]), ["student-1", "student-2"], ["student-2"]);
        } else if (roll < 0.35) {
          await harness.takeControl.execute(new VentilatorControlCommand(caller), pick(random, ["take", "takeover"] as const)).catch((): undefined => undefined);
        } else if (roll < 0.4) {
          try {
            harness.releaseControl.execute(new VentilatorControlCommand(caller));
          } catch {
            // A refused release is part of the explored behaviour
          }
        } else {
          const publishesBefore: number = harness.mqtt.publishes.length;
          const active: string | undefined = harness.reservations.active?.id;
          const isOperator: boolean = active !== undefined && harness.control.isOperator(caller.userId, active);
          const isHolder: boolean = active !== undefined && (harness.reservations.holders.get(active)?.has(caller.userId) ?? false);
          const authorized: boolean = active !== undefined && isOperator && (isHolder || caller.role !== "STUDENT");

          await send(harness, caller.userId, caller.role, VALID_COMMAND);

          expect(harness.mqtt.publishes.length - publishesBefore).toBe(authorized ? 1 : 0);

          if (caller.role === "STUDENT" && active === undefined) {
            expect(harness.mqtt.publishes.length).toBe(publishesBefore);
          }
        }

        jest.advanceTimersByTime(20);
      }

      expect(harness.mqtt.publishes.length).toBeGreaterThan(0);
    });
  });

  describe("L1", () => {
    it("commandValidator.APPROVED --> mqttClient.PUBLISHING: an approved command from the operator with the device online is published", async () => {
      const harness: VentilatorCommandsHarness = await operatorHarness();

      await send(harness, "student-1", "STUDENT", VALID_COMMAND);

      expect(harness.mqtt.publishes).toHaveLength(1);
    });
  });

  describe("L2", () => {
    it("mqttClient.AWAITING_ACK --> (mqttClient.SUCCESS or mqttClient.ERROR): every SENT command reaches ACKED, APPLIED, REJECTED or TIMEOUT within the timeout and none stays SENT", async () => {
      const random: Random = mulberry32(SEED + 2);
      const harness: VentilatorCommandsHarness = await operatorHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC, VENTILATOR_COMMAND_RATE_PER_SECOND: 100 });
      const ackTopic: string = harness.settings.ackTopic ?? "";
      const ids: string[] = [];

      for (let i: number = 0; i < 200; i += 1) {
        const result: unknown = await send(harness, "student-1", "STUDENT", VALID_COMMAND);
        const commandId: string = (result as { commandId: string }).commandId;
        const roll: number = random();

        ids.push(commandId);

        if (roll < 0.3) {
          harness.mqtt.deliver(ackTopic, JSON.stringify({ commandId, status: "applied" }));
        } else if (roll < 0.5) {
          harness.mqtt.deliver(ackTopic, JSON.stringify({ commandId, status: "rejected", reason: "fault" }));
        }

        jest.advanceTimersByTime(20);
      }

      jest.advanceTimersByTime(harness.settings.timeoutMs);
      await harness.lifecycle.flushPersistence();

      const finalStatuses: VentilatorCommandStatusValue[] = ids.map((id: string): VentilatorCommandStatusValue => harness.repository.rows.get(id)?.status ?? "SENT");

      expect(harness.lifecycle.inFlightCount).toBe(0);
      expect(finalStatuses.every((status: VentilatorCommandStatusValue): boolean => TERMINAL_COMMAND_STATUSES.includes(status))).toBe(true);
    });
  });

  describe("S3", () => {
    it("A[] mqttClient.AWAITING_ACK imply mqttClient.t_ack <= ACK_TIMEOUT: the acknowledgement wait is bounded by VENTILATOR_COMMAND_TIMEOUT_MS (configured as the model's 1000 ms)", async () => {
      const harness: VentilatorCommandsHarness = await operatorHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC, VENTILATOR_COMMAND_TIMEOUT_MS: MODEL_ACK_TIMEOUT_MS });

      await send(harness, "student-1", "STUDENT", VALID_COMMAND);
      jest.advanceTimersByTime(MODEL_ACK_TIMEOUT_MS - 1);
      expect(harness.lifecycle.inFlightCount).toBe(1);

      jest.advanceTimersByTime(1);
      await harness.lifecycle.flushPersistence();

      const [command]: VentilatorCommand[] = [...harness.repository.rows.values()];

      expect(harness.lifecycle.inFlightCount).toBe(0);
      expect([command.status, command.latencyMs]).toEqual(["TIMEOUT", MODEL_ACK_TIMEOUT_MS]);
    });
  });

  describe("R1", () => {
    it("E<> mqttClient.SUCCESS: ACKED is reachable when the acknowledgement topic is enabled", async () => {
      const harness: VentilatorCommandsHarness = await operatorHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });
      const result: unknown = await send(harness, "student-1", "STUDENT", VALID_COMMAND);

      harness.mqtt.deliver(harness.settings.ackTopic ?? "", JSON.stringify({ commandId: (result as { commandId: string }).commandId, status: "applied" }));
      await harness.lifecycle.flushPersistence();

      expect([...harness.repository.rows.values()].map((command: VentilatorCommand): string => command.status)).toEqual(["ACKED"]);
    });
  });

  describe("R2", () => {
    it("E<> commandValidator.REJECTED: an out-of-range command is rejected (422) and a device rejection is reachable", async () => {
      const harness: VentilatorCommandsHarness = await operatorHarness({ MQTT_COMMAND_ACK_TOPIC: REAL_ACK_TOPIC });

      const validationOutcome: unknown = await send(harness, "student-1", "STUDENT", { ...VALID_COMMAND, peep: 40 });
      const sent: unknown = await send(harness, "student-1", "STUDENT", VALID_COMMAND);

      harness.mqtt.deliver(harness.settings.ackTopic ?? "", JSON.stringify({ commandId: (sent as { commandId: string }).commandId, status: "rejected" }));
      await harness.lifecycle.flushPersistence();

      expect(validationOutcome).toBeInstanceOf(InvalidVentilatorCommandError);
      expect([...harness.repository.rows.values()].map((command: VentilatorCommand): string => command.status)).toEqual(["REJECTED"]);
    });
  });

  describe("R3", () => {
    it("E<> apiGateway.FORBIDDEN: 403 is reachable without a reservation and for non-holders", async () => {
      const harness: VentilatorCommandsHarness = createVentilatorCommandsHarness();

      const withoutReservation: unknown = await send(harness, "student-1", "STUDENT", VALID_COMMAND);

      harness.reservations.activate(RESERVATION, ["student-1"]);

      const nonHolder: unknown = await send(harness, "intruder", "STUDENT", VALID_COMMAND);

      expect(withoutReservation).toBeInstanceOf(NoActiveVentilatorReservationError);
      expect(nonHolder).toBeInstanceOf(NotReservationHolderError);
    });
  });
});
