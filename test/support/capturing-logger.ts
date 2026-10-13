/*
 * Funcionalidad: Logger de captura para pruebas e2e
 * Descripción: LoggerService que guarda cada entrada (nivel, mensaje y parámetros) que la aplicación escribe a través de Logger de Nest y la renderiza completa con util.inspect (sin límite de profundidad), un superconjunto de lo que imprimen el formato de consola de desarrollo y las líneas JSON de producción; permite buscar secretos o datos personales en todo lo registrado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { inspect } from "node:util";

import { type LoggerService, type LogLevel } from "@nestjs/common";

export interface CapturedLogEntry {
  readonly level: LogLevel;
  readonly message: unknown;
  readonly params: readonly unknown[];
}

export class CapturingLogger implements LoggerService {
  public readonly entries: CapturedLogEntry[] = [];

  public log(message: unknown, ...params: unknown[]): void {
    this._capture("log", message, params);
  }

  public error(message: unknown, ...params: unknown[]): void {
    this._capture("error", message, params);
  }

  public warn(message: unknown, ...params: unknown[]): void {
    this._capture("warn", message, params);
  }

  public debug(message: unknown, ...params: unknown[]): void {
    this._capture("debug", message, params);
  }

  public verbose(message: unknown, ...params: unknown[]): void {
    this._capture("verbose", message, params);
  }

  public fatal(message: unknown, ...params: unknown[]): void {
    this._capture("fatal", message, params);
  }

  public clear(): void {
    this.entries.splice(0);
  }

  public render(): string {
    return this.entries
      .map((entry: CapturedLogEntry): string => `${entry.level} ${inspect([entry.message, ...entry.params], { depth: null, maxArrayLength: null, maxStringLength: null, breakLength: Infinity })}`)
      .join("\n");
  }

  public findAll(needles: readonly string[]): string[] {
    const rendered: string = this.render();

    return needles.filter((needle: string): boolean => needle.length > 0 && rendered.includes(needle));
  }

  private _capture(level: LogLevel, message: unknown, params: unknown[]): void {
    this.entries.push({ level, message, params });
  }
}
