/*
 * Funcionalidad: Filtro global HttpExceptionFilter
 * Descripción: Convierte toda excepción en el envoltorio estándar traducido (validación, dominio con argumentos de traducción opcionales y cabecera Retry-After cuando el error indica cuándo reintentar, HTTP, Prisma P2002/P2025, protección del superadmin del trigger protect_superadmin como 403, inesperada), registra en log, Sentry y error_logs, y nunca expone trazas de pila en la respuesta
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nestjs";
import { ValidationError } from "class-validator";
import { I18nContext, I18nService, I18nValidationException } from "nestjs-i18n";
import { formatI18nErrors } from "nestjs-i18n/dist/utils";

import { DomainError } from "@/common/domain/errors/domain-error";
import { ErrorLogService } from "@/common/infrastructure/logging/error-log/error-log.service";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { shouldSkipLogError } from "@/common/presentation/decorators/skip-log-error.decorator";
import { shouldSkipSaveErrorLog } from "@/common/presentation/decorators/skip-save-error-log.decorator";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { DOMAIN_ERROR_STATUS_MAP } from "@/common/presentation/errors-map";
import { sanitizeBody } from "@/common/presentation/utils/sanitize-body.util";

import type { Request, Response } from "express";

const PRISMA_ERROR_STATUS_MAP: ReadonlyMap<string, { statusCode: HttpStatus; code: string }> = new Map([
  ["P2002", { statusCode: HttpStatus.CONFLICT, code: "common.conflict" }],
  ["P2025", { statusCode: HttpStatus.NOT_FOUND, code: "common.not_found" }],
]);

// Raised by the protect_superadmin() trigger (SQLSTATE P0001); Prisma surfaces it as an unknown request error or as P2010 on raw queries.
const SUPERADMIN_PROTECTION_DB_MESSAGE: string = "Superadmin account cannot be demoted, deactivated or renamed";
const SUPERADMIN_PROTECTION_CODE: string = "common.superadmin_protected";

interface ExceptionResponse {
  statusCode: number;
  apiResponse: APIResponse<unknown>;
  headers?: Record<string, string>;
}

// Optional members a domain error may expose: interpolation values for its translated message and the moment the client may retry.
interface DomainErrorExtras {
  i18nArgs?: unknown;
  retryAt?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly _logger: Logger = new Logger(HttpExceptionFilter.name);

  public constructor(private readonly _errorLogService: ErrorLogService) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx: ReturnType<typeof host.switchToHttp> = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: Request = ctx.getRequest<Request>();
    const i18nContext: I18nContext | undefined = I18nContext.current(host);

    const exceptionResponse: ExceptionResponse = this._buildExceptionResponse(
      exception,
      request,
      i18nContext,
    );

    const isSentryCaptured: boolean =
      exception instanceof Error && exception.__sentry_captured__ === true;

    if (!shouldSkipLogError(exception) && !isSentryCaptured) {
      this._logException(exception, request, exceptionResponse.statusCode);

      if (!(exception instanceof DomainError)) {
        Sentry.captureException(exception, {
          mechanism: { handled: false, type: "auto.http.nestjs.global_filter" },
        });
      }
    }

    if (!shouldSkipSaveErrorLog(exception)) {
      this._saveErrorLogToDatabase(exception, request, exceptionResponse.statusCode);
    }

    if (exceptionResponse.headers) {
      response.set(exceptionResponse.headers);
    }

    response
      .status(exceptionResponse.statusCode)
      .json(exceptionResponse.apiResponse);
  }

  private _logException(exception: unknown, request: Request, statusCode: number): void {
    this._logger.error("Exception occurred", {
      traceId: request.traceId,
      exception,
      userId: request.user?.sub ?? null,
      content: {
        http: {
          method: request.method,
          path: request.path,
          body: sanitizeBody(request.body),
          query: Object.keys(request.query ?? {}).length > 0 ? request.query : null,
          params: Object.keys(request.params ?? {}).length > 0 ? request.params : null,
          statusCode: statusCode,
        },
      },
    });
  }

  private _buildExceptionResponse(
    exception: unknown,
    request: Request,
    i18nContext: I18nContext | undefined,
  ): ExceptionResponse {
    if (exception instanceof I18nValidationException) {
      return this._handleI18nValidationException(
        exception,
        request,
        i18nContext,
      );
    }

    if (exception instanceof DomainError) {
      return this._handleDomainError(exception, request, i18nContext);
    }

    if (exception instanceof HttpException) {
      return this._handleHttpException(exception, request);
    }

    if (this._isSuperadminProtectionError(exception)) {
      return this._handleSuperadminProtectionError(request, i18nContext);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError && PRISMA_ERROR_STATUS_MAP.has(exception.code)) {
      return this._handlePrismaKnownRequestError(exception, request, i18nContext);
    }

    return this._handleUnexpectedError(request, i18nContext);
  }

  private _handleI18nValidationException(
    exception: I18nValidationException,
    request: Request,
    i18nContext: I18nContext | undefined,
  ): ExceptionResponse {
    const translatedErrors: ValidationError[] = formatI18nErrors(
      exception.errors ?? [],
      i18nContext?.service ?? ({} as I18nService),
      {
        lang: i18nContext?.lang,
      },
    );

    const validationMessages: string[] =
      this._extractValidationMessages(translatedErrors);

    const apiResponse: APIResponse<unknown> = new APIResponseBuilder()
      .setSuccess(false)
      .setMessage(validationMessages)
      .setCode("validation_error")
      .setTraceId(request.traceId)
      .build();

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      apiResponse,
    };
  }

  private _extractValidationMessages(errors: ValidationError[]): string[] {
    return errors.flatMap((error: ValidationError) => {
      if (error.constraints) {
        return Object.values(error.constraints);
      }

      return [];
    });
  }

  private _handleDomainError(
    exception: DomainError,
    request: Request,
    i18nContext: I18nContext | undefined,
  ): ExceptionResponse {
    const statusCode: number =
      DOMAIN_ERROR_STATUS_MAP.get(
        exception.constructor as new (...args: unknown[]) => DomainError,
      ) ?? HttpStatus.INTERNAL_SERVER_ERROR;

    const extras: DomainErrorExtras = exception as DomainErrorExtras;
    const args: Record<string, unknown> | undefined =
      typeof extras.i18nArgs === "object" && extras.i18nArgs !== null ? (extras.i18nArgs as Record<string, unknown>) : undefined;

    const translatedMessage: string = i18nContext
      ? i18nContext.t(exception.code, args ? { args } : undefined)
      : exception.message;

    const apiResponse: APIResponse<unknown> = new APIResponseBuilder()
      .setSuccess(false)
      .setMessage(translatedMessage)
      .setCode(exception.code)
      .setTraceId(request.traceId)
      .build();

    return {
      statusCode,
      apiResponse,
      headers: extras.retryAt instanceof Date ? { "Retry-After": this._retryAfterSeconds(extras.retryAt) } : undefined,
    };
  }

  private _retryAfterSeconds(retryAt: Date): string {
    return String(Math.max(0, Math.ceil((retryAt.getTime() - Date.now()) / 1000)));
  }

  private _handleHttpException(
    exception: HttpException,
    request: Request,
  ): ExceptionResponse {
    const statusCode: number = exception.getStatus();
    const exceptionResponse: string | object = exception.getResponse();

    const message: string =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : (exceptionResponse as { message?: string }).message ??
          exception.message;

    const apiResponse: APIResponse<unknown> = new APIResponseBuilder()
      .setSuccess(false)
      .setMessage(message)
      .setCode(this._getErrorCodeFromStatus(statusCode))
      .setTraceId(request.traceId)
      .build();

    return {
      statusCode,
      apiResponse,
    };
  }

  private _handlePrismaKnownRequestError(
    exception: Prisma.PrismaClientKnownRequestError,
    request: Request,
    i18nContext: I18nContext | undefined,
  ): ExceptionResponse {
    const mapping: { statusCode: HttpStatus; code: string } = PRISMA_ERROR_STATUS_MAP.get(exception.code) ?? {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: "common.internal_server_error",
    };

    const translatedMessage: string = i18nContext ? i18nContext.t(mapping.code) : mapping.code;

    const apiResponse: APIResponse<unknown> = new APIResponseBuilder()
      .setSuccess(false)
      .setMessage(translatedMessage)
      .setCode(mapping.code)
      .setTraceId(request.traceId)
      .build();

    return {
      statusCode: mapping.statusCode,
      apiResponse,
    };
  }

  private _isSuperadminProtectionError(exception: unknown): boolean {
    const isPrismaRequestError: boolean =
      exception instanceof Prisma.PrismaClientUnknownRequestError || exception instanceof Prisma.PrismaClientKnownRequestError;

    return isPrismaRequestError && (exception as Error).message.includes(SUPERADMIN_PROTECTION_DB_MESSAGE);
  }

  private _handleSuperadminProtectionError(request: Request, i18nContext: I18nContext | undefined): ExceptionResponse {
    const translatedMessage: string = i18nContext ? i18nContext.t(SUPERADMIN_PROTECTION_CODE) : SUPERADMIN_PROTECTION_DB_MESSAGE;

    const apiResponse: APIResponse<unknown> = new APIResponseBuilder()
      .setSuccess(false)
      .setMessage(translatedMessage)
      .setCode(SUPERADMIN_PROTECTION_CODE)
      .setTraceId(request.traceId)
      .build();

    return {
      statusCode: HttpStatus.FORBIDDEN,
      apiResponse,
    };
  }

  private _handleUnexpectedError(
    request: Request,
    i18nContext: I18nContext | undefined,
  ): ExceptionResponse {
    const translatedMessage: string = i18nContext
      ? i18nContext.t("common.internal_server_error")
      : "Internal server error";

    const apiResponse: APIResponse<unknown> = new APIResponseBuilder()
      .setSuccess(false)
      .setMessage(translatedMessage)
      .setCode("internal_server_error")
      .setTraceId(request.traceId)
      .build();

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      apiResponse,
    };
  }

  private _saveErrorLogToDatabase(
    exception: unknown,
    request: Request,
    statusCode: number,
  ): void {
    const content: Record<string, unknown> = {
      userId: request.user?.sub ?? null,
      message: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? (exception.stack ?? null) : null,
      http: {
        method: request.method,
        path: request.path,
        body: sanitizeBody(request.body),
        query:
          Object.keys(request.query ?? {}).length > 0
            ? (request.query as Record<string, unknown>)
            : null,
        params:
          Object.keys(request.params ?? {}).length > 0
            ? (request.params as Record<string, unknown>)
            : null,
        statusCode: statusCode,
      },
    };

    this._errorLogService
      .save(exception, request.traceId, content)
      .catch((error: unknown) => {
        this._logger.warn("Failed to save error log to database", {
          error,
          traceId: request.traceId,
        });
      });
  }

  private _getErrorCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: "bad_request",
      [HttpStatus.UNAUTHORIZED]: "unauthorized",
      [HttpStatus.FORBIDDEN]: "forbidden",
      [HttpStatus.NOT_FOUND]: "not_found",
      [HttpStatus.CONFLICT]: "conflict",
      [HttpStatus.INTERNAL_SERVER_ERROR]: "internal_server_error",
    };

    return statusMap[status] ?? "unknown_error";
  }
}
