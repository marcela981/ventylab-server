/*
 * Funcionalidad: Logger estructurado AppLogger
 * Descripción: Implementa LoggerService de NestJS: líneas JSON con nivel, fecha, contexto, mensaje y traceId en producción, y el formato de consola de Nest en desarrollo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ConsoleLogger, Injectable, type LoggerService, type LogLevel } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Environment, type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { type RequestContext, RequestContextService } from "@/common/infrastructure/context/request-context.service";

interface StructuredLogEntry {
  level: LogLevel;
  timestamp: string;
  context?: string;
  message: unknown;
  traceId?: string;
  stack?: string;
  details?: unknown[];
}

@Injectable()
export class AppLogger implements LoggerService {
  private readonly _consoleLogger: ConsoleLogger = new ConsoleLogger();
  private readonly _isProduction: boolean;

  public constructor(
    private readonly _configService: ConfigService<EnvironmentVariables, true>,
    private readonly _requestContextService: RequestContextService,
  ) {
    this._isProduction = this._configService.get("NODE_ENV", { infer: true }) === Environment.Production;
  }

  public log(message: unknown, ...optionalParams: unknown[]): void {
    this._write("log", message, optionalParams);
  }

  public error(message: unknown, ...optionalParams: unknown[]): void {
    this._write("error", message, optionalParams);
  }

  public warn(message: unknown, ...optionalParams: unknown[]): void {
    this._write("warn", message, optionalParams);
  }

  public debug(message: unknown, ...optionalParams: unknown[]): void {
    this._write("debug", message, optionalParams);
  }

  public verbose(message: unknown, ...optionalParams: unknown[]): void {
    this._write("verbose", message, optionalParams);
  }

  public fatal(message: unknown, ...optionalParams: unknown[]): void {
    this._write("fatal", message, optionalParams);
  }

  private _write(level: LogLevel, message: unknown, optionalParams: unknown[]): void {
    if (!this._isProduction) {
      this._consoleLogger[level](message, ...optionalParams);

      return;
    }

    const params: unknown[] = [...optionalParams];
    const context: string | undefined = AppLogger._popString(params);
    const stack: string | undefined = level === "error" || level === "fatal" ? AppLogger._popString(params) : undefined;
    const requestContext: RequestContext | undefined = this._requestContextService.get();

    const entry: StructuredLogEntry = {
      level,
      timestamp: new Date().toISOString(),
      context,
      message: message instanceof Error ? message.message : message,
      traceId: requestContext?.traceId,
      stack: stack ?? (message instanceof Error ? message.stack : undefined),
      details: params.length > 0 ? params : undefined,
    };

    const line: string = `${AppLogger._safeStringify(entry)}\n`;

    if (level === "error" || level === "fatal" || level === "warn") {
      process.stderr.write(line);

      return;
    }

    process.stdout.write(line);
  }

  private static _popString(params: unknown[]): string | undefined {
    const last: unknown = params[params.length - 1];

    if (typeof last !== "string") {
      return undefined;
    }

    params.pop();

    return last;
  }

  private static _safeStringify(entry: StructuredLogEntry): string {
    const seen: WeakSet<object> = new WeakSet<object>();

    return JSON.stringify(entry, (_key: string, value: unknown): unknown => {
      if (value instanceof Error) {
        return { name: value.name, message: value.message, stack: value.stack };
      }

      if (typeof value === "bigint") {
        return value.toString();
      }

      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }

        seen.add(value);
      }

      return value;
    });
  }
}
