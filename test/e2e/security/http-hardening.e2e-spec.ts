/*
 * Funcionalidad: Prueba e2e del endurecimiento HTTP
 * Descripción: Con la aplicación e2e (misma configuración HTTP que main.ts y la documentación montada) comprueba las cabeceras de seguridad de helmet en respuestas correctas y de error, la ausencia de x-powered-by, que la interfaz de documentación conserva su comportamiento fuera de producción, que CORS no autoriza un origen ajeno ni una vista previa de Vercel deshabilitada pero sí el origen configurado, y que un cuerpo JSON o urlencoded por encima del límite responde 413 con el código traducido common.payload_too_large sin escribir error_logs
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import request, { type Response } from "supertest";

import { CapturingLogger } from "../../support/capturing-logger";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { delay } from "../../support/polling";

const ALLOWED_ORIGIN: string = "http://localhost:3000";
const FOREIGN_ORIGIN: string = "https://attacker.example";
const VERCEL_PREVIEW_ORIGIN: string = "https://ventylab-git-feature-x.vercel.app";
const JSON_LIMIT_BYTES: number = 10 * 1024 * 1024;
const URLENCODED_LIMIT_BYTES: number = 100 * 1024;
const ERROR_LOG_SETTLE_MS: number = 300;

function expectSecurityHeaders(response: Response): void {
  expect(response.headers["x-powered-by"]).toBeUndefined();
  expect(response.headers["x-content-type-options"]).toBe("nosniff");
  expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
  expect(response.headers["strict-transport-security"]).toContain("max-age=");
  expect(response.headers["referrer-policy"]).toBe("no-referrer");
  expect(response.headers["content-security-policy"]).toContain("default-src 'self'");
  expect(response.headers["content-security-policy"]).toContain("frame-ancestors 'self'");
}

describe("security: HTTP hardening", () => {
  const logger: CapturingLogger = new CapturingLogger();
  let e2e: E2eApp;

  beforeAll(async () => {
    e2e = await createE2eApp({ logger, withDocs: true });
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
    logger.clear();
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should send the security headers and no x-powered-by on successful and error responses", async () => {
    const responses: Response[] = [
      await request(e2e.baseUrl).get("/health"),
      await request(e2e.baseUrl).get("/api/auth/me"),
      await request(e2e.baseUrl).get("/api/does-not-exist"),
      await request(e2e.baseUrl).post("/api/auth/login").set("content-type", "application/json").send("{not json"),
    ];

    expect(responses.map((response: Response): number => response.status)).toEqual([200, 401, 404, 400]);
    responses.forEach(expectSecurityHeaders);
  });

  it("should keep the documentation UI without a CSP outside production while the API keeps it", async () => {
    const ui: Response = await request(e2e.baseUrl).get("/api/docs");
    const document: Response = await request(e2e.baseUrl).get("/api/docs-json");

    expect(ui.status).toBe(200);
    expect(ui.text).toContain("cdn.jsdelivr.net");
    expect(ui.headers["content-security-policy"]).toBeUndefined();
    expect(ui.headers["x-powered-by"]).toBeUndefined();
    expect(document.status).toBe(200);
    expect(document.headers["content-security-policy"]).toContain("default-src 'self'");
  });

  it("should not grant CORS to a foreign origin or to a disabled Vercel preview, and grant it to the configured origin", async () => {
    const foreign: Response = await request(e2e.baseUrl).get("/health").set("origin", FOREIGN_ORIGIN);
    const foreignPreflight: Response = await request(e2e.baseUrl).options("/api/auth/login").set("origin", FOREIGN_ORIGIN).set("access-control-request-method", "POST");
    const preview: Response = await request(e2e.baseUrl).options("/api/auth/login").set("origin", VERCEL_PREVIEW_ORIGIN).set("access-control-request-method", "POST");
    const allowed: Response = await request(e2e.baseUrl).options("/api/auth/login").set("origin", ALLOWED_ORIGIN).set("access-control-request-method", "POST");

    expect(foreign.headers["access-control-allow-origin"]).toBeUndefined();
    expect(foreignPreflight.headers["access-control-allow-origin"]).toBeUndefined();
    expect(preview.headers["access-control-allow-origin"]).toBeUndefined();
    expect(allowed.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("should answer 413 with the translated code for a JSON body over the limit without an error log row", async () => {
    const oversized: string = JSON.stringify({ email: "a@b.co", password: "x".repeat(JSON_LIMIT_BYTES) });

    const response: Response = await request(e2e.baseUrl).post("/api/auth/login").set("content-type", "application/json").set("x-lang", "en").send(oversized);

    await delay(ERROR_LOG_SETTLE_MS);
    expect(response.status).toBe(413);
    expect(response.body).toMatchObject({ success: false, code: "common.payload_too_large", message: "The request body is too large", data: null });
    expectSecurityHeaders(response);
    expect(await e2e.prisma.errorLog.count()).toBe(0);
    expect(logger.render()).not.toContain("Exception occurred");
  });

  it("should answer 413 for an urlencoded body over its limit and accept one under it", async () => {
    const oversized: string = `note=${"x".repeat(URLENCODED_LIMIT_BYTES)}`;

    const rejected: Response = await request(e2e.baseUrl).post("/api/auth/login").set("content-type", "application/x-www-form-urlencoded").send(oversized);
    const parsed: Response = await request(e2e.baseUrl).post("/api/auth/login").set("content-type", "application/x-www-form-urlencoded").send("email=not-an-email&password=x");

    expect(rejected.status).toBe(413);
    expect(rejected.body).toMatchObject({ code: "common.payload_too_large" });
    expect(parsed.status).toBe(400);
  });
});
