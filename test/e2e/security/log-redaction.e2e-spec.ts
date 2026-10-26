/*
 * Funcionalidad: Prueba e2e de redacción de secretos y datos personales en los registros
 * Descripción: Con un logger de captura instalado en la aplicación e2e recorre inicio de sesión (correcto, con credenciales erróneas y con validación fallida), renovación de token (manipulada y con validación fallida), cambio de contraseña (contraseña actual errónea y nueva contraseña débil) y una llamada de IA del tutor cuyo primer proveedor falla con un mensaje que contiene claves; comprueba que ni la salida del logger, ni las filas de error_logs, ni las filas de ai_call_logs, ni el prompt enviado al proveedor contienen contraseñas, tokens, secretos, claves de API, correos o nombres del usuario. v1.2: sin los pasos del puente de NextAuth retirado
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type User } from "@prisma/client";
import request, { type Response } from "supertest";

import { type LlmRequest } from "@/features/ai/application/ports/llm-provider.interface";
import { FakeLlmProvider } from "@/features/ai/application/testing/ai-test-doubles-spec";

import { type ContentTree, createContentTree, createStudent, TEST_USER_PASSWORD } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { CapturingLogger } from "../../support/capturing-logger";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { delay } from "../../support/polling";

const STUDENT_NAME: string = "Valentina Restrepo";
const STUDENT_EMAIL: string = "valentina.restrepo@ventylab.test";
const NEW_PASSWORD: string = "Rotated-Secret-Pass-987";
const JWT_SECRETS: readonly string[] = ["test-jwt-secret-only-for-automated-tests", "test-jwt-refresh-secret-only-for-automated-tests"];
const FAKE_PROVIDER_KEY: string = "fake-provider-key-security-test-0000000000";
const FAKE_PROVIDER_BEARER: string = "sk-fake-security-test-bearer-0000000000";
const ERROR_LOG_SETTLE_MS: number = 500;

interface Haystack {
  readonly logs: string;
  readonly errorLogs: string;
  readonly aiCallLogs: string;
}

describe("security: secrets and personal data never reach the logs", () => {
  const logger: CapturingLogger = new CapturingLogger();
  const failingGemini: FakeLlmProvider = new FakeLlmProvider("gemini", { kind: "error", error: new Error(`401 from upstream: key=${FAKE_PROVIDER_KEY} authorization=Bearer ${FAKE_PROVIDER_BEARER}`) });
  const answeringOpenai: FakeLlmProvider = new FakeLlmProvider("openai", { kind: "text", text: "La PEEP mantiene una presión positiva al final de la espiración." });
  let e2e: E2eApp;
  let student: User;

  beforeAll(async () => {
    e2e = await createE2eApp({ aiProviders: [failingGemini, answeringOpenai], logger });
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
    student = await createStudent(e2e.prisma, { name: STUDENT_NAME, email: STUDENT_EMAIL });
    logger.clear();
  });

  afterAll(async () => {
    await e2e?.close();
  });

  async function collect(): Promise<Haystack> {
    await delay(ERROR_LOG_SETTLE_MS);

    const errorLogs: unknown[] = await e2e.prisma.errorLog.findMany();
    const aiCallLogs: unknown[] = await e2e.prisma.aiCallLog.findMany();

    return { logs: logger.render(), errorLogs: JSON.stringify(errorLogs), aiCallLogs: JSON.stringify(aiCallLogs) };
  }

  function leaks(haystack: Haystack, needles: readonly string[]): string[] {
    return Object.entries(haystack).flatMap(([source, text]: [string, string]): string[] =>
      needles.filter((needle: string): boolean => needle.length > 0 && text.includes(needle)).map((needle: string): string => `${source} contains ${needle.slice(0, 4)}… (${needle.length} chars)`),
    );
  }

  // Guards against a vacuous pass: the error paths above must have been logged and persisted.
  function expectErrorPathRecorded(haystack: Haystack): void {
    expect(haystack.logs).toContain("Exception occurred");
    expect(haystack.errorLogs).not.toBe("[]");
  }

  function post(path: string, body: object, headers: Record<string, string> = {}): Promise<Response> {
    return request(e2e.baseUrl).post(path).set(headers).send(body);
  }

  it("should keep passwords, tokens and emails out of the logs on login and refresh", async () => {
    const loggedIn: Response = await post("/api/auth/login", { email: STUDENT_EMAIL, password: TEST_USER_PASSWORD });
    const accessToken: string = (loggedIn.body as { data: { accessToken: string } }).data.accessToken;
    const refreshToken: string = (loggedIn.body as { data: { refreshToken: string } }).data.refreshToken;
    const tamperedRefreshToken: string = `${refreshToken.slice(0, -4)}AAAA`;

    const responses: Response[] = [
      await post("/api/auth/login", { email: STUDENT_EMAIL, password: "Wrong-Password-123" }),
      await post("/api/auth/login", { email: STUDENT_EMAIL, password: 12345 }),
      await post("/api/auth/login", { email: "not-an-email", password: TEST_USER_PASSWORD, note: STUDENT_EMAIL }),
      await post("/api/auth/refresh", { refreshToken: tamperedRefreshToken }),
      await post("/api/auth/refresh", { refreshToken: tamperedRefreshToken, unexpected: { nested: [STUDENT_EMAIL] } }),
      await post("/api/auth/refresh", { refreshToken: 42, previous: refreshToken }),
    ];

    expect(loggedIn.status).toBe(200);
    expect(responses.map((response: Response): number => response.status)).toEqual([401, 400, 400, 401, 401, 400]);
    const haystack: Haystack = await collect();

    expectErrorPathRecorded(haystack);
    expect(leaks(haystack, [TEST_USER_PASSWORD, "Wrong-Password-123", accessToken, refreshToken, tamperedRefreshToken, STUDENT_EMAIL, ...JWT_SECRETS])).toEqual([]);
  });

  it("should keep the current and new passwords out of the logs on password change", async () => {
    const token: string = await mintAccessToken(student, e2e.app);

    const wrongCurrent: Response = await request(e2e.baseUrl).post("/api/users/me/change-password").set("authorization", `Bearer ${token}`).send({ currentPassword: "Not-The-Current-1", newPassword: NEW_PASSWORD });
    const weakNew: Response = await request(e2e.baseUrl).post("/api/users/me/change-password").set("authorization", `Bearer ${token}`).send({ currentPassword: TEST_USER_PASSWORD, newPassword: "weak" });

    expect(wrongCurrent.status).toBe(400);
    expect(weakNew.status).toBe(400);
    const haystack: Haystack = await collect();

    expectErrorPathRecorded(haystack);
    expect(leaks(haystack, [TEST_USER_PASSWORD, "Not-The-Current-1", NEW_PASSWORD, token])).toEqual([]);
  });

  it("should redact the student's name and email from the prompt and keep provider keys out of telemetry and logs", async () => {
    const tree: ContentTree = await createContentTree(e2e.prisma);
    const token: string = await mintAccessToken(student, e2e.app);
    const question: string = `Soy ${STUDENT_NAME} (${STUDENT_EMAIL}). ¿Qué es la PEEP?`;

    const response: Response = await request(e2e.baseUrl).post(`/api/tutor/pages/${tree.page.id}/deepen`).set("authorization", `Bearer ${token}`).send({ question });
    const prompts: string = JSON.stringify([...failingGemini.requests, ...answeringOpenai.requests].map((sent: LlmRequest): unknown => sent.messages));
    const haystack: Haystack = await collect();

    expect(response.status).toBe(200);
    expect(answeringOpenai.calls).toBeGreaterThan(0);
    expect(prompts).toContain("PEEP");
    expect(leaks({ ...haystack, logs: `${haystack.logs}\n${prompts}` }, [STUDENT_EMAIL, STUDENT_NAME, "Valentina", "Restrepo"])).toEqual([]);
    expect(leaks(haystack, [FAKE_PROVIDER_KEY, FAKE_PROVIDER_BEARER, token])).toEqual([]);
    expect(haystack.aiCallLogs).toContain("PAGE_DEEPEN");
  });
});
