/*
 * Funcionalidad: Prueba e2e de humo de la infraestructura
 * Descripción: Arranca la aplicación Nest completa contra el PostgreSQL y el Mosquitto de Testcontainers con proveedores de IA falsos y verifica que /health/ready responda 200, que solo existan proveedores falsos, que un cliente Socket.io autentique con un token emitido para un usuario creado por fábrica y que un token inválido reciba auth_error
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type User } from "@prisma/client";
import { io, type Socket } from "socket.io-client";
import request, { type Response } from "supertest";

import { AI_PROVIDERS_TOKEN, type AiProviderRegistry } from "@/features/ai/application/ports/llm-provider.interface";
import { FakeLlmProvider } from "@/features/ai/application/testing/ai-test-doubles-spec";

import { createStudent } from "../factories";
import { mintAccessToken } from "../support/auth";
import { resetDatabase } from "../support/database";
import { createE2eApp, type E2eApp } from "../support/e2e-app";

const SOCKET_TIMEOUT_MS: number = 10_000;

function connectSocket(baseUrl: string): Socket {
  return io(baseUrl, { transports: ["websocket"], reconnection: false, forceNew: true });
}

function waitForEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise<T>((resolve: (value: T) => void, reject: (reason: Error) => void) => {
    const timer: NodeJS.Timeout = setTimeout(() => reject(new Error(`Timed out waiting for socket event ${event}`)), SOCKET_TIMEOUT_MS);

    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

describe("e2e test infrastructure", () => {
  let e2e: E2eApp;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    e2e = await createE2eApp();
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket: Socket): void => {
      socket.disconnect();
    });
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should answer readiness against the test database", async () => {
    const response: Response = await request(e2e.baseUrl).get("/health/ready");

    expect(response.status).toBe(200);
  });

  it("should only register fake AI providers", () => {
    const registry: AiProviderRegistry = e2e.app.get<AiProviderRegistry>(AI_PROVIDERS_TOKEN);

    expect([...registry.values()].every((provider: unknown): boolean => provider instanceof FakeLlmProvider)).toBe(true);
  });

  it("should authenticate a socket client with a minted access token", async () => {
    const student: User = await createStudent(e2e.prisma);
    const token: string = await mintAccessToken(student, e2e.app);
    const socket: Socket = connectSocket(e2e.baseUrl);

    sockets.push(socket);
    await waitForEvent<void>(socket, "connect");

    const authenticated: Promise<{ userId: string }> = waitForEvent<{ userId: string }>(socket, "authenticated");

    socket.emit("authenticate", { token });

    await expect(authenticated).resolves.toEqual({ userId: student.id });
  });

  it("should reject a socket client with an invalid token", async () => {
    const socket: Socket = connectSocket(e2e.baseUrl);

    sockets.push(socket);
    await waitForEvent<void>(socket, "connect");

    const rejected: Promise<{ message: string }> = waitForEvent<{ message: string }>(socket, "auth_error");

    socket.emit("authenticate", { token: "not-a-valid-token" });

    await expect(rejected).resolves.toEqual({ message: "Invalid token" });
  });
});
