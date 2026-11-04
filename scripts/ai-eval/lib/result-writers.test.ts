/*
 * Funcionalidad: Pruebas del escritor de resultados y del puntaje auxiliar de la evaluación de IA
 * Descripción: Verifica con node:test (sin dependencias) el escape CSV, el BOM y las columnas de summary.csv, una línea JSON válida por registro en raw.jsonl, la marca de tiempo apta para Windows, la ocultación de secretos, la escritura de los tres archivos y el puntaje auxiliar insensible a tildes. Ejecutar: node --test scripts/ai-eval/lib/
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { AUTO_SCORE_LABEL, autoScore } from "./auto-score.ts";
import { createFakeProvider } from "./fake-provider.ts";
import { csvEscape, redactSecrets, runStamp, SUMMARY_COLUMNS, toJsonl, toSummaryCsv, writeResults } from "./result-writers.ts";
import type { EvalChunk, EvalResultRecord } from "./types.ts";

function record(overrides: Partial<EvalResultRecord> = {}): EvalResultRecord {
  return {
    runId: "2026-11-04T10-00-00Z",
    timestamp: "2026-11-04T10:00:01.000Z",
    dryRun: true,
    scenarioId: "sim-01",
    category: "simulador",
    useCase: "SIM_ASSIST",
    language: "es",
    provider: "fake",
    model: "fake-dry-run",
    promptVersion: "1.1.0",
    promptHash: "abc",
    repetition: 1,
    settings: { temperature: 0.4, maxOutputTokens: 768, timeoutMs: 20000 },
    status: "ok",
    totalMs: 12,
    ttftMs: 3,
    inputTokens: 100,
    outputTokens: 20,
    outputText: 'Línea 1, con "comillas"\nLínea 2',
    outputChars: 31,
    autoScore: autoScore("", [], []),
    prompt: { system: "s", messages: [{ role: "user", content: "u" }], responseFormat: "text" },
    ...overrides,
  };
}

test("csvEscape quotes commas, quotes and newlines and leaves plain values untouched", () => {
  assert.equal(csvEscape("simple"), "simple");
  assert.equal(csvEscape('a,"b"'), '"a,""b"""');
  assert.equal(csvEscape("a\nb"), '"a\nb"');
  assert.equal(csvEscape(undefined), "");
  assert.equal(csvEscape(0.25), "0.25");
  assert.equal(csvEscape(false), "false");
});

test("summary CSV starts with a BOM, has the header and one CRLF row per record", () => {
  const csv: string = toSummaryCsv([record(), record({ scenarioId: "sim-02", status: "error", errorName: "AiProviderError" })]);
  const lines: string[] = csv.slice(1).split("\r\n").filter((line: string) => line.length > 0);

  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(lines[0], SUMMARY_COLUMNS.join(","));
  assert.equal(lines.length, 3);
  assert.equal(lines[1].split(",").length, SUMMARY_COLUMNS.length);
  assert.ok(lines[2].includes("AiProviderError"));
});

test("raw JSONL keeps the full output, one parseable object per line", () => {
  const jsonl: string = toJsonl([record(), record({ repetition: 2 })]);
  const parsed: EvalResultRecord[] = jsonl.trimEnd().split("\n").map((line: string) => JSON.parse(line) as EvalResultRecord);

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].outputText, 'Línea 1, con "comillas"\nLínea 2');
  assert.equal(parsed[1].repetition, 2);
  assert.equal(toJsonl([]), "");
});

test("runStamp is ISO ordered and has no characters forbidden on Windows", () => {
  assert.equal(runStamp(new Date("2026-11-04T09:08:07.654Z")), "2026-11-04T09-08-07Z");
});

test("redactSecrets hides configured key values and ignores short or missing ones", () => {
  assert.equal(redactSecrets("401 for key sk-test-123456", ["sk-test-123456", undefined, "abc"]), "401 for key [redacted]");
});

test("writeResults writes raw.jsonl, summary.csv and run-meta.json", () => {
  const dir: string = mkdtempSync(join(tmpdir(), "ai-eval-"));

  try {
    const written = writeResults(join(dir, "run"), [record()], { runId: "x" });

    assert.equal(readFileSync(written.rawPath, "utf8").trimEnd().split("\n").length, 1);
    assert.ok(readFileSync(written.summaryPath, "utf8").includes("sim-01"));
    assert.deepEqual(JSON.parse(readFileSync(join(written.dir, "run-meta.json"), "utf8")), { runId: "x" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("autoScore is accent-insensitive, counts coverage and flags safety patterns", () => {
  const score = autoScore(
    "La PRESIÓN de distensión es alta; programa la PEEP a 14 cmH2O.",
    [
      { id: "C1", description: "", keywords: ["presion de distension"], sourceRefs: [] },
      { id: "C2", description: "", keywords: ["volutrauma"], sourceRefs: [] },
    ],
    [{ id: "S1", description: "", patterns: ["programa[^.]{0,40}\\ba\\s+\\d+\\s*cmh2o"] }],
  );

  assert.equal(score.label, AUTO_SCORE_LABEL);
  assert.equal(score.criteriaCovered, 1);
  assert.equal(score.coverage, 0.5);
  assert.deepEqual(score.safetyFlags.map((flag: { id: string }) => flag.id), ["S1"]);
});

test("fake provider streams deltas then a final chunk with the JSON ids found in the prompt", async () => {
  const chunks: EvalChunk[] = [];

  for await (const chunk of createFakeProvider().stream(
    { model: "m", system: "s", messages: [{ role: "user", content: "ID: q1\nID: q2" }], maxOutputTokens: 10, temperature: 0, responseFormat: "json" },
    new AbortController().signal,
  )) {
    chunks.push(chunk);
  }

  const final: EvalChunk | undefined = chunks.at(-1);

  assert.ok(chunks.length > 1);
  assert.equal(final?.type, "final");
  assert.deepEqual(
    JSON.parse(final?.type === "final" ? final.completion.text : "{}").perQuestion.map((item: { questionId: string }) => item.questionId),
    ["q1", "q2"],
  );
});
