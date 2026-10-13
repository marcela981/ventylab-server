/*
 * Funcionalidad: Prueba e2e de la matriz de autorización
 * Descripción: Arranca la aplicación completa, recorre la pila de rutas del router de Express (4 o 5) y falla si alguna ruta registrada no tiene entrada en la matriz o si alguna entrada no corresponde a una ruta; luego envía, por cada entrada y actor (anónimo, estudiante, docente, administrador, superadministrador), una petición con parámetros UUID aleatorios y cuerpo vacío y comprueba el resultado esperado (401, 403, 404 o permitido); las respuestas en streaming se abortan tras recibir las cabeceras
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { randomUUID } from "node:crypto";

import { type ActorSet, authHeaders, createActors } from "../../support/actors";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";

import { type Actor, ACTORS, AUTHORIZATION_MATRIX, type ActorOutcomes, type Outcome } from "./authorization-matrix";

interface RouteLayer {
  readonly route?: { readonly path: string | string[]; readonly methods: Record<string, boolean> };
}

interface ExpressRouterHolder {
  readonly _router?: { readonly stack: RouteLayer[] };
  readonly router?: { readonly stack: RouteLayer[] };
}

interface ObservedResponse {
  readonly actor: Actor;
  readonly expected: Outcome;
  readonly status: number;
}

const BODY_METHODS: readonly string[] = ["POST", "PUT", "PATCH"];

function collectRegisteredRoutes(e2e: E2eApp): string[] {
  const instance: ExpressRouterHolder = e2e.app.getHttpAdapter().getInstance() as unknown as ExpressRouterHolder;
  // Express 4 exposes the root router as app._router; Express 5 as the app.router getter.
  const stack: RouteLayer[] = (instance._router ?? instance.router)?.stack ?? [];
  const keys: Set<string> = new Set<string>();

  for (const layer of stack) {
    if (!layer.route) {
      continue;
    }

    const paths: string[] = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];

    for (const method of Object.keys(layer.route.methods).filter((name: string): boolean => layer.route?.methods[name] === true)) {
      paths.forEach((path: string): void => {
        keys.add(`${method.toUpperCase()} ${path}`);
      });
    }
  }

  return [...keys].sort();
}

function fillPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, (): string => randomUUID());
}

function matches(expected: Outcome, status: number): boolean {
  return expected === "allow" ? status !== 401 && status !== 403 : status === expected;
}

async function send(baseUrl: string, method: string, path: string, headers: Record<string, string>): Promise<number> {
  const controller: AbortController = new AbortController();
  const hasBody: boolean = BODY_METHODS.includes(method);

  const response: Response = await fetch(`${baseUrl}${fillPath(path)}`, {
    method,
    headers: { ...headers, ...(hasBody ? { "content-type": "application/json" } : {}) },
    body: hasBody ? "{}" : undefined,
    signal: controller.signal,
  });

  // Stream responses (SSE, CSV) never end on their own: only the status line and headers matter here.
  controller.abort();

  return response.status;
}

describe("authorization matrix (e2e)", () => {
  let e2e: E2eApp;
  let actors: ActorSet;
  const serverErrors: string[] = [];

  beforeAll(async () => {
    e2e = await createE2eApp();
    await resetDatabase(e2e.prisma);
    actors = await createActors(e2e.prisma, e2e.app);
  });

  afterAll(async () => {
    // A 5xx still means the guards let the request through, so it does not fail the matrix; it is reported for triage.
    if (serverErrors.length > 0) {
      process.stdout.write(`Authorization matrix: ${serverErrors.length} request(s) answered 5xx:\n${serverErrors.join("\n")}\n`);
    }

    await e2e?.close();
  });

  it("should have a matrix entry for every registered route and no stale entries", () => {
    const registered: string[] = collectRegisteredRoutes(e2e);
    const declared: string[] = Object.keys(AUTHORIZATION_MATRIX);

    const missing: string[] = registered.filter((key: string): boolean => !(key in AUTHORIZATION_MATRIX));
    const stale: string[] = declared.filter((key: string): boolean => !registered.includes(key));

    expect(registered.length).toBeGreaterThan(0);
    expect({ missing, stale }).toEqual({ missing: [], stale: [] });
  });

  it.each(Object.entries(AUTHORIZATION_MATRIX))("%s", async (key: string, outcomes: ActorOutcomes) => {
    const [method, path] = key.split(" ");
    const observed: ObservedResponse[] = [];

    for (const actor of ACTORS) {
      const status: number = await send(e2e.baseUrl, method, path, authHeaders(actors, actor));

      observed.push({ actor, expected: outcomes[actor], status });

      if (status >= 500) {
        serverErrors.push(`${key} as ${actor}: ${status}`);
      }
    }

    const mismatches: ObservedResponse[] = observed.filter((entry: ObservedResponse): boolean => !matches(entry.expected, entry.status));

    expect(mismatches).toEqual([]);
  });
});
