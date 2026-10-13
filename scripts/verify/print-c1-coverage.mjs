/*
 * Funcionalidad: Resumen de cobertura C1 por área
 * Descripción: Lee coverage/unit/coverage-summary.json (reporte json-summary de npm run test:unit) y muestra, por área y por carpeta del alcance C1, las líneas cubiertas y el porcentaje; no falla por sí mismo, los umbrales los aplica Jest
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, sep } from "node:path";

import { REPO_ROOT } from "./lib/process.mjs";

const require = createRequire(import.meta.url);
const { C1_AREAS } = require(join(REPO_ROOT, "test", "jest", "c1-coverage-areas.js"));
const SUMMARY_PATH = join(REPO_ROOT, "coverage", "unit", "coverage-summary.json");

function percent(covered, total) {
  return total === 0 ? "100.0" : ((covered / total) * 100).toFixed(1);
}

if (!existsSync(SUMMARY_PATH)) {
  console.log(`[c1] ${SUMMARY_PATH} not found; run npm run test:unit first`);
  process.exit(0);
}

const summary = JSON.parse(readFileSync(SUMMARY_PATH, "utf-8"));
const files = Object.entries(summary).filter(([path]) => path !== "total");

function linesUnder(folder) {
  const prefix = join(REPO_ROOT, "src", ...folder.split("/")) + sep;

  return files
    .filter(([path]) => path.startsWith(prefix))
    .reduce((acc, [, metrics]) => ({ covered: acc.covered + metrics.lines.covered, total: acc.total + metrics.lines.total }), { covered: 0, total: 0 });
}

console.log("[c1] line coverage by area (threshold 80 % per folder)");

for (const [area, folders] of Object.entries(C1_AREAS)) {
  const parts = folders.map((folder) => ({ folder, ...linesUnder(folder) }));
  const covered = parts.reduce((sum, part) => sum + part.covered, 0);
  const total = parts.reduce((sum, part) => sum + part.total, 0);

  console.log(`  ${area}: ${percent(covered, total)} % (${covered}/${total})`);

  for (const part of parts) {
    console.log(`    ${part.folder}: ${percent(part.covered, part.total)} % (${part.covered}/${part.total})`);
  }
}
