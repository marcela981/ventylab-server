/*
 * Funcionalidad: Flujo e2e de reserva de grupo, control del ventilador y desocupación
 * Descripción: El líder reserva el ventilador para su grupo, otro integrante toma el control y envía un comando que llega por MQTT al tópico de prueba y queda APPLIED con la telemetría simulada publicada en el Mosquitto de prueba; un docente intenta reservar (409 desocupable), desocupa con confirmación, el operador pierde el control, su siguiente comando recibe 403, recibe la notificación por Socket.io y existe la entrada de auditoría, validando cada respuesta JSON contra el contrato OpenAPI
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Group, type User } from "@prisma/client";
import { type Response } from "supertest";

import { createAdmin, createStudent, createStudentGroup, createTeacher, SLOT_MS } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { connectSimulatedVentilator, type SimulatedVentilator } from "../../support/mqtt-test-client";
import { waitUntil } from "../../support/polling";
import { connectRecordingSocket, type RecordingSocket } from "../../support/realtime";

const COMMAND: Readonly<Record<string, number>> = { tidalVolume: 450, respiratoryRate: 16, peep: 6, fio2: 0.4 };
const WINDOW_MS: number = 2 * SLOT_MS;

interface CommandRow {
  readonly id: string;
  readonly status: string;
}

interface NotificationPayload {
  readonly type: string;
}

interface ControlChange {
  readonly operatorUserId: string | null;
  readonly reason?: string;
}

describe("flow: group reservation, ventilator command and teacher preemption", () => {
  let e2e: E2eApp;
  let api: ContractCaller;
  let ventilator: SimulatedVentilator;
  let leader: User;
  let member: User;
  let teacher: User;
  let group: Group;
  let tokens: { leader: string; member: string; teacher: string; admin: string };
  let socket: RecordingSocket | undefined;

  beforeAll(async () => {
    e2e = await createE2eApp();
    api = contractCaller(e2e.baseUrl);
    ventilator = await connectSimulatedVentilator();
    ventilator.start();
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
    teacher = await createTeacher(e2e.prisma);
    leader = await createStudent(e2e.prisma);
    member = await createStudent(e2e.prisma);
    ({ group } = await createStudentGroup(e2e.prisma, { members: [leader, member], leader, createdBy: teacher }));
    tokens = {
      leader: await mintAccessToken(leader, e2e.app),
      member: await mintAccessToken(member, e2e.app),
      teacher: await mintAccessToken(teacher, e2e.app),
      admin: await mintAccessToken(await createAdmin(e2e.prisma), e2e.app),
    };
  });

  afterEach(() => {
    socket?.close();
  });

  afterAll(async () => {
    await ventilator?.close();
    await e2e?.close();
  });

  it("should apply a member's command over MQTT and revoke control when a teacher preempts", async () => {
    const startsAt: Date = new Date(Math.floor(Date.now() / SLOT_MS) * SLOT_MS);
    const window: { startsAt: string; endsAt: string } = { startsAt: startsAt.toISOString(), endsAt: new Date(startsAt.getTime() + WINDOW_MS).toISOString() };
    const reserved: Response = await api("POST", "/api/reservations", tokens.leader, { holderType: "GROUP", groupId: group.id, ...window, purpose: "Práctica de grupo" });

    expectStatus(reserved, 201);

    const reservationId: string = (await e2e.prisma.reservation.findFirstOrThrow({ where: { groupId: group.id, status: "SCHEDULED" }, select: { id: true } })).id;
    const current: Response = await api("GET", "/api/reservations/current", tokens.member);

    expectStatus(current, 200);
    expect(JSON.stringify(current.body.data)).toContain(reservationId);
    const memberSocket: RecordingSocket = await connectRecordingSocket(e2e.baseUrl, tokens.member);

    socket = memberSocket;
    expectStatus(await api("POST", "/api/ventilator/control", tokens.member), 200);

    ventilator.applySettings("VCV", COMMAND);

    const sent: Response = await waitUntil(
      (): Promise<Response> => api("POST", "/api/ventilator/commands", tokens.member, { mode: "VCV", ...COMMAND }),
      (response: Response): boolean => response.status === 202,
      { description: "the device to be online and the command accepted", intervalMs: 500 },
    );
    const commandId: string = sent.body.data.commandId as string;

    await waitUntil((): Promise<number> => Promise.resolve(ventilator.commands.length), (count: number): boolean => count > 0, { description: "the command on the test MQTT topic" });
    expect(ventilator.commands.at(-1)).toMatchObject({ mode: "VCV", ...COMMAND, correlationId: commandId });

    const history: Response = await waitUntil(
      (): Promise<Response> => api("GET", `/api/ventilator/commands?reservationId=${reservationId}`, tokens.member),
      (response: Response): boolean => (response.body.data as CommandRow[] | undefined)?.some((row: CommandRow): boolean => row.id === commandId && row.status === "APPLIED") ?? false,
      { description: "command APPLIED" },
    );

    expect((history.body.data as CommandRow[]).find((row: CommandRow): boolean => row.id === commandId)?.status).toBe("APPLIED");

    const unconfirmed: Response = await api("POST", "/api/reservations", tokens.teacher, { holderType: "USER", ...window });

    expect(unconfirmed.status).toBe(409);
    expect(unconfirmed.body.code).toBe("reservations.conflict_preemptable");

    const notification: Promise<NotificationPayload> = memberSocket.next<NotificationPayload>("notification:new", (payload: NotificationPayload): boolean => payload.type === "RESERVATION_PREEMPTED");
    const controlLost: Promise<ControlChange> = memberSocket.next<ControlChange>("ventilator:control-changed", (payload: ControlChange): boolean => payload.operatorUserId === null);
    const preempted: Response = await api("POST", `/api/reservations/${reservationId}/preempt`, tokens.teacher, { reason: "Demostración clínica urgente", holderType: "USER" });

    expectStatus(preempted, 201);
    await expect(controlLost).resolves.toMatchObject({ operatorUserId: null });
    await expect(notification).resolves.toMatchObject({ type: "RESERVATION_PREEMPTED" });
    expect((await e2e.prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } })).status).toBe("PREEMPTED");

    const rejected: Response = await api("POST", "/api/ventilator/commands", tokens.member, { mode: "VCV", ...COMMAND });

    expect(rejected.status).toBe(403);

    const audit: Response = await api("GET", `/api/audit?action=reservation.preempted&targetId=${reservationId}`, tokens.admin);

    expectStatus(audit, 200);
    expect(audit.body.data).toEqual([expect.objectContaining({ action: "reservation.preempted", targetId: reservationId })]);
  });
});
