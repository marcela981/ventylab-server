/*
 * Funcionalidad: Pruebas de la respuesta HTTP de los errores del gateway de IA
 * Descripción: Verifica con el filtro global de excepciones que la cuota de IA agotada responda 429 con el código ai.quota_exceeded y la cabecera Retry-After calculada desde el momento de reinicio (check 8), y que la falta de proveedores responda 503 sin Retry-After
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ArgumentsHost, Logger } from "@nestjs/common";

import { type ErrorLogService } from "@/common/infrastructure/logging/error-log/error-log.service";
import { HttpExceptionFilter } from "@/common/presentation/filters/http-exception.filter";
import { AiProvidersUnavailableError, AiQuotaExceededError } from "@/features/ai/domain/ai.errors";

interface ResponseDouble {
  set: jest.Mock;
  status: jest.Mock;
  json: jest.Mock;
}

function responseDouble(): ResponseDouble {
  const response: ResponseDouble = { set: jest.fn(), status: jest.fn(), json: jest.fn() };

  response.set.mockReturnValue(response);
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response;
}

function hostFor(response: ResponseDouble): ArgumentsHost {
  const request: Record<string, unknown> = { traceId: "trace-1", method: "POST", path: "/api/tutor/conversations", body: {}, query: {}, params: {} };

  return {
    switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
    getType: () => "http",
    getArgs: () => [request, response],
    getArgByIndex: (index: number) => [request, response][index],
  } as unknown as ArgumentsHost;
}

describe("AI gateway errors over HTTP", () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    const errorLogService: { save: jest.Mock } = { save: jest.fn().mockResolvedValue(undefined) };

    filter = new HttpExceptionFilter(errorLogService as unknown as ErrorLogService);
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    jest.useFakeTimers({ now: new Date("2026-10-05T23:59:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should answer 429 with ai.quota_exceeded and Retry-After until the quota resets (check 8)", () => {
    const response: ResponseDouble = responseDouble();

    filter.catch(new AiQuotaExceededError(new Date("2026-10-06T00:00:00Z")), hostFor(response));

    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.set).toHaveBeenCalledWith({ "Retry-After": "60" });
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, code: "ai.quota_exceeded" }));
  });

  it("should answer 503 without Retry-After when no provider can answer", () => {
    const response: ResponseDouble = responseDouble();

    filter.catch(new AiProvidersUnavailableError(), hostFor(response));

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.set).not.toHaveBeenCalled();
  });
});
