/*
 * Funcionalidad: Pruebas de HttpExceptionFilter
 * Descripción: Verifica que el filtro global responda 429 con el código common.too_many_requests a la excepción del limitador de peticiones y 413 con common.payload_too_large a los errores de cliente de los parsers de cuerpo (en lugar de unknown_error o 500), que ese tráfico rechazado solo se registre como advertencia sin Sentry ni error_logs, que el registro de un error de validación no contenga el objeto recibido, sus valores ni correos, que un error de validación conserve los mensajes de primer nivel y agregue data.errors con las rutas anidadas a.b[0].c, y que un error de dominio con detalle por campo agregue data.errors traducido junto a sus detalles
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { inspect } from "node:util";

import { type ArgumentsHost, HttpStatus, Logger } from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { type ValidationError } from "class-validator";
import { I18nContext, I18nValidationException } from "nestjs-i18n";

import { DomainError } from "@/common/domain/errors/domain-error";
import { type ErrorLogService } from "@/common/infrastructure/logging/error-log/error-log.service";
import { HttpExceptionFilter } from "@/common/presentation/filters/http-exception.filter";

interface SentResponse {
  statusCode?: number;
  body?: Record<string, unknown>;
}

interface FilterHarness {
  readonly filter: HttpExceptionFilter;
  readonly save: jest.Mock;
  readonly sent: SentResponse;
  readonly host: ArgumentsHost;
}

const SECRET_PASSWORD: string = "Secret-Password-123";
const USER_EMAIL: string = "ana@ventylab.com";

function createHarness(body: Record<string, unknown> = {}): FilterHarness {
  const save: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const sent: SentResponse = {};
  const response: Record<string, jest.Mock> = {};

  response.set = jest.fn().mockReturnValue(response);
  response.status = jest.fn((statusCode: number) => {
    sent.statusCode = statusCode;

    return response;
  });
  response.json = jest.fn((payload: Record<string, unknown>) => {
    sent.body = payload;

    return response;
  });

  const request: Record<string, unknown> = { method: "POST", path: "/api/auth/login", body, query: {}, params: {}, traceId: "trace-1" };
  const host: ArgumentsHost = {
    switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
    getType: () => "http",
    getArgs: () => [request, response],
  } as unknown as ArgumentsHost;

  return { filter: new HttpExceptionFilter({ save } as unknown as ErrorLogService), save, sent, host };
}

function payloadTooLargeError(): Error {
  return Object.assign(new Error("request entity too large"), { status: HttpStatus.PAYLOAD_TOO_LARGE, statusCode: HttpStatus.PAYLOAD_TOO_LARGE, expose: true, type: "entity.too.large" });
}

class FieldDetailedError extends DomainError {
  public readonly fieldErrors: unknown[] = [
    { field: "orders.limit.items[0]", code: "orders.reasons.out_of_range", args: { min: 1, max: 5 }, message: "must be between 1 and 5" },
    { field: "ignored" },
  ];

  public constructor() {
    super("Invalid order limit", "orders.invalid_limit");
  }

  public get details(): { key: string } {
    return { key: "orders.limit" };
  }
}

function translatingContext(): Partial<I18nContext> {
  return {
    lang: "es",
    service: { translate: (key: string): string => `t:${key}` } as unknown as I18nContext["service"],
    t: ((key: string, options?: { args?: Record<string, unknown> }): string => `t:${key}${options?.args ? JSON.stringify(options.args) : ""}`) as I18nContext["t"],
  };
}

describe("HttpExceptionFilter", () => {
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should answer a throttled request with 429 and the common.too_many_requests code", () => {
    const harness: FilterHarness = createHarness();

    harness.filter.catch(new ThrottlerException(), harness.host);

    expect(harness.sent.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(harness.sent.body).toMatchObject({ success: false, code: "common.too_many_requests", traceId: "trace-1" });
  });

  it("should answer a body parser size error with 413 and the common.payload_too_large code instead of 500", () => {
    const harness: FilterHarness = createHarness();

    harness.filter.catch(payloadTooLargeError(), harness.host);

    expect(harness.sent.statusCode).toBe(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(harness.sent.body).toMatchObject({ success: false, code: "common.payload_too_large" });
  });

  it.each([
    ["a throttled request", (): unknown => new ThrottlerException()],
    ["an oversized body", payloadTooLargeError],
  ])("should log %s only as a warning, without error_logs or an error log entry", (_label: string, build: () => unknown) => {
    const harness: FilterHarness = createHarness();

    harness.filter.catch(build(), harness.host);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(harness.save).not.toHaveBeenCalled();
  });

  it("should log a validation error without the received object, its values or emails", () => {
    const body: Record<string, unknown> = { email: USER_EMAIL, password: SECRET_PASSWORD };
    const errors: ValidationError[] = [{ property: "email", value: USER_EMAIL, target: body, constraints: { isEmail: `auth.email_invalid|{"value":"${USER_EMAIL}"}` }, children: [] }];
    const harness: FilterHarness = createHarness(body);
    const i18n: Partial<I18nContext> = { lang: "en", service: { translate: (key: string): string => key } as unknown as I18nContext["service"], t: ((key: string): string => key) as I18nContext["t"] };

    jest.spyOn(I18nContext, "current").mockReturnValue(i18n as I18nContext);
    harness.filter.catch(new I18nValidationException(errors), harness.host);

    const logged: string = inspect(errorSpy.mock.calls, { depth: null });
    const persisted: string = JSON.stringify(harness.save.mock.calls[0][2]);

    expect(harness.sent.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(logged).toContain("isEmail");
    expect(logged).not.toContain(SECRET_PASSWORD);
    expect(logged).not.toContain(USER_EMAIL);
    expect(persisted).not.toContain(SECRET_PASSWORD);
    expect(persisted).not.toContain(USER_EMAIL);
  });

  it("should keep the top-level validation messages and add every nested field error to data.errors", () => {
    const errors: ValidationError[] = [
      { property: "name", value: 1, constraints: { isString: "common.name_invalid" }, children: [] },
      {
        property: "value",
        value: { items: [{ label: 2 }] },
        children: [
          {
            property: "items",
            value: [{ label: 2 }],
            children: [{ property: "0", value: { label: 2 }, children: [{ property: "label", value: 2, constraints: { isString: "common.label_invalid" }, children: [] }] }],
          },
        ],
      },
    ];
    const harness: FilterHarness = createHarness();

    jest.spyOn(I18nContext, "current").mockReturnValue(translatingContext() as I18nContext);
    harness.filter.catch(new I18nValidationException(errors), harness.host);

    expect(harness.sent.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(harness.sent.body).toMatchObject({
      code: "validation_error",
      message: ["t:common.name_invalid"],
      data: {
        errors: [
          { field: "name", message: "t:common.name_invalid" },
          { field: "value.items[0].label", message: "t:common.label_invalid" },
        ],
      },
    });
  });

  it("should add the translated field errors of a domain error next to its details", () => {
    const harness: FilterHarness = createHarness();

    jest.spyOn(I18nContext, "current").mockReturnValue(translatingContext() as I18nContext);
    harness.filter.catch(new FieldDetailedError(), harness.host);

    expect(harness.sent.body).toMatchObject({
      code: "orders.invalid_limit",
      data: { key: "orders.limit", errors: [{ field: "orders.limit.items[0]", message: `t:orders.reasons.out_of_range${JSON.stringify({ min: 1, max: 5 })}` }] },
    });
    expect((harness.sent.body?.data as { errors: unknown[] }).errors).toHaveLength(1);
  });

  it("should fall back to the field error message without a translation context", () => {
    const harness: FilterHarness = createHarness();

    jest.spyOn(I18nContext, "current").mockReturnValue(undefined);
    harness.filter.catch(new FieldDetailedError(), harness.host);

    expect(harness.sent.body).toMatchObject({ data: { errors: [{ field: "orders.limit.items[0]", message: "must be between 1 and 5" }] } });
  });
});
