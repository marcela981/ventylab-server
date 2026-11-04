/*
 * Funcionalidad: Escritura de resultados de la evaluación de IA
 * Descripción: Serializa los registros de cada llamada a raw.jsonl (un objeto JSON por línea, con la salida cruda completa) y a summary.csv (una fila por llamada, campos escapados según RFC 4180 y con BOM UTF-8 para que Excel muestre bien las tildes); calcula la carpeta de corrida con una marca de tiempo ISO apta para Windows y oculta valores secretos en los mensajes de error
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { EvalResultRecord } from "./types.ts";

export const SUMMARY_COLUMNS: readonly string[] = [
  "runId",
  "timestamp",
  "dryRun",
  "scenarioId",
  "category",
  "useCase",
  "provider",
  "model",
  "promptVersion",
  "promptHash",
  "repetition",
  "temperature",
  "maxOutputTokens",
  "status",
  "errorName",
  "ttftMs",
  "totalMs",
  "inputTokens",
  "outputTokens",
  "costUsd",
  "outputChars",
  "parseOk",
  "autoCriteriaCovered",
  "autoCriteriaTotal",
  "autoCoverage",
  "autoSafetyFlags",
];

const UTF8_BOM: string = "\uFEFF";
const REDACTED: string = "[redacted]";
const MIN_SECRET_LENGTH: number = 6;

export function csvEscape(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  const text: string = typeof value === "string" ? value : String(value);

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toSummaryRow(record: EvalResultRecord): unknown[] {
  return [
    record.runId,
    record.timestamp,
    record.dryRun,
    record.scenarioId,
    record.category,
    record.useCase,
    record.provider,
    record.model,
    record.promptVersion,
    record.promptHash,
    record.repetition,
    record.settings.temperature,
    record.settings.maxOutputTokens,
    record.status,
    record.errorName,
    record.ttftMs,
    record.totalMs,
    record.inputTokens,
    record.outputTokens,
    record.costUsd,
    record.outputChars,
    record.parseOk,
    record.autoScore.criteriaCovered,
    record.autoScore.criteriaTotal,
    record.autoScore.coverage,
    record.autoScore.safetyFlags.map((flag: { id: string }) => flag.id).join(" "),
  ];
}

export function toSummaryCsv(records: readonly EvalResultRecord[]): string {
  const lines: string[] = [SUMMARY_COLUMNS.map(csvEscape).join(",")];

  for (const record of records) {
    lines.push(toSummaryRow(record).map(csvEscape).join(","));
  }

  return `${UTF8_BOM}${lines.join("\r\n")}\r\n`;
}

export function toJsonl(records: readonly EvalResultRecord[]): string {
  return records.map((record: EvalResultRecord) => JSON.stringify(record)).join("\n") + (records.length > 0 ? "\n" : "");
}

// Colons are not allowed in Windows paths, so the ISO timestamp keeps its order but swaps ":" for "-" and drops milliseconds.
export function runStamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:/g, "-");
}

export function redactSecrets(text: string, secrets: readonly (string | undefined)[]): string {
  let result: string = text;

  for (const secret of secrets) {
    if (secret !== undefined && secret.length >= MIN_SECRET_LENGTH) {
      result = result.split(secret).join(REDACTED);
    }
  }

  return result;
}

interface WrittenResults {
  readonly dir: string;
  readonly rawPath: string;
  readonly summaryPath: string;
}

export function writeResults(dir: string, records: readonly EvalResultRecord[], meta: Record<string, unknown>): WrittenResults {
  mkdirSync(dir, { recursive: true });

  const rawPath: string = join(dir, "raw.jsonl");
  const summaryPath: string = join(dir, "summary.csv");

  writeFileSync(rawPath, toJsonl(records), "utf8");
  writeFileSync(summaryPath, toSummaryCsv(records), "utf8");
  writeFileSync(join(dir, "run-meta.json"), `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  return { dir, rawPath, summaryPath };
}
