/*
 * Funcionalidad: Prueba de resiliencia ante la caída del broker MQTT
 * Descripción: Arranca la aplicación contra un Mosquitto de prueba propio (detrás del proxy TCP local), detiene el contenedor del broker y verifica que la aplicación sigue respondiendo, que /health y /health/ready no cambian, que /api/system/status pasa a DEGRADED con el broker caído y que los comandos fallan con el 503 documentado; luego arranca un broker nuevo, redirige el proxy y verifica la reconexión y que un comando vuelve a quedar APPLIED
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type User } from "@prisma/client";
import { type Response } from "supertest";
import { type StartedTestContainer } from "testcontainers";

import { createReservation, createStudent, createTeacher, SLOT_MS } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { mosquittoUrl, startMosquittoContainer } from "../../support/containers";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eAppWithEnvironment, type OverriddenE2eApp } from "../../support/env-overrides";
import { connectSimulatedVentilator, type SimulatedVentilator } from "../../support/mqtt-test-client";
import { waitUntil } from "../../support/polling";
import { parseTarget, startTcpDelayProxy, type TcpDelayProxy } from "../../support/tcp-delay-proxy";

const COMMAND: Readonly<Record<string, number>> = { tidalVolume: 480, respiratoryRate: 14, peep: 5, fio2: 0.35 };
const STATUS_TIMEOUT_MS: number = 30_000;

interface SystemStatusBody {
  readonly state: string;
  readonly components: { readonly mqttBroker: { readonly state: string; readonly connected: boolean } };
}

interface CommandRow {
  readonly id: string;
  readonly status: string;
}

describe("resilience: MQTT broker down and recovered", () => {
  let broker: StartedTestContainer | undefined;
  let proxy: TcpDelayProxy;
  let harness: OverriddenE2eApp;
  let api: ContractCaller;
  let ventilator: SimulatedVentilator;
  let student: User;
  let studentToken: string;
  let teacherToken: string;
  let reservationId: string;

  beforeAll(async () => {
    broker = await startMosquittoContainer();
    proxy = await startTcpDelayProxy(parseTarget(mosquittoUrl(broker)));

    const brokerViaProxy: string = `mqtt://127.0.0.1:${proxy.port}`;

    harness = await createE2eAppWithEnvironment({ MQTT_BROKER_URL: brokerViaProxy, MQTT_RECONNECT_BASE_MS: "200", MQTT_RECONNECT_MAX_MS: "1000" });
    api = contractCaller(harness.e2e.baseUrl);
    ventilator = await connectSimulatedVentilator(brokerViaProxy);
    ventilator.applySettings("VCV", COMMAND);
    ventilator.start();

    await resetDatabase(harness.e2e.prisma);
    student = await createStudent(harness.e2e.prisma);
    studentToken = await mintAccessToken(student, harness.e2e.app);
    teacherToken = await mintAccessToken(await createTeacher(harness.e2e.prisma), harness.e2e.app);
    reservationId = (await createReservation(harness.e2e.prisma, { user: student }, { startsAt: new Date(Math.floor(Date.now() / SLOT_MS) * SLOT_MS), durationMinutes: 30 })).id;
    expectStatus(await api("POST", "/api/ventilator/control", studentToken), 200);
  });

  afterAll(async () => {
    await ventilator?.close();
    await harness?.restore();
    await proxy?.close();
    await broker?.stop();
  });

  function sendCommand(): Promise<Response> {
    return api("POST", "/api/ventilator/commands", studentToken, { mode: "VCV", ...COMMAND });
  }

  function systemStatus(): Promise<SystemStatusBody> {
    return api("GET", "/api/system/status", teacherToken).then((response: Response): SystemStatusBody => response.body.data as SystemStatusBody);
  }

  async function expectCommandApplied(): Promise<void> {
    const sent: Response = await waitUntil(sendCommand, (response: Response): boolean => response.status === 202, { description: "a command accepted", timeoutMs: STATUS_TIMEOUT_MS, intervalMs: 500 });
    const commandId: string = sent.body.data.commandId as string;

    await waitUntil(
      (): Promise<Response> => api("GET", `/api/ventilator/commands?reservationId=${reservationId}`, studentToken),
      (response: Response): boolean => (response.body.data as CommandRow[]).some((row: CommandRow): boolean => row.id === commandId && row.status === "APPLIED"),
      { description: `command ${commandId} APPLIED` },
    );
  }

  it("should apply commands while the broker is up", async () => {
    await expectCommandApplied();

    const status: SystemStatusBody = await waitUntil(systemStatus, (body: SystemStatusBody): boolean => body.components.mqttBroker.state === "up", { timeoutMs: STATUS_TIMEOUT_MS });

    expect(status.components.mqttBroker.connected).toBe(true);
  });

  it("should stay up, report the broker down and reject commands with 503 while the broker container is stopped", async () => {
    await broker?.stop();
    broker = undefined;

    const status: SystemStatusBody = await waitUntil(systemStatus, (body: SystemStatusBody): boolean => body.components.mqttBroker.state === "down", { timeoutMs: STATUS_TIMEOUT_MS, intervalMs: 1_000 });
    const liveness: Response = await api("GET", "/health");
    const readiness: Response = await api("GET", "/health/ready");
    const command: Response = await sendCommand();

    expect(status).toMatchObject({ state: "DEGRADED", components: { mqttBroker: { connected: false } } });
    expect(liveness.status).toBe(200);
    expect(readiness.status).toBe(200);
    expect(command.status).toBe(503);
    expect(command.body.code).toBe("ventilator-commands.device_offline");
  });

  it("should reconnect to a recovered broker and resume the command flow", async () => {
    const recovered: StartedTestContainer = await startMosquittoContainer();

    broker = recovered;
    proxy.setTarget(parseTarget(mosquittoUrl(recovered)));

    await waitUntil(systemStatus, (body: SystemStatusBody): boolean => body.components.mqttBroker.state === "up", { description: "MQTT broker up again", timeoutMs: STATUS_TIMEOUT_MS, intervalMs: 1_000 });
    await expectCommandApplied();
  });
});
