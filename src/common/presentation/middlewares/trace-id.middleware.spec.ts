/*
 * Funcionalidad: Pruebas de TraceIdMiddleware
 * Descripción: Verifica que el middleware reutilice un identificador de petición del cliente solo cuando cumple el formato permitido y que genere uno nuevo ante valores vacíos, demasiado largos o con caracteres no permitidos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type NextFunction, type Request, type Response } from "express";

import { TraceIdMiddleware } from "@/common/presentation/middlewares/trace-id.middleware";

interface TraceRun {
  readonly traceId: string | undefined;
  readonly headers: Record<string, string>;
}

function runMiddleware(headers: Record<string, string>): TraceRun {
  const request: Request = { headers } as unknown as Request;
  const responseHeaders: Record<string, string> = {};
  const response: Response = {
    setHeader: (name: string, value: string): void => {
      responseHeaders[name] = value;
    },
  } as unknown as Response;
  const next: NextFunction = jest.fn();

  new TraceIdMiddleware().use(request, response, next);

  return { traceId: request.traceId, headers: responseHeaders };
}

describe("TraceIdMiddleware", () => {
  it.each(["trace-1", "req_01.ab:cd", "a".repeat(64)])("reuses the valid client id %s", (clientId: string) => {
    const run: TraceRun = runMiddleware({ "x-trace-id": clientId });

    expect(run.traceId).toBe(clientId);
    expect(run.headers).toEqual({ "x-trace-id": clientId, "x-request-id": clientId });
  });

  it("falls back to a valid x-request-id", () => {
    const run: TraceRun = runMiddleware({ "x-request-id": "req-42" });

    expect(run.traceId).toBe("req-42");
  });

  it.each(["", "   ", "a".repeat(65), "bad id", "evil\nline", "<script>", "id;drop", "ñandú"])("generates a new id for the invalid client value %j", (clientId: string) => {
    const run: TraceRun = runMiddleware({ "x-trace-id": clientId, "x-request-id": clientId });

    expect(run.traceId).toBeDefined();
    expect(run.traceId).not.toBe(clientId);
    expect(run.traceId).toMatch(/^[A-Za-z0-9._:-]{1,64}$/);
  });
});
