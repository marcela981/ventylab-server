/*
 * Funcionalidad: Pruebas de la regla de acceso a la documentación
 * Descripción: Monta createDocsAccessMiddleware en una aplicación Express mínima con un verificador de tokens falso y comprueba que fuera de producción responda 200, que en producción responda 404 a anónimos, a tokens inválidos y a roles distintos de ADMIN y 200 a un ADMIN, y que SWAGGER_ALLOWED_IPS restrinja además la IP en ambos entornos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import express, { type Express, type Request, type Response } from "express";
import request, { type Response as TestResponse } from "supertest";

import { type AccessTokenClaims, type IAccessTokenVerifier } from "@/common/application/ports/access-token-verifier.interface";
import { createDocsAccessMiddleware, type DocsAccessOptions, parseAllowedIps } from "@/common/infrastructure/docs/docs-access";

const TOKENS: Readonly<Record<string, AccessTokenClaims>> = {
  "admin-token": { sub: "admin-1", role: "ADMIN" },
  "teacher-token": { sub: "teacher-1", role: "TEACHER" },
  "student-token": { sub: "student-1", role: "STUDENT" },
};

const verifier: IAccessTokenVerifier = {
  verify: (token: string): Promise<AccessTokenClaims | undefined> => Promise.resolve(TOKENS[token]),
};

function docsApp(options: DocsAccessOptions, tokenVerifier: IAccessTokenVerifier = verifier): Express {
  const app: Express = express();

  app.set("trust proxy", true);
  app.use("/api/docs-json", createDocsAccessMiddleware(options, tokenVerifier));
  app.get("/api/docs-json", (_req: Request, res: Response): void => {
    res.json({ openapi: "3.1.0" });
  });

  return app;
}

async function getDocs(app: Express, headers: Record<string, string> = {}): Promise<TestResponse> {
  return await request(app).get("/api/docs-json").set(headers);
}

describe("createDocsAccessMiddleware", () => {
  it("serves the documentation to anyone outside production", async () => {
    const response: TestResponse = await getDocs(docsApp({ isProduction: false }));

    expect(response.status).toBe(200);
  });

  it.each([
    ["anonymous", {}],
    ["an invalid token", { authorization: "Bearer forged" }],
    ["a student", { authorization: "Bearer student-token" }],
    ["a teacher", { authorization: "Bearer teacher-token" }],
    ["a non-bearer header", { authorization: "Basic admin-token" }],
  ])("answers 404 in production to %s", async (_label: string, headers: Record<string, string>) => {
    const response: TestResponse = await getDocs(docsApp({ isProduction: true }), headers);

    expect(response.status).toBe(404);
  });

  it("serves the documentation in production to an ADMIN token", async () => {
    const response: TestResponse = await getDocs(docsApp({ isProduction: true }), { authorization: "Bearer admin-token" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ openapi: "3.1.0" });
  });

  it("answers 404 in production when the token verifier fails", async () => {
    const failing: IAccessTokenVerifier = { verify: (): Promise<AccessTokenClaims | undefined> => Promise.reject(new Error("verifier down")) };

    const response: TestResponse = await getDocs(docsApp({ isProduction: true }, failing), { authorization: "Bearer admin-token" });

    expect(response.status).toBe(404);
  });

  it.each([false, true])("restricts the source IP when SWAGGER_ALLOWED_IPS lists addresses (production: %s)", async (isProduction: boolean) => {
    const app: Express = docsApp({ isProduction, allowedIps: "10.0.0.1, 10.0.0.2" });
    const admin: Record<string, string> = { authorization: "Bearer admin-token" };

    const allowed: TestResponse = await getDocs(app, { ...admin, "x-forwarded-for": "10.0.0.2" });
    const denied: TestResponse = await getDocs(app, { ...admin, "x-forwarded-for": "10.0.0.9" });

    expect([allowed.status, denied.status]).toEqual([200, 404]);
  });

  it.each([
    [undefined, undefined],
    ["", undefined],
    [" , ", undefined],
    ["*", undefined],
    ["1.1.1.1,*", undefined],
    ["1.1.1.1, 2.2.2.2", ["1.1.1.1", "2.2.2.2"]],
  ])("parses SWAGGER_ALLOWED_IPS %j", (raw: string | undefined, expected: string[] | undefined) => {
    expect(parseAllowedIps(raw)).toEqual(expected);
  });
});
