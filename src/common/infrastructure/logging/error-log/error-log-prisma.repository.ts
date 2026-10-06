/*
 * Funcionalidad: Repositorio ErrorLogPrismaRepository
 * Descripción: Persiste y purga registros de error en la tabla error_logs con Prisma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { ErrorLog } from "@/common/infrastructure/logging/error-log/error-log";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";

@Injectable()
export class ErrorLogPrismaRepository {
  private readonly _logger: Logger = new Logger(ErrorLogPrismaRepository.name);

  public constructor(private readonly _prisma: PrismaService) {}

  public async save(errorLog: ErrorLog): Promise<void> {
    try {
      await this._prisma.errorLog.create({
        data: {
          id: errorLog.id,
          traceId: errorLog.traceId,
          exception: errorLog.exception,
          occurredAt: errorLog.occurredAt,
          content: errorLog.content as Prisma.InputJsonObject,
        },
      });
    } catch (error: unknown) {
      this._logger.error("Failed to save error log to database", {
        error,
        errorLogId: errorLog.id,
      });
    }
  }

  public async deleteOlderThan(cutoff: Date): Promise<number> {
    const result: Prisma.BatchPayload = await this._prisma.errorLog.deleteMany({
      where: { occurredAt: { lt: cutoff } },
    });

    return result.count;
  }
}
