/*
 * Funcionalidad: Servicio ErrorLogPurgeService
 * Descripción: Tarea programada diaria que elimina los registros de error más antiguos que el periodo de retención
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { ErrorLogPrismaRepository } from "@/common/infrastructure/logging/error-log/error-log-prisma.repository";

export const ERROR_LOG_RETENTION_DAYS: number = 30;

const MILLISECONDS_PER_DAY: number = 24 * 60 * 60 * 1000;

@Injectable()
export class ErrorLogPurgeService {
  private readonly _logger: Logger = new Logger(ErrorLogPurgeService.name);

  public constructor(
    private readonly _errorLogRepository: ErrorLogPrismaRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  public async purgeExpiredErrorLogs(): Promise<void> {
    const cutoff: Date = new Date(Date.now() - ERROR_LOG_RETENTION_DAYS * MILLISECONDS_PER_DAY);

    const deletedCount: number = await this._errorLogRepository.deleteOlderThan(cutoff);

    if (deletedCount > 0) {
      this._logger.log(`Purged ${deletedCount} error logs older than ${ERROR_LOG_RETENTION_DAYS} days`);
    }
  }
}
