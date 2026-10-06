/*
 * Funcionalidad: Caso de uso ExportAiCallLogsUseCase
 * Descripción: Filas de la bitácora de llamadas de IA de un rango (máximo 366 días) para exportar, sin texto de prompt ni de respuesta, limitadas a un número máximo de filas e indicando si el resultado quedó truncado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type AiCallLogRow, type AiTelemetryFilters } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { AI_CALL_LOGS_REPOSITORY_TOKEN, type IAiCallLogsRepository } from "@/features/ai-telemetry/domain/repositories/ai-call-logs.repository";
import { assertValidTelemetryRange } from "@/features/ai-telemetry/domain/services/ai-telemetry-metrics";

export const AI_CALL_LOGS_EXPORT_ROW_LIMIT: number = 50_000;

export interface AiCallLogsExport {
  readonly rows: AiCallLogRow[];
  readonly truncated: boolean;
}

/**
 * @throws {InvalidAiTelemetryRangeError} If the range does not start before it ends or spans more than 366 days
 */
@Injectable()
export class ExportAiCallLogsUseCase {
  public constructor(
    @Inject(AI_CALL_LOGS_REPOSITORY_TOKEN)
    private readonly _aiCallLogsRepository: IAiCallLogsRepository,
  ) {}

  public async execute(filters: AiTelemetryFilters, rowLimit: number = AI_CALL_LOGS_EXPORT_ROW_LIMIT): Promise<AiCallLogsExport> {
    assertValidTelemetryRange(filters.from, filters.to);

    const rows: AiCallLogRow[] = await this._aiCallLogsRepository.getRows(filters, rowLimit + 1);

    return { rows: rows.slice(0, rowLimit), truncated: rows.length > rowLimit };
  }
}
