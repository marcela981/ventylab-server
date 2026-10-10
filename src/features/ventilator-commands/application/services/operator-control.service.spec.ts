/*
 * Funcionalidad: Pruebas del control exclusivo del ventilador
 * Descripción: Verifica tomar, bloquear (423), arrebatar con auditoría, liberar, el latido, la gracia de presencia al cerrar el último socket (expira o se cancela al reconectar o con ventilator:heartbeat), la revocación por reserva desplazada, cancelada, completada o vencida en el refresco periódico, los eventos ventilator:control-changed y que ninguno de esos caminos publique un comando
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ReservationCancelledEvent, ReservationCompletedEvent, ReservationPreemptedEvent } from "@/features/reservations/domain/events/reservation.events";
import { VentilatorControlCommand } from "@/features/ventilator-commands/application/commands/ventilator-commands.commands";
import {
  VENTILATOR_CONTROL_CHANGED_EVENT,
  VENTILATOR_HEARTBEAT_MESSAGE,
  type VentilatorControlChangedPayload,
} from "@/features/ventilator-commands/application/realtime/ventilator-commands-events";
import { type VentilatorControlStateResult } from "@/features/ventilator-commands/application/results/ventilator-commands.results";
import {
  createVentilatorCommandsHarness,
  OTHER_RESERVATION,
  RESERVATION,
  type VentilatorCommandsHarness,
} from "@/features/ventilator-commands/application/testing/ventilator-commands-test-doubles-spec";
import {
  NoActiveVentilatorReservationError,
  NotReservationHolderError,
  NotVentilatorOperatorError,
  VentilatorControlLockedError,
} from "@/features/ventilator-commands/domain/ventilator-commands.errors";

const WINDOW: { startsAt: Date; endsAt: Date } = { startsAt: RESERVATION.startsAt, endsAt: RESERVATION.endsAt };

function actor(userId: string, role: string = "STUDENT"): VentilatorControlCommand {
  return new VentilatorControlCommand({ userId, role });
}

function controlChanges(harness: VentilatorCommandsHarness): string[] {
  return harness.realtime
    .payloadsOf<VentilatorControlChangedPayload>(VENTILATOR_CONTROL_CHANGED_EVENT)
    .map((payload: VentilatorControlChangedPayload): string => `${payload.reason}:${payload.operatorUserId ?? "none"}`);
}

async function heldBy(userId: string, role: string = "STUDENT"): Promise<VentilatorCommandsHarness> {
  const harness: VentilatorCommandsHarness = createVentilatorCommandsHarness();

  harness.reservations.activate(RESERVATION, ["student-1", "student-2", "leader-1"], ["leader-1"]);
  await harness.takeControl.execute(actor(userId, role), "take");

  return harness;
}

describe("exclusive ventilator control", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("requires an active reservation", async () => {
    const harness: VentilatorCommandsHarness = createVentilatorCommandsHarness();

    await expect(harness.takeControl.execute(actor("student-1"), "take")).rejects.toBeInstanceOf(NoActiveVentilatorReservationError);
  });

  it("rejects a student who is not a holder", async () => {
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    await expect(harness.takeControl.execute(actor("intruder"), "take")).rejects.toBeInstanceOf(NotReservationHolderError);
  });

  it("lets a holder take free control and announces it to the ventilator room, teachers and administrators", async () => {
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    expect(harness.control.state?.operatorUserId).toBe("student-1");
    expect(controlChanges(harness)).toEqual(["taken:student-1"]);
    expect(harness.realtime.roomEmits.filter((emit: { event: string }): boolean => emit.event === VENTILATOR_CONTROL_CHANGED_EVENT).map((emit: { room: string }): string => emit.room)).toEqual([
      "ventilator",
      "role:TEACHER",
      "role:ADMIN",
    ]);
  });

  it("locks a plain take by another holder with 423", async () => {
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    await expect(harness.takeControl.execute(actor("student-2"), "take")).rejects.toBeInstanceOf(VentilatorControlLockedError);
    await expect(harness.takeControl.execute(actor("student-2"), "takeover")).rejects.toBeInstanceOf(VentilatorControlLockedError);
  });

  it("lets the holder group leader take over and audits it", async () => {
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    await harness.takeControl.execute(actor("leader-1"), "takeover");

    expect(harness.control.state?.operatorUserId).toBe("leader-1");
    expect(controlChanges(harness)).toEqual(["taken:student-1", "takeover:leader-1"]);
    expect(harness.audit.records).toEqual([
      { actorId: "leader-1", action: "ventilator_control_taken_over", targetId: RESERVATION.id, before: { operatorUserId: "student-1" }, after: { operatorUserId: "leader-1" } },
    ]);
  });

  it("lets a teacher take over without being a holder", async () => {
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    await harness.takeControl.execute(actor("teacher-1", "TEACHER"), "takeover");

    expect(harness.control.state?.operatorUserId).toBe("teacher-1");
  });

  it("reports whether the caller can take or take over", async () => {
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    const holder: VentilatorControlStateResult = await harness.getControl.execute(actor("student-2"));
    const leader: VentilatorControlStateResult = await harness.getControl.execute(actor("leader-1"));
    const operator: VentilatorControlStateResult = await harness.getControl.execute(actor("student-1"));

    expect([holder.canTake, holder.canTakeover, holder.isOperator]).toEqual([false, false, false]);
    expect([leader.canTake, leader.canTakeover]).toEqual([false, true]);
    expect([operator.isOperator, operator.operatorUserId, operator.reservationId]).toEqual([true, "student-1", RESERVATION.id]);
  });

  it("lets only the operator, a teacher or an administrator release control", async () => {
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    expect(() => harness.releaseControl.execute(actor("student-2"))).toThrow(VentilatorControlLockedError);

    harness.releaseControl.execute(actor("teacher-1", "TEACHER"));

    expect(harness.control.state).toBeUndefined();
    expect(controlChanges(harness)).toEqual(["taken:student-1", "released:none"]);
  });

  it("accepts a heartbeat only from the operator", async () => {
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    expect(() => harness.heartbeat.execute(actor("student-2"))).toThrow(NotVentilatorOperatorError);
    expect(() => harness.heartbeat.execute(actor("student-1"))).not.toThrow();
  });

  it("frees control after the presence grace when the operator closes the last socket", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-10T12:10:00Z") });
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    harness.handlers.handleClientDisconnected({ userId: "student-1", socketId: "s1", remainingSockets: 1 });
    jest.advanceTimersByTime(60_000);
    expect(harness.control.state?.operatorUserId).toBe("student-1");

    harness.handlers.handleClientDisconnected({ userId: "student-1", socketId: "s2", remainingSockets: 0 });
    expect(harness.control.state?.presenceExpiresAt?.getTime()).toBe(Date.now() + 15_000);
    jest.advanceTimersByTime(14_999);
    expect(harness.control.state?.operatorUserId).toBe("student-1");

    jest.advanceTimersByTime(1);

    expect(harness.control.state).toBeUndefined();
    expect(controlChanges(harness)).toEqual(["taken:student-1", "presence_timeout:none"]);
  });

  it.each([
    ["a reconnection", (harness: VentilatorCommandsHarness): void => harness.handlers.handleClientAuthenticated({ userId: "student-1", role: "STUDENT", socketId: "s3" })],
    [
      "a ventilator:heartbeat message",
      (harness: VentilatorCommandsHarness): void => harness.handlers.handleClientMessage({ event: VENTILATOR_HEARTBEAT_MESSAGE, userId: "student-1", role: "STUDENT", socketId: "s3", payload: {} }),
    ],
  ])("cancels the presence timeout on %s", async (_name: string, signal: (harness: VentilatorCommandsHarness) => void) => {
    jest.useFakeTimers({ now: new Date("2026-10-10T12:10:00Z") });
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    harness.handlers.handleClientDisconnected({ userId: "student-1", socketId: "s2", remainingSockets: 0 });
    jest.advanceTimersByTime(10_000);
    signal(harness);
    jest.advanceTimersByTime(60_000);

    expect(harness.control.state?.operatorUserId).toBe("student-1");
    expect(harness.control.state?.lastSeenAt.getTime()).toBe(new Date("2026-10-10T12:10:10Z").getTime());
  });

  it("ignores disconnections of users who are not the operator", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-10T12:10:00Z") });
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    harness.handlers.handleClientDisconnected({ userId: "student-2", socketId: "s9", remainingSockets: 0 });
    jest.advanceTimersByTime(60_000);

    expect(harness.control.state?.operatorUserId).toBe("student-1");
  });

  it.each([
    [
      "preempted",
      "reservation_preempted",
      (harness: VentilatorCommandsHarness): void =>
        harness.handlers.handleReservationPreempted(
          new ReservationPreemptedEvent({
            reservationId: RESERVATION.id,
            previousHolder: { type: "GROUP", groupId: "group-1" },
            window: WINDOW,
            wasActive: true,
            preemptedById: "teacher-1",
            replacedByReservationId: OTHER_RESERVATION.id,
          }),
        ),
    ],
    [
      "cancelled",
      "reservation_ended",
      (harness: VentilatorCommandsHarness): void =>
        harness.handlers.handleReservationEnded(new ReservationCancelledEvent({ reservationId: RESERVATION.id, holder: { type: "GROUP", groupId: "group-1" }, window: WINDOW, wasActive: true })),
    ],
    [
      "completed",
      "reservation_ended",
      (harness: VentilatorCommandsHarness): void =>
        harness.handlers.handleReservationEnded(new ReservationCompletedEvent({ reservationId: RESERVATION.id, holder: { type: "GROUP", groupId: "group-1" }, window: WINDOW })),
    ],
  ])("revokes control immediately when the reservation is %s, without sending any command", async (_name: string, reason: string, trigger: (harness: VentilatorCommandsHarness) => void) => {
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    trigger(harness);

    expect(harness.control.state).toBeUndefined();
    expect(controlChanges(harness)).toEqual(["taken:student-1", `${reason}:none`]);
    expect(harness.mqtt.publishes).toHaveLength(0);
  });

  it("keeps control when another reservation ends", async () => {
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    harness.handlers.handleReservationEnded(new ReservationCompletedEvent({ reservationId: "res-other", holder: { type: "USER", userId: "x" }, window: WINDOW }));

    expect(harness.control.state?.operatorUserId).toBe("student-1");
  });

  it("revokes control on the periodic refresh once the active reservation is over, without sending any command", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-10T12:10:00Z") });
    const harness: VentilatorCommandsHarness = await heldBy("student-1");

    harness.control.start();
    jest.advanceTimersByTime(1);
    harness.reservations.active = undefined;
    await jest.advanceTimersByTimeAsync(1000);
    harness.control.stop();

    expect(harness.control.state).toBeUndefined();
    expect(controlChanges(harness)).toEqual(["taken:student-1", "reservation_ended:none"]);
    expect(harness.mqtt.publishes).toHaveLength(0);
  });
});
