/*
 * Funcionalidad: Flujo E2E de recuperación de contraseña
 * Descripción: Con la aplicación completa y un servicio de correo de prueba que captura los mensajes, un estudiante pide la recuperación (POST /api/auth/password/forgot responde 202 y llega un correo con el enlace /auth/reset-password?token=), restablece la contraseña con ese token (POST /api/auth/password/reset), su refresh token anterior queda revocado (401), la contraseña vieja ya no inicia sesión y la nueva sí, y el mismo token no sirve dos veces (400 auth.password_reset_token_invalid); un correo desconocido también responde 202 sin enviar nada y la base solo guarda el hash del token. Las respuestas se validan contra openapi/openapi.json (Ajustes D3)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TestingModuleBuilder } from "@nestjs/testing";
import { type User } from "@prisma/client";
import { type Response } from "supertest";

import { EMAIL_SERVICE_TOKEN, type IEmailService, type SendEmailOptions } from "@/common/application/ports/email-service.interface";

import { createStudent, TEST_USER_PASSWORD } from "../../factories";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";

const NEW_PASSWORD: string = "Nueva-Clave-2026";

class CapturingEmailService implements IEmailService {
  public readonly sent: SendEmailOptions[] = [];

  public async send(options: SendEmailOptions): Promise<void> {
    this.sent.push(options);

    return await Promise.resolve();
  }
}

async function waitForEmail(mail: CapturingEmailService, count: number): Promise<void> {
  for (let attempt: number = 0; attempt < 50 && mail.sent.length < count; attempt += 1) {
    await new Promise<void>((resolve: () => void) => {
      setTimeout(resolve, 20);
    });
  }
}

describe("flow: a forgotten password is reset with a single-use emailed link", () => {
  const mail: CapturingEmailService = new CapturingEmailService();
  let e2e: E2eApp;
  let api: ContractCaller;

  beforeAll(async () => {
    e2e = await createE2eApp({ configure: (builder: TestingModuleBuilder) => builder.overrideProvider(EMAIL_SERVICE_TOKEN).useValue(mail) });
    api = contractCaller(e2e.baseUrl);
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
    mail.sent.length = 0;
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should email a link whose token resets the password once and revokes the old sessions", async () => {
    const student: User = await createStudent(e2e.prisma);
    const login: Response = await api("POST", "/api/auth/login", undefined, { email: student.email, password: TEST_USER_PASSWORD });
    expectStatus(login, 200);
    const oldRefresh: string = (login.body.data as { refreshToken: string }).refreshToken;

    expectStatus(await api("POST", "/api/auth/password/forgot", undefined, { email: student.email }), 202);
    await waitForEmail(mail, 1);

    expect(mail.sent).toHaveLength(1);
    expect(mail.sent[0]?.to).toBe(student.email);
    const link: string = /https?:\/\/\S+\/auth\/reset-password\?token=\S+/.exec(mail.sent[0]?.body ?? "")?.[0] ?? "";
    const token: string = new URL(link).searchParams.get("token") ?? "";
    expect(token.length).toBeGreaterThan(20);
    const stored: { tokenHash: string }[] = await e2e.prisma.passwordResetToken.findMany({ where: { userId: student.id }, select: { tokenHash: true } });
    expect(stored).toHaveLength(1);
    expect(stored[0]?.tokenHash).not.toBe(token);

    expectStatus(await api("POST", "/api/auth/password/reset", undefined, { token, newPassword: NEW_PASSWORD }), 200);

    expect((await api("POST", "/api/auth/refresh", undefined, { refreshToken: oldRefresh })).status).toBe(401);
    expect((await api("POST", "/api/auth/login", undefined, { email: student.email, password: TEST_USER_PASSWORD })).status).toBe(401);
    expectStatus(await api("POST", "/api/auth/login", undefined, { email: student.email, password: NEW_PASSWORD }), 200);

    const reused: Response = await api("POST", "/api/auth/password/reset", undefined, { token, newPassword: "Otra-Clave-2026" });
    expectStatus(reused, 400);
    expect(reused.body.code).toBe("auth.password_reset_token_invalid");
  });

  it("should answer 202 for an unknown email without sending anything", async () => {
    expectStatus(await api("POST", "/api/auth/password/forgot", undefined, { email: "nadie@ventylab.test" }), 202);
    await waitForEmail(mail, 1);

    expect(mail.sent).toHaveLength(0);
  });
});
