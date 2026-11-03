/*
 * Funcionalidad: Prueba e2e de revocación al cambiar la contraseña
 * Descripción: Con la aplicación completa, un estudiante inicia sesión dos veces (refresh tokens A y A2), cambia su contraseña con POST /api/auth/change-password y recibe el par B de la sesión actual; comprueba que A y A2 responden 401 al refrescar, que B refresca de inmediato con 200 aunque su iat quede un segundo después de la revocación, que la contraseña vieja ya no inicia sesión y la nueva sí, que la ruta deprecada /api/users/me/change-password también revoca y que una cuenta sin contraseña recibe 400 y hasPassword false; las respuestas se validan contra openapi/openapi.json
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type User } from "@prisma/client";
import { type Response } from "supertest";

import { createStudent, TEST_USER_PASSWORD } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";

const NEW_PASSWORD: string = "Nueva-Clave-2026";

interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

describe("flow: changing the password revokes the other sessions and keeps the current one", () => {
  let e2e: E2eApp;
  let api: ContractCaller;

  async function login(email: string, password: string): Promise<Response> {
    return await api("POST", "/api/auth/login", undefined, { email, password });
  }

  async function pairOf(response: Response): Promise<TokenPair> {
    expectStatus(response, 200);

    return await Promise.resolve(response.body.data as TokenPair);
  }

  async function refresh(refreshToken: string): Promise<number> {
    return (await api("POST", "/api/auth/refresh", undefined, { refreshToken })).status;
  }

  beforeAll(async () => {
    e2e = await createE2eApp();
    api = contractCaller(e2e.baseUrl);
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should reject the old refresh tokens, accept the reissued one and switch the password", async () => {
    const student: User = await createStudent(e2e.prisma);
    const sessionA: TokenPair = await pairOf(await login(student.email, TEST_USER_PASSWORD));
    const sessionA2: TokenPair = await pairOf(await login(student.email, TEST_USER_PASSWORD));

    const changed: Response = await api("POST", "/api/auth/change-password", sessionA.accessToken, { currentPassword: TEST_USER_PASSWORD, newPassword: NEW_PASSWORD });
    const sessionB: TokenPair = await pairOf(changed);

    expect(await refresh(sessionA.refreshToken)).toBe(401);
    expect(await refresh(sessionA2.refreshToken)).toBe(401);
    expect(await refresh(sessionB.refreshToken)).toBe(200);
    expect((await login(student.email, TEST_USER_PASSWORD)).status).toBe(401);
    expect((await login(student.email, NEW_PASSWORD)).status).toBe(200);
  });

  it("should also revoke the refresh tokens through the deprecated route", async () => {
    const student: User = await createStudent(e2e.prisma);
    const session: TokenPair = await pairOf(await login(student.email, TEST_USER_PASSWORD));

    const changed: Response = await api("POST", "/api/users/me/change-password", session.accessToken, { currentPassword: TEST_USER_PASSWORD, newPassword: NEW_PASSWORD });

    expectStatus(changed, 200);
    expect(changed.headers.deprecation).toBeDefined();
    expect(await refresh(session.refreshToken)).toBe(401);
  });

  it("should refuse the change to an account without a password and report hasPassword false", async () => {
    const googleUser: User = await createStudent(e2e.prisma, { password: null });
    const token: string = await mintAccessToken(googleUser, e2e.app);

    const me: Response = await api("GET", "/api/users/me", token);
    const changed: Response = await api("POST", "/api/auth/change-password", token, { currentPassword: "Anything-123", newPassword: NEW_PASSWORD });

    expectStatus(me, 200);
    expect(me.body.data.hasPassword).toBe(false);
    expect(changed.status).toBe(400);
  });
});
