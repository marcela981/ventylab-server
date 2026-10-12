/*
 * Funcionalidad: Pruebas de HealthController
 * Descripción: Verifica la vida del servicio y la preparación: 200 ready cuando la base de datos responde, 503 not_ready cuando el ping falla o supera el tiempo máximo, y que ambas rutas omiten el limitador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { HttpStatus } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";
import { type Response } from "express";

import { type IDatabaseHealthProbe } from "@/common/application/ports/database-health-probe.interface";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { HealthController, NOT_READY_STATUS, READY_STATUS } from "@/common/presentation/controllers/health.controller";

const TIMEOUT_MS: number = 50;

function buildController(ping: () => Promise<void>): HealthController {
  const probe: IDatabaseHealthProbe = { ping };
  const config: ConfigService<EnvironmentVariables, true> = { get: jest.fn().mockReturnValue(TIMEOUT_MS) } as unknown as ConfigService<EnvironmentVariables, true>;

  return new HealthController(probe, config);
}

function fakeResponse(): { response: Response; status: jest.Mock } {
  const status: jest.Mock = jest.fn();

  return { response: { status } as unknown as Response, status };
}

describe("HealthController", () => {
  it("keeps the liveness contract", () => {
    const controller: HealthController = buildController(() => Promise.resolve());

    const result: { status: string; timestamp: string } = controller.healthcheck();

    expect(result.status).toBe("ok");
    expect(typeof result.timestamp).toBe("string");
  });

  it("reports ready with 200 when the database answers", async () => {
    const controller: HealthController = buildController(() => Promise.resolve());
    const { response, status } = fakeResponse();

    const result: { status: string } = await controller.readiness(response);

    expect(result).toEqual({ status: READY_STATUS });
    expect(status).toHaveBeenCalledWith(HttpStatus.OK);
  });

  it("reports not ready with 503 when the ping fails", async () => {
    const controller: HealthController = buildController(() => Promise.reject(new Error("connection refused")));
    const { response, status } = fakeResponse();

    const result: { status: string } = await controller.readiness(response);

    expect(result).toEqual({ status: NOT_READY_STATUS });
    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it("reports not ready with 503 when the ping exceeds the timeout", async () => {
    const controller: HealthController = buildController(() => new Promise<void>(() => undefined));
    const { response, status } = fakeResponse();

    const result: { status: string } = await controller.readiness(response);

    expect(result).toEqual({ status: NOT_READY_STATUS });
    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it("skips throttling for every health route", () => {
    const keys: string[] = Reflect.getMetadataKeys(HealthController);

    const skips: boolean = keys.some((key: string) => typeof key === "string" && key.startsWith("THROTTLER:SKIP") && Reflect.getMetadata(key, HealthController) === true);

    expect(skips).toBe(true);
  });
});
