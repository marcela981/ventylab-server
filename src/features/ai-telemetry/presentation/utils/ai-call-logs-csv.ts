/*
 * Funcionalidad: CSV de llamadas de IA
 * Descripción: Serializa las filas de la bitácora de llamadas de IA (sin texto de prompt ni de respuesta) a CSV con la utilidad compartida toCsv (RFC 4180, terminadores CRLF, escape de comillas, comas y saltos de línea y neutralización de fórmulas de hoja de cálculo); v1.2: columnas language, finishReason, temperature, maxOutputTokens, attemptTrail (JSON) y providerRequestId
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { toCsv } from "@/common/presentation/utils/csv.util";
import { type AiCallLogRow } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

type AiCallLogCsvRow = Omit<AiCallLogRow, "attemptTrail"> & { readonly attemptTrail?: string };

export const AI_CALL_LOGS_CSV_COLUMNS: readonly (keyof AiCallLogCsvRow)[] = [
  "id",
  "createdAt",
  "useCase",
  "provider",
  "model",
  "promptVersion",
  "status",
  "errorCode",
  "attempts",
  "inputTokens",
  "outputTokens",
  "latencyMs",
  "ttftMs",
  "costEstimateUsd",
  "refType",
  "refId",
  "language",
  "finishReason",
  "temperature",
  "maxOutputTokens",
  "attemptTrail",
  "providerRequestId",
] as const;

export function toAiCallLogsCsv(rows: readonly AiCallLogRow[]): string {
  const csvRows: AiCallLogCsvRow[] = rows.map((row: AiCallLogRow) => ({ ...row, attemptTrail: row.attemptTrail ? JSON.stringify(row.attemptTrail) : undefined }));

  return toCsv(csvRows, AI_CALL_LOGS_CSV_COLUMNS);
}
