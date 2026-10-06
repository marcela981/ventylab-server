/*
 * Funcionalidad: Servicio ErrorLogService
 * Descripción: Crea y persiste registros de error con tipo de excepción, traceId y contexto saneado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { ErrorLog } from "@/common/infrastructure/logging/error-log/error-log";
import { ErrorLogPrismaRepository } from "@/common/infrastructure/logging/error-log/error-log-prisma.repository";

@Injectable()
export class ErrorLogService {
  public constructor(
    private readonly _errorLogRepository: ErrorLogPrismaRepository,
  ) {}

  public async save(
    exception: unknown,
    traceId: string,
    content: Record<string, unknown>,
  ): Promise<void> {
    const errorLog: ErrorLog = ErrorLog.create({
      traceId,
      exception: this._getExceptionType(exception),
      content,
    });

    await this._errorLogRepository.save(errorLog);
  }

  private _getExceptionType(exception: unknown): string {
    if (exception && typeof exception === "object" && "constructor" in exception) {
      return exception.constructor.name;
    }

    return "Unknown";
  }
}
