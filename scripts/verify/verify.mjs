/*
 * Funcionalidad: Orquestador de verificación (npm run verify)
 * Descripción: Ejecuta en orden el chequeo de tipos, ESLint en modo solo lectura, la detección de dependencias circulares con madge, prisma validate (las advertencias también fallan), el chequeo de deriva de migraciones con disparadores sobre PostgreSQL desechable y las suites de pruebas; se detiene en el primer fallo, imprime un resumen y termina con código distinto de cero
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { checkMigrationDrift } from "./drift-check.mjs";
import { minimalEnv, REPO_ROOT, run, runNode, tail } from "./lib/process.mjs";

const VERBOSE = process.argv.includes("--verbose") || process.env.VERIFY_VERBOSE === "1";

// Prisma commands that only read the schema still resolve env("DATABASE_URL"); a closed local port guarantees nothing remote is reached.
const OFFLINE_DATABASE_ENV = minimalEnv({
  DATABASE_URL: "postgresql://offline:offline@127.0.0.1:9/offline",
  DIRECT_URL: "postgresql://offline:offline@127.0.0.1:9/offline",
});

// Test suites run in this order; a later block adds its npm script here and it runs once it exists in package.json.
const TEST_SCRIPTS = ["test:unit", "test:integration", "test:e2e"];

function commandStep(name, binary, args, { env, accept } = {}) {
  return {
    name,
    execute: async () => {
      const result = await runNode(binary, args, { env, stream: VERBOSE });
      const rejection = result.code === 0 && accept ? accept(result.output) : undefined;

      return { ok: result.code === 0 && rejection === undefined, detail: rejection ?? tail(result.output, result.code === 0 ? 6 : 60) };
    },
  };
}

function lintTargets() {
  return ["src", "test"].filter((folder) => existsSync(join(REPO_ROOT, folder))).map((folder) => `${folder}/**/*.ts`);
}

function testSteps() {
  const scripts = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf-8")).scripts ?? {};
  const available = TEST_SCRIPTS.filter((script) => scripts[script] !== undefined);

  if (available.length === 0) {
    return [commandStep("tests (jest unit suite)", "jest", ["--ci"])];
  }

  const npmCli = process.env.npm_execpath;

  return available.map((script) => ({
    name: `tests (${script})`,
    execute: async () => {
      const result = npmCli
        ? await run(process.execPath, [npmCli, "run", script], { stream: VERBOSE })
        : await run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", script], { stream: VERBOSE });

      return { ok: result.code === 0, detail: tail(result.output, result.code === 0 ? 3 : 60) };
    },
  }));
}

function buildSteps() {
  return [
    commandStep("typecheck (tsc --noEmit)", "tsc", ["--noEmit", "-p", "tsconfig.json"]),
    commandStep(`lint (eslint ${lintTargets().join(" ")})`, "eslint", lintTargets()),
    commandStep("circular imports (madge)", "madge", ["--circular", "--extensions", "ts", "src"]),
    commandStep("prisma validate", "prisma", ["validate"], {
      env: OFFLINE_DATABASE_ENV,
      accept: (output) => (/schema warnings/i.test(output) ? `prisma validate reported warnings:\n${tail(output, 20)}` : undefined),
    }),
    {
      name: "migration drift + triggers (docker postgres:17-alpine)",
      execute: () => checkMigrationDrift({ log: VERBOSE ? console.log : () => undefined }),
    },
    ...testSteps(),
  ];
}

function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

async function main() {
  const steps = buildSteps();
  const results = [];

  for (const step of steps) {
    const startedAt = Date.now();

    console.log(`\n[verify] ▶ ${step.name}`);

    let outcome;

    try {
      outcome = await step.execute();
    } catch (error) {
      outcome = { ok: false, detail: error instanceof Error ? error.message : String(error) };
    }

    const elapsed = Date.now() - startedAt;

    results.push({ name: step.name, ok: outcome.ok, elapsed });
    console.log(outcome.ok ? `[verify] ✔ ${step.name} (${formatSeconds(elapsed)})` : `[verify] ✖ ${step.name} (${formatSeconds(elapsed)})`);

    if (outcome.detail) {
      console.log(outcome.detail.split(/\r?\n/).map((line) => `    ${line}`).join("\n"));
    }

    if (!outcome.ok) {
      break;
    }
  }

  const skipped = steps.slice(results.length).map((step) => step.name);

  console.log("\n[verify] summary");

  for (const result of results) {
    console.log(`  ${result.ok ? "PASS" : "FAIL"}  ${result.name}  ${formatSeconds(result.elapsed)}`);
  }

  for (const name of skipped) {
    console.log(`  SKIP  ${name}`);
  }

  const failed = results.some((result) => !result.ok);

  console.log(failed ? "\n[verify] FAILED" : "\n[verify] OK");
  process.exitCode = failed ? 1 : 0;
}

void main();
