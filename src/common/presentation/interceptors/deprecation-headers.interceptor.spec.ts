/*
 * Funcionalidad: Pruebas de las cabeceras de deprecación
 * Descripción: Verifica la resolución de la ruta sucesora de DeprecatedRoute y DeprecatedAlias (renombre de parámetros, prefijo del alias, rutas no heredadas), el valor RFC 9745 de Deprecation y que DeprecationHeadersInterceptor agregue Deprecation y Link solo en rutas heredadas y omita Link cuando la sucesora necesita un parámetro que la petición no trae
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CallHandler, type ExecutionContext } from "@nestjs/common";
import { lastValueFrom, of } from "rxjs";

import { DeprecatedAlias, DeprecatedRoute } from "@/common/presentation/decorators/deprecated-route.decorator";
import { DeprecationHeadersInterceptor } from "@/common/presentation/interceptors/deprecation-headers.interceptor";
import {
  deprecationHeaderValue,
  type DeprecationRule,
  fillSuccessorPath,
  readDeprecationRules,
  resolveDeprecation,
  type ResolvedDeprecation,
} from "@/common/presentation/utils/deprecation.util";

@DeprecatedAlias({ alias: "api/old-items", successor: "api/items" })
class ItemsController {
  public list(): void {
    return undefined;
  }
}

class OrdersController {
  @DeprecatedRoute({ successor: "/api/orders/by-number/:number", successorParams: { number: "legacyId" } })
  public byLegacyId(): void {
    return undefined;
  }

  @DeprecatedRoute({ successor: "/api/orders/:orderId/lines", successorMethod: "POST" })
  public update(): void {
    return undefined;
  }

  public current(): void {
    return undefined;
  }
}

function contextFor(controller: object, handler: object, routePath: string, params: Record<string, string>, headers: Record<string, string>): ExecutionContext {
  const response: { setHeader: (name: string, value: string) => void } = {
    setHeader: (name: string, value: string): void => {
      headers[name] = value;
    },
  };

  return {
    getType: (): string => "http",
    getHandler: (): object => handler,
    getClass: (): object => controller,
    switchToHttp: () => ({ getRequest: () => ({ route: { path: routePath }, params }), getResponse: () => response }),
  } as unknown as ExecutionContext;
}

async function intercept(controller: object, handler: object, routePath: string, params: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const next: CallHandler = { handle: () => of("body") };

  await lastValueFrom(new DeprecationHeadersInterceptor().intercept(contextFor(controller, handler, routePath, params, headers), next));

  return headers;
}

describe("deprecation rules", () => {
  it("maps an alias path onto the successor prefix and ignores the canonical path", () => {
    const rules: DeprecationRule[] = readDeprecationRules(ItemsController.prototype.list, ItemsController);

    expect(resolveDeprecation(rules, "/api/old-items/:id/next")?.successorPath).toBe("/api/items/:id/next");
    expect(resolveDeprecation(rules, "/api/old-items")?.successorPath).toBe("/api/items");
    expect(resolveDeprecation(rules, "/api/items/:id")).toBeUndefined();
    expect(resolveDeprecation(rules, "/api/old-items-archive")).toBeUndefined();
  });

  it("renames successor parameters to the legacy route names for filling", () => {
    const resolved: ResolvedDeprecation | undefined = resolveDeprecation(readDeprecationRules(OrdersController.prototype.byLegacyId, OrdersController), "/api/orders/legacy/:legacyId");

    expect(resolved?.successorPath).toBe("/api/orders/by-number/:number");
    expect(resolved?.successorTemplate).toBe("/api/orders/by-number/:legacyId");
    expect(fillSuccessorPath("/api/orders/by-number/:legacyId", { legacyId: "A 7" })).toBe("/api/orders/by-number/A%207");
    expect(fillSuccessorPath("/api/orders/:orderId/lines", {})).toBeUndefined();
  });

  it("formats the RFC 9745 Deprecation date as @epoch-seconds", () => {
    expect(deprecationHeaderValue("2026-10-12T00:00:00Z")).toBe("@1791763200");
  });
});

describe("DeprecationHeadersInterceptor", () => {
  it("sets Deprecation and a successor Link on a legacy alias", async () => {
    const headers: Record<string, string> = await intercept(ItemsController, ItemsController.prototype.list, "/api/old-items/:id", { id: "42" });

    expect(headers).toEqual({ Deprecation: "@1791763200", Link: "</api/items/42>; rel=\"successor-version\"" });
  });

  it("sets only Deprecation when the successor needs a parameter the request does not carry", async () => {
    const headers: Record<string, string> = await intercept(OrdersController, OrdersController.prototype.update, "/api/orders/:id", { id: "1" });

    expect(headers).toEqual({ Deprecation: "@1791763200" });
  });

  it("sets no header on the canonical path of an aliased controller or on a route without rules", async () => {
    const canonical: Record<string, string> = await intercept(ItemsController, ItemsController.prototype.list, "/api/items/:id", { id: "42" });
    const plain: Record<string, string> = await intercept(OrdersController, OrdersController.prototype.current, "/api/orders/current");

    expect({ canonical, plain }).toEqual({ canonical: {}, plain: {} });
  });
});
