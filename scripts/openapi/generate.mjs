/*
 * Funcionalidad: Generación y chequeo del contrato OpenAPI (npm run openapi:generate / openapi:check)
 * Descripción: Genera el documento OpenAPI 3.1 desde los decoradores en un proceso hijo con entorno mínimo (sin credenciales del shell ni .env) y lo escribe en openapi/openapi.json; con --check lo regenera en un archivo temporal y compara byte a byte con el versionado, terminando con código 1 y la indicación de regenerarlo si difieren
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { isMainModule, minimalEnv, REPO_ROOT, run, tail } from "../verify/lib/process.mjs";

export const OPENAPI_DOCUMENT_PATH = join(REPO_ROOT, "openapi", "openapi.json");

const EMITTER = join(REPO_ROOT, "scripts", "openapi", "emit-document.cjs");

export async function emitOpenAPIDocument(outputPath) {
  const result = await run(process.execPath, [EMITTER, outputPath], { env: minimalEnv(), stream: false });

  if (result.code !== 0) {
    throw new Error(`OpenAPI generation failed:\n${tail(result.output, 40)}`);
  }
}

export async function checkOpenAPIDocument() {
  const workDir = mkdtempSync(join(tmpdir(), "ventylab-openapi-check-"));

  try {
    const generatedPath = join(workDir, "openapi.json");

    await emitOpenAPIDocument(generatedPath);

    const committed = existsSync(OPENAPI_DOCUMENT_PATH) ? readFileSync(OPENAPI_DOCUMENT_PATH) : undefined;
    const generated = readFileSync(generatedPath);

    return { upToDate: committed !== undefined && committed.equals(generated), missing: committed === undefined };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

async function main() {
  if (process.argv.includes("--check")) {
    const { upToDate, missing } = await checkOpenAPIDocument();

    if (!upToDate) {
      console.error(missing
        ? "openapi/openapi.json does not exist: run npm run openapi:generate and commit the result"
        : "openapi/openapi.json is out of date with the controllers and DTOs: run npm run openapi:generate and commit the result");
      process.exitCode = 1;

      return;
    }

    console.log("openapi/openapi.json is up to date");

    return;
  }

  const workDir = mkdtempSync(join(tmpdir(), "ventylab-openapi-"));

  try {
    const generatedPath = join(workDir, "openapi.json");

    await emitOpenAPIDocument(generatedPath);
    copyFileSync(generatedPath, OPENAPI_DOCUMENT_PATH);
    console.log(`Wrote ${OPENAPI_DOCUMENT_PATH}`);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

if (isMainModule(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
