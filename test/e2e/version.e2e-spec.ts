/*
 * Funcionalidad: Prueba e2e de la versión desplegada
 * Descripción: Arranca la aplicación Nest completa y verifica que GET /api/version responde 200 sin autenticación, con un cuerpo JSON crudo (sin el envoltorio APIResponse) que contiene exactamente sha, builtAt (ISO 8601 o "unknown") y contract igual a API_CONTRACT_VERSION, conforme al contrato OpenAPI
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Response } from "supertest";

import { API_CONTRACT_VERSION } from "@/common/presentation/api-contract-version";

import { contractCaller } from "../support/contract-api";
import { createE2eApp, type E2eApp } from "../support/e2e-app";

describe("e2e: deployed version endpoint", () => {
  let e2e: E2eApp;

  beforeAll(async () => {
    e2e = await createE2eApp();
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should expose sha, builtAt and contract as raw JSON without authentication", async () => {
    const response: Response = await contractCaller(e2e.baseUrl)("GET", "/api/version");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(Object.keys(response.body as object)).toEqual(["sha", "builtAt", "contract"]);
    expect(response.body).toStrictEqual({ sha: expect.any(String), builtAt: expect.any(String), contract: API_CONTRACT_VERSION });

    const builtAt: string = response.body.builtAt as string;

    expect(builtAt === "unknown" || new Date(builtAt).toISOString() === builtAt).toBe(true);
  });
});
