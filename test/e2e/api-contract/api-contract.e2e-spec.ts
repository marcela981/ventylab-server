/*
 * Funcionalidad: Prueba e2e del contrato de la API
 * Descripción: Con la aplicación completa comprueba que el documento OpenAPI construido en tiempo de ejecución (el que sirve /api/docs-json) sea idéntico byte a byte a openapi/openapi.json generado sin infraestructura, y que una muestra de rutas heredadas (alias /api/cards, /api/cases y /api/evaluation/quizzes, cambio de rol en /api/admin, página por ID JSON heredado y progreso por ID de lección) responda con la cabecera Deprecation y, cuando se puede construir, Link hacia la ruta sucesora, sin cambiar su código de estado ni su cuerpo, mientras las rutas sucesoras no llevan esas cabeceras
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { type Response } from "supertest";

import { buildOpenAPIDocument, serializeOpenAPIDocument } from "@/common/infrastructure/docs/openapi-document";
import { ROLE_PERMISSIONS } from "@/features/authorization/domain/role-permissions";
import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

import { type ActorSet, createActors } from "../../support/actors";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { callApi, type HttpMethod } from "../../support/http";
import { expectMatchesSpec } from "../../support/openapi-validator";

const DEPRECATED_AT: string = "@1791763200";

type Caller = "anonymous" | "student" | "admin";

type LegacyCase = readonly [label: string, caller: Caller, method: HttpMethod, path: string, body: object | undefined, successor: string | undefined];

const QUIZ_ID: string = randomUUID();
const USER_ID: string = randomUUID();
const LESSON_ID: string = randomUUID();

const LEGACY_CASES: readonly LegacyCase[] = [
  ["step alias list", "anonymous", "GET", "/api/cards", undefined, "/api/steps"],
  ["clinical case alias list", "student", "GET", "/api/cases", undefined, "/api/clinical-cases"],
  ["quiz alias detail", "student", "GET", `/api/evaluation/quizzes/${QUIZ_ID}`, undefined, `/api/quizzes/${QUIZ_ID}`],
  ["admin role change", "admin", "PATCH", `/api/admin/users/${USER_ID}/role`, { role: "TEACHER" }, `/api/users/${USER_ID}/role`],
  ["page by legacy JSON ID", "anonymous", "GET", "/api/pages/by-legacy-json/module-01-lesson-01", undefined, "/api/pages/by-lesson/module-01-lesson-01"],
  ["lesson progress by legacy lesson ID", "student", "GET", `/api/progress/lesson/${LESSON_ID}`, undefined, `/api/progress/lesson/${LESSON_ID}/details`],
  ["lesson progress update by legacy lesson ID", "student", "PUT", `/api/progress/lesson/${LESSON_ID}`, { timeSpent: 1 }, undefined],
];

describe("API contract (e2e)", () => {
  let e2e: E2eApp;
  let actors: ActorSet;

  function tokenOf(caller: Caller): string | undefined {
    return caller === "anonymous" ? undefined : actors[caller].token;
  }

  beforeAll(async () => {
    e2e = await createE2eApp();
    await resetDatabase(e2e.prisma);
    actors = await createActors(e2e.prisma, e2e.app);
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should build at runtime exactly the committed openapi/openapi.json", () => {
    const runtime: string = serializeOpenAPIDocument(buildOpenAPIDocument(e2e.app, { roles: { hierarchy: USER_ROLE_VALUES, permissions: ROLE_PERMISSIONS } }));
    const committed: string = readFileSync(join(__dirname, "..", "..", "..", "openapi", "openapi.json"), "utf-8");

    expect(runtime === committed).toBe(true);
  });

  it.each(LEGACY_CASES)("should mark the %s as deprecated", async (_label: string, caller: Caller, method: HttpMethod, path: string, body: object | undefined, successor: string | undefined) => {
    const response: Response = await callApi(e2e.baseUrl, method, path, tokenOf(caller), body);

    expect(response.status).toBeLessThan(500);
    expect(response.headers.deprecation).toBe(DEPRECATED_AT);
    expect(response.headers.link).toBe(successor === undefined ? undefined : `<${successor}>; rel="successor-version"`);
  });

  it("should answer the deprecated alias with the same status and body shape as its successor", async () => {
    const legacy: Response = await callApi(e2e.baseUrl, "GET", "/api/cards", undefined);
    const successor: Response = await callApi(e2e.baseUrl, "GET", "/api/steps", undefined);

    expect(legacy.status).toBe(200);
    expect(successor.status).toBe(200);
    expect(successor.headers.deprecation).toBeUndefined();
    expect(successor.headers.link).toBeUndefined();
    expect((legacy.body as { data: unknown }).data).toEqual((successor.body as { data: unknown }).data);
    expectMatchesSpec(legacy, "GET", "/api/cards");
    expectMatchesSpec(successor, "GET", "/api/steps");
  });
});
