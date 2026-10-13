/*
 * Funcionalidad: Prueba de resiliencia con base de datos lenta (arranque en frío)
 * Descripción: Interpone el proxy TCP de prueba entre la aplicación y el PostgreSQL de prueba con retraso al abrir conexiones y por fragmento, emulando el arranque en frío de una base de datos administrada; verifica que la aplicación arranca, que las peticiones siguen respondiendo con latencia alta, que /health/ready responde 503 not_ready dentro de HEALTH_CHECK_TIMEOUT_MS cuando el ping excede ese tiempo mientras /health sigue en 200, y que la disponibilidad vuelve al quitar el retraso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { PrismaClient, type User } from "@prisma/client";
import { type Response } from "supertest";

import { createStudent } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { createTestPrismaClient, resetDatabase } from "../../support/database";
import { createE2eAppWithEnvironment, type OverriddenE2eApp } from "../../support/env-overrides";
import { waitUntil } from "../../support/polling";
import { parseTarget, startTcpDelayProxy, type TcpDelayProxy } from "../../support/tcp-delay-proxy";

const HEALTH_CHECK_TIMEOUT_MS: number = 1_000;
const COLD_START_CONNECT_DELAY_MS: number = 2_000;
const MODERATE_CHUNK_DELAY_MS: number = 100;
const SLOW_CHUNK_DELAY_MS: number = 1_200;
const READINESS_MARGIN_MS: number = 1_500;

async function timed(request: () => Promise<Response>): Promise<{ response: Response; elapsedMs: number }> {
  const startedAt: number = Date.now();
  const response: Response = await request();

  return { response, elapsedMs: Date.now() - startedAt };
}

describe("resilience: slow database emulating a cold start", () => {
  let direct: PrismaClient;
  let proxy: TcpDelayProxy;
  let harness: OverriddenE2eApp;
  let api: ContractCaller;
  let student: User;
  let token: string;
  let bootMs: number;

  beforeAll(async () => {
    direct = createTestPrismaClient();
    await resetDatabase(direct);
    student = await createStudent(direct);

    const databaseUrl: string = process.env.DATABASE_URL ?? "";

    proxy = await startTcpDelayProxy(parseTarget(databaseUrl), { connectDelayMs: COLD_START_CONNECT_DELAY_MS, chunkDelayMs: MODERATE_CHUNK_DELAY_MS });

    const slowUrl: string = proxy.url(databaseUrl);
    const startedAt: number = Date.now();

    harness = await createE2eAppWithEnvironment({ DATABASE_URL: slowUrl, DIRECT_URL: slowUrl, HEALTH_CHECK_TIMEOUT_MS: String(HEALTH_CHECK_TIMEOUT_MS) });
    bootMs = Date.now() - startedAt;
    api = contractCaller(harness.e2e.baseUrl);
    token = await mintAccessToken(student, harness.e2e.app);
  });

  afterAll(async () => {
    await harness?.restore();
    await proxy?.close();
    await direct?.$disconnect();
  });

  it("should boot and answer through a cold-starting database", async () => {
    const { response, elapsedMs } = await timed((): Promise<Response> => api("GET", "/api/notifications", token));

    expect(bootMs).toBeGreaterThanOrEqual(COLD_START_CONNECT_DELAY_MS);
    expect(proxy.connectionCount).toBeGreaterThan(0);
    expectStatus(response, 200);
    expect(elapsedMs).toBeGreaterThanOrEqual(2 * MODERATE_CHUNK_DELAY_MS);
  });

  it("should stay ready while the database round trip is below the readiness timeout", async () => {
    const readiness: Response = await api("GET", "/health/ready");

    expect(readiness.status).toBe(200);
    expect(readiness.body).toEqual({ status: "ready" });
  });

  it("should answer not_ready within the readiness timeout and keep liveness and slow requests working when the database is slower", async () => {
    proxy.setLatency({ chunkDelayMs: SLOW_CHUNK_DELAY_MS });

    const readiness: { response: Response; elapsedMs: number } = await timed((): Promise<Response> => api("GET", "/health/ready"));
    const liveness: { response: Response; elapsedMs: number } = await timed((): Promise<Response> => api("GET", "/health"));
    const slowRead: { response: Response; elapsedMs: number } = await timed((): Promise<Response> => api("GET", "/api/notifications", token));

    expect(readiness.response.status).toBe(503);
    expect(readiness.response.body).toEqual({ status: "not_ready" });
    expect(readiness.elapsedMs).toBeLessThan(HEALTH_CHECK_TIMEOUT_MS + READINESS_MARGIN_MS);
    expect(liveness.response.status).toBe(200);
    expect(liveness.elapsedMs).toBeLessThan(READINESS_MARGIN_MS);
    expectStatus(slowRead.response, 200);
    expect(slowRead.elapsedMs).toBeGreaterThanOrEqual(2 * SLOW_CHUNK_DELAY_MS);
  });

  it("should become ready again once the latency is gone", async () => {
    proxy.setLatency({ chunkDelayMs: 0, connectDelayMs: 0 });

    const readiness: Response = await waitUntil((): Promise<Response> => api("GET", "/health/ready"), (response: Response): boolean => response.status === 200, { description: "readiness 200", timeoutMs: 10_000 });

    expect(readiness.body).toEqual({ status: "ready" });
  });
});
