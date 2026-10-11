/*
 * Funcionalidad: Pruebas del ciclo de vida del comando del ventilador
 * Descripción: Verifica la máquina de estados PENDING → SENT → ACKED | APPLIED | REJECTED | TIMEOUT, PENDING → REJECTED y PENDING → TIMEOUT (publicación sin confirmar), la latencia calculada y que toda transición no permitida lance un error
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { IllegalVentilatorCommandTransitionError } from "@/features/ventilator-commands/domain/ventilator-commands.errors";

const CREATED_AT: Date = new Date("2026-10-10T12:00:00.000Z");
const SENT_AT: Date = new Date("2026-10-10T12:00:00.100Z");
const RESOLVED_AT: Date = new Date("2026-10-10T12:00:00.350Z");

function pendingCommand(): VentilatorCommand {
  return VentilatorCommand.create({
    correlationId: "cmd-1",
    reservationId: "res-1",
    userId: "user-1",
    params: { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 },
    encoding: "json",
    encodedPayload: "{}",
    now: CREATED_AT,
  });
}

function sentCommand(): VentilatorCommand {
  const command: VentilatorCommand = pendingCommand();

  command.markSent(SENT_AT);

  return command;
}

describe("VentilatorCommand lifecycle", () => {
  it("starts PENDING and moves to SENT with its send time", () => {
    const command: VentilatorCommand = sentCommand();

    expect(command.status).toBe("SENT");
    expect(command.sentAt).toEqual(SENT_AT);
    expect(command.isTerminal).toBe(false);
  });

  it.each([
    ["ACKED", (command: VentilatorCommand): void => command.markAcked(RESOLVED_AT)],
    ["APPLIED", (command: VentilatorCommand): void => command.markApplied(RESOLVED_AT)],
    ["TIMEOUT", (command: VentilatorCommand): void => command.markTimedOut(RESOLVED_AT)],
    ["REJECTED", (command: VentilatorCommand): void => command.markRejected("out_of_order", RESOLVED_AT)],
  ])("resolves a SENT command as %s with its latency", (status: string, transition: (command: VentilatorCommand) => void) => {
    const command: VentilatorCommand = sentCommand();

    transition(command);

    expect(command.status).toBe(status);
    expect(command.resolvedAt).toEqual(RESOLVED_AT);
    expect(command.latencyMs).toBe(250);
    expect(command.isTerminal).toBe(true);
  });

  it("keeps the device reason of a rejected command", () => {
    const command: VentilatorCommand = sentCommand();

    command.markRejected("out_of_order", RESOLVED_AT);

    expect(command.rejectReason).toBe("out_of_order");
  });

  it("rejects a PENDING command whose publish failed, without latency", () => {
    const command: VentilatorCommand = pendingCommand();

    command.markPublishFailed("broker_not_connected", RESOLVED_AT);

    expect(command.status).toBe("REJECTED");
    expect(command.sentAt).toBeUndefined();
    expect(command.latencyMs).toBeUndefined();
    expect(command.rejectReason).toBe("broker_not_connected");
  });

  it("times out a PENDING command whose publish outcome is unknown, with its reason and without send time or latency", () => {
    const command: VentilatorCommand = pendingCommand();

    command.markPublishUnconfirmed("publish_unconfirmed", RESOLVED_AT);

    expect([command.status, command.rejectReason, command.sentAt, command.latencyMs, command.resolvedAt]).toEqual(["TIMEOUT", "publish_unconfirmed", undefined, undefined, RESOLVED_AT]);
    expect(command.isTerminal).toBe(true);
  });

  it.each([
    ["mark the publish of a SENT command as unconfirmed", (command: VentilatorCommand): void => command.markPublishUnconfirmed("x", RESOLVED_AT), sentCommand],
    ["ack a PENDING command", (command: VentilatorCommand): void => command.markAcked(RESOLVED_AT), pendingCommand],
    ["time out a PENDING command", (command: VentilatorCommand): void => command.markTimedOut(RESOLVED_AT), pendingCommand],
    ["send a SENT command again", (command: VentilatorCommand): void => command.markSent(RESOLVED_AT), sentCommand],
    ["fail the publish of a SENT command", (command: VentilatorCommand): void => command.markPublishFailed("x", RESOLVED_AT), sentCommand],
  ])("throws when trying to %s", (_name: string, transition: (command: VentilatorCommand) => void, build: () => VentilatorCommand) => {
    const command: VentilatorCommand = build();

    expect(() => transition(command)).toThrow(IllegalVentilatorCommandTransitionError);
  });

  it("never leaves a terminal state", () => {
    const command: VentilatorCommand = sentCommand();

    command.markTimedOut(RESOLVED_AT);

    expect(() => command.markAcked(RESOLVED_AT)).toThrow(IllegalVentilatorCommandTransitionError);
    expect(() => command.markApplied(RESOLVED_AT)).toThrow(IllegalVentilatorCommandTransitionError);
    expect(command.status).toBe("TIMEOUT");
  });

  it("copies its state into an independent snapshot", () => {
    const command: VentilatorCommand = sentCommand();
    const snapshot: VentilatorCommand = command.snapshot();

    command.markAcked(RESOLVED_AT);

    expect(snapshot.status).toBe("SENT");
    expect(snapshot.id).toBe("cmd-1");
  });
});
