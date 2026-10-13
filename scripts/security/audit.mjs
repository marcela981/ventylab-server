/*
 * Funcionalidad: Auditoría de dependencias de producción
 * Descripción: Ejecuta npm audit --omit=dev --json, reúne cada aviso de severidad crítica o alta con su identificador GHSA, paquete, rango y dependencias afectadas, y falla (código 1) si alguno no figura en security/audit-exceptions.json o si su excepción venció (fecha de revisión pasada); avisa de excepciones que ya no aplican; código 2 si npm audit no entrega un reporte; --exceptions <ruta> permite usar otro archivo de excepciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_EXCEPTIONS_PATH = resolve(REPO_ROOT, "security", "audit-exceptions.json");
const BLOCKING_SEVERITIES = new Set(["critical", "high"]);
const GHSA_PATTERN = /GHSA(?:-[0-9a-z]{4}){3}/i;

export function advisoryId(via) {
  const match = typeof via.url === "string" ? GHSA_PATTERN.exec(via.url) : null;

  return match ? match[0] : `npm-${via.source}`;
}

export function blockingAdvisories(report) {
  const advisories = new Map();

  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via ?? []) {
      if (typeof via !== "object" || !BLOCKING_SEVERITIES.has(via.severity)) {
        continue;
      }

      const id = advisoryId(via);
      const existing = advisories.get(id) ?? { id, severity: via.severity, package: via.name, range: via.range, title: via.title, url: via.url, nodes: new Set() };

      for (const node of vulnerability.nodes ?? []) {
        existing.nodes.add(node);
      }

      advisories.set(id, existing);
    }
  }

  return [...advisories.values()];
}

export function evaluateAdvisories(advisories, exceptions, today) {
  const byId = new Map(exceptions.map((exception) => [exception.id, exception]));
  const unexcepted = advisories.filter((advisory) => !byId.has(advisory.id));
  const expired = advisories.filter((advisory) => byId.has(advisory.id) && byId.get(advisory.id).reviewBy < today);
  const stale = exceptions.filter((exception) => !advisories.some((advisory) => advisory.id === exception.id));

  return { unexcepted, expired, stale };
}

function readExceptions(path) {
  const parsed = JSON.parse(readFileSync(path, "utf8"));

  for (const exception of parsed.exceptions) {
    if (!exception.id || !exception.reason || !/^\d{4}-\d{2}-\d{2}$/.test(exception.reviewBy ?? "")) {
      throw new Error(`Invalid exception in ${path}: every entry needs id, reason and reviewBy (YYYY-MM-DD)`);
    }
  }

  return parsed.exceptions;
}

function runNpmAudit() {
  const run = spawnSync("npm", ["audit", "--omit=dev", "--json"], { cwd: REPO_ROOT, encoding: "utf8", shell: process.platform === "win32", maxBuffer: 64 * 1024 * 1024 });

  try {
    return JSON.parse(run.stdout);
  } catch {
    throw new Error(`npm audit did not return a JSON report (exit ${run.status}):\n${run.stderr}`);
  }
}

function exceptionsPathFromArgs(argv) {
  const index = argv.indexOf("--exceptions");

  return index === -1 ? DEFAULT_EXCEPTIONS_PATH : resolve(argv[index + 1]);
}

function main() {
  let report;
  let exceptions;

  try {
    exceptions = readExceptions(exceptionsPathFromArgs(process.argv));
    report = runNpmAudit();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));

    return 2;
  }

  const counts = report.metadata?.vulnerabilities ?? {};
  const advisories = blockingAdvisories(report);
  const { unexcepted, expired, stale } = evaluateAdvisories(advisories, exceptions, new Date().toISOString().slice(0, 10));

  console.log(`npm audit --omit=dev: critical ${counts.critical ?? 0}, high ${counts.high ?? 0}, moderate ${counts.moderate ?? 0}, low ${counts.low ?? 0} (packages); ${advisories.length} critical/high advisories`);

  for (const advisory of advisories) {
    const status = unexcepted.includes(advisory) ? "NOT EXCEPTED" : expired.includes(advisory) ? "EXCEPTION EXPIRED" : "excepted";

    console.log(`- [${status}] ${advisory.id} ${advisory.severity} ${advisory.package} ${advisory.range} (${[...advisory.nodes].join(", ")}): ${advisory.title}`);
  }

  for (const exception of stale) {
    console.log(`- [stale exception] ${exception.id} no longer reported; remove it from security/audit-exceptions.json`);
  }

  if (unexcepted.length > 0 || expired.length > 0) {
    console.error(`security:audit FAILED: ${unexcepted.length} critical/high advisories without exception, ${expired.length} with an expired exception`);

    return 1;
  }

  console.log("security:audit OK: every critical/high advisory has a current, justified exception");

  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
