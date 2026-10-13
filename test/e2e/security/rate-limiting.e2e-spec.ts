/*
 * Funcionalidad: Prueba e2e de limitación de peticiones
 * Descripción: Enumera las rutas alcanzables sin autenticación (rol mínimo ANONYMOUS, el mismo conjunto que openapi.json marca con x-min-role) y falla si alguna se excluye del ThrottlerGuard global con @SkipThrottle sin estar en una lista de excepciones justificada, si las rutas de registro, inicio de sesión, refresco y puente no tienen un @Throttle más estricto que el global, o si el guard deja de ser global; además comprueba que una petición limitada responde 429 con el código traducido common.too_many_requests, la cabecera Retry-After y el envoltorio documentado, sin escribir error_logs
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";
import request, { type Response } from "supertest";

import { AppModule } from "@/app.module";
import { EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { ANONYMOUS_ACCESS, classifyAccess, collectRoutes, type RoleModel, type RouteDescriptor } from "@/common/infrastructure/docs/openapi-routes";
import { ROLE_PERMISSIONS } from "@/features/authorization/domain/role-permissions";
import { USER_ROLE_VALUES } from "@/features/users/domain/value-objects/user-role";

import { CapturingLogger } from "../../support/capturing-logger";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { expectMatchesSpec, loadOpenAPIDocument } from "../../support/openapi-validator";

const ROLES: RoleModel = { hierarchy: USER_ROLE_VALUES, permissions: ROLE_PERMISSIONS };

// Anonymous routes allowed to bypass the throttler, each with the reason it is safe.
const LIVENESS_EXEMPTION: string = "Liveness probe polled by the orchestrator every few seconds; static answer, no database or external call.";
const READINESS_EXEMPTION: string = "Readiness probe polled by the orchestrator; one database ping bounded by HEALTH_CHECK_TIMEOUT_MS.";

const THROTTLE_EXEMPT_ROUTES: Readonly<Record<string, string>> = {
  "get /": LIVENESS_EXEMPTION,
  "get /health": LIVENESS_EXEMPTION,
  "get /api/health": LIVENESS_EXEMPTION,
  "get /health/ready": READINESS_EXEMPTION,
  "get /api/health/ready": READINESS_EXEMPTION,
};

// Routes that issue tokens or create accounts must have their own limit below the global one.
const SIGN_IN_ROUTES: readonly string[] = [
  "post /api/auth/register",
  "post /api/auth/login",
  "post /api/auth/google",
  "post /api/auth/refresh",
  "post /api/auth/nextauth-token",
];

const LOGIN_RATE_LIMIT: number = 5;

// Production default of THROTTLE_LIMIT; the test environment raises it so suites are never throttled by accident.
const DEFAULT_GLOBAL_LIMIT: number = new EnvironmentVariables().THROTTLE_LIMIT;

interface ProviderEntry {
  readonly provide?: unknown;
  readonly useClass?: unknown;
}

function anonymousOperationsInSpec(): string[] {
  const paths: Record<string, Record<string, { "x-min-role"?: string }>> = loadOpenAPIDocument().paths as Record<string, Record<string, { "x-min-role"?: string }>>;

  return Object.entries(paths).flatMap(([path, operations]: [string, Record<string, { "x-min-role"?: string }>]): string[] =>
    Object.entries(operations)
      .filter(([, operation]: [string, { "x-min-role"?: string }]): boolean => operation["x-min-role"] === ANONYMOUS_ACCESS)
      .map(([method]: [string, unknown]): string => `${method} ${path}`),
  );
}

describe("security: rate limiting of anonymous routes", () => {
  const logger: CapturingLogger = new CapturingLogger();
  let e2e: E2eApp;
  let routes: RouteDescriptor[];
  let anonymousRoutes: RouteDescriptor[];

  beforeAll(async () => {
    e2e = await createE2eApp({ logger });
    routes = collectRoutes(e2e.app);
    anonymousRoutes = routes.filter((route: RouteDescriptor): boolean => classifyAccess(route, ROLES).minRole === ANONYMOUS_ACCESS);
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
    logger.clear();
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should register ThrottlerGuard as a global guard", () => {
    const providers: ProviderEntry[] = (Reflect.getMetadata("providers", AppModule) as ProviderEntry[] | undefined) ?? [];

    expect(providers.some((provider: ProviderEntry): boolean => provider.provide === APP_GUARD && provider.useClass === ThrottlerGuard)).toBe(true);
  });

  it("should enumerate the same anonymous routes as the OpenAPI contract", () => {
    const fromApp: string[] = anonymousRoutes.map((route: RouteDescriptor): string => route.key).sort();

    expect(fromApp.length).toBeGreaterThan(0);
    expect(fromApp).toEqual(anonymousOperationsInSpec().sort());
  });

  it("should throttle every anonymous route except the justified exemptions", () => {
    const unthrottled: string[] = anonymousRoutes.filter((route: RouteDescriptor): boolean => route.throttleSkipped && !(route.key in THROTTLE_EXEMPT_ROUTES)).map((route: RouteDescriptor): string => route.key);
    const staleExemptions: string[] = Object.keys(THROTTLE_EXEMPT_ROUTES).filter((key: string): boolean => !anonymousRoutes.some((route: RouteDescriptor): boolean => route.key === key && route.throttleSkipped));

    expect(unthrottled).toEqual([]);
    expect(staleExemptions).toEqual([]);
  });

  it("should give token-issuing and registration routes a stricter limit than the global throttler", () => {
    const limits: Record<string, number | undefined> = Object.fromEntries(SIGN_IN_ROUTES.map((key: string): [string, number | undefined] => [key, routes.find((route: RouteDescriptor): boolean => route.key === key)?.throttleLimit]));
    const missing: string[] = Object.entries(limits).filter(([, limit]: [string, number | undefined]): boolean => limit === undefined || limit >= DEFAULT_GLOBAL_LIMIT).map(([key]: [string, unknown]): string => key);

    expect(missing).toEqual([]);
  });

  it("should answer a throttled request with 429, the translated code, Retry-After and no error log row", async () => {
    const attempts: Response[] = [];

    for (let attempt: number = 0; attempt < LOGIN_RATE_LIMIT; attempt++) {
      attempts.push(await request(e2e.baseUrl).post("/api/auth/login").set("x-lang", "es").send({}));
    }

    logger.clear();

    const throttled: Response = await request(e2e.baseUrl).post("/api/auth/login").set("x-lang", "es").send({});

    expect(attempts.map((response: Response): number => response.status)).toEqual(Array.from({ length: LOGIN_RATE_LIMIT }, (): number => 400));
    expect(throttled.status).toBe(429);
    expect(throttled.body).toMatchObject({ success: false, code: "common.too_many_requests", message: "Demasiadas peticiones, inténtalo de nuevo más tarde" });
    expect(Number(throttled.headers["retry-after"])).toBeGreaterThan(0);
    expectMatchesSpec(throttled, "post", "/api/auth/login");
    expect(await e2e.prisma.errorLog.count({ where: { content: { path: ["http", "statusCode"], equals: 429 } } })).toBe(0);
    expect(logger.render()).not.toContain("Exception occurred");
  });

  it("should throttle registration attempts below the global limit", async () => {
    const statuses: number[] = [];

    for (let attempt: number = 0; attempt < 11; attempt++) {
      statuses.push((await request(e2e.baseUrl).post("/api/auth/register").send({})).status);
    }

    expect(statuses.slice(0, 10).every((status: number): boolean => status === 400)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
