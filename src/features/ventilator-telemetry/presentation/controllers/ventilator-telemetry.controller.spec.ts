/*
 * Funcionalidad: Pruebas de autorización del controlador de telemetría del ventilador
 * Descripción: Verifica que las métricas en JSON y CSV son rutas GET con ventilator:metrics (docentes y administradores, solo lectura), que el reinicio exige ventilator:metrics_reset (solo administradores) y que ninguna ruta que modifica estado comparte ventilator:metrics
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { RequestMethod } from "@nestjs/common";
import { METHOD_METADATA } from "@nestjs/common/constants";

import { PERMISSIONS_KEY } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { ROLE_PERMISSIONS } from "@/features/authorization/domain/role-permissions";
import { VentilatorTelemetryController } from "@/features/ventilator-telemetry/presentation/controllers/ventilator-telemetry.controller";

interface RouteAccess {
  readonly method: RequestMethod;
  readonly permissions: string[];
}

function routeAccess(handlerName: string): RouteAccess {
  const handler: object = (VentilatorTelemetryController.prototype as unknown as Record<string, object>)[handlerName];

  return { method: Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod, permissions: Reflect.getMetadata(PERMISSIONS_KEY, handler) as string[] };
}

function handlerNames(): string[] {
  return Object.getOwnPropertyNames(VentilatorTelemetryController.prototype).filter((name: string) => name !== "constructor");
}

describe("VentilatorTelemetryController authorization", () => {
  it("serves the metrics as read-only routes with ventilator:metrics", () => {
    const json: RouteAccess = routeAccess("getTelemetryMetrics");
    const csv: RouteAccess = routeAccess("exportTelemetryMetricsCsv");

    expect(json).toEqual({ method: RequestMethod.GET, permissions: ["ventilator:metrics"] });
    expect(csv).toEqual({ method: RequestMethod.GET, permissions: ["ventilator:metrics"] });
  });

  it("requires ventilator:metrics_reset to reset the metrics", () => {
    const reset: RouteAccess = routeAccess("resetTelemetryMetrics");

    expect(reset).toEqual({ method: RequestMethod.POST, permissions: ["ventilator:metrics_reset"] });
  });

  it("never guards a state-changing route with ventilator:metrics", () => {
    const mutating: string[] = handlerNames().filter((name: string) => {
      const access: RouteAccess = routeAccess(name);

      return access.method !== RequestMethod.GET && (access.permissions ?? []).includes("ventilator:metrics");
    });

    expect(mutating).toEqual([]);
  });

  it("lets teachers read the metrics and keeps the reset for administrators", () => {
    expect(ROLE_PERMISSIONS.TEACHER).toContain("ventilator:metrics");
    expect(ROLE_PERMISSIONS.TEACHER).not.toContain("ventilator:metrics_reset");
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain("ventilator:metrics");
    expect(ROLE_PERMISSIONS.ADMIN).toEqual(expect.arrayContaining(["ventilator:metrics", "ventilator:metrics_reset"]));
  });
});
