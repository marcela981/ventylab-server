/*
 * Funcionalidad: Pruebas de autorización de StepsController
 * Descripción: Verifica que las lecturas de /api/steps y /api/cards usen OptionalJwtAuthGuard como el resto del contenido y que las escrituras exijan JWT y permisos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { RequestMethod } from "@nestjs/common";
import { GUARDS_METADATA, METHOD_METADATA } from "@nestjs/common/constants";

import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "@/features/auth/presentation/guards/optional-jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { StepsController } from "@/features/steps/presentation/controllers/steps.controller";

interface RouteGuards {
  name: string;
  method: RequestMethod;
  guards: unknown[];
}

function readRoutes(): RouteGuards[] {
  const prototype: Record<string, unknown> = StepsController.prototype as unknown as Record<string, unknown>;

  return Object.getOwnPropertyNames(prototype)
    .filter((name: string) => name !== "constructor")
    .map((name: string): RouteGuards => {
      const handler: object = prototype[name] as object;

      return {
        name,
        method: Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod,
        guards: (Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[] | undefined) ?? [],
      };
    });
}

describe("StepsController authorization", () => {
  it("guards every read route with OptionalJwtAuthGuard", () => {
    const reads: RouteGuards[] = readRoutes().filter((route: RouteGuards) => route.method === RequestMethod.GET);

    expect(reads.map((route: RouteGuards) => route.name).sort()).toEqual(["getNextStep", "getPreviousStep", "getStepById", "getSteps"]);
    expect(reads.every((route: RouteGuards) => route.guards.length === 1 && route.guards[0] === OptionalJwtAuthGuard)).toBe(true);
  });

  it("guards every write route with JWT and permissions", () => {
    const writes: RouteGuards[] = readRoutes().filter((route: RouteGuards) => route.method !== RequestMethod.GET);

    expect(writes).toHaveLength(4);
    expect(writes.every((route: RouteGuards) => route.guards[0] === JwtAuthGuard && route.guards[1] === PermissionsGuard)).toBe(true);
  });
});
