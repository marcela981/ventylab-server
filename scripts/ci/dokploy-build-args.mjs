/*
 * Funcionalidad: Sello de GIT_SHA y BUILD_DATE en los argumentos de construcción de Dokploy
 * Descripción: Lee la respuesta de GET /api/application.one de Dokploy (archivo JSON) y escribe el cuerpo de POST /api/application.saveEnvironment con los argumentos de construcción GIT_SHA y BUILD_DATE reemplazados o agregados, conservando sin cambios las variables de entorno, los secretos de construcción, la opción de archivo .env y los demás argumentos; nunca imprime los valores leídos; falla con un mensaje sin secretos si la respuesta no trae los campos esperados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Build arguments this script owns; every other line of the Dokploy field is kept verbatim. */
export const STAMPED_KEYS = ["GIT_SHA", "BUILD_DATE"];

/** Fields that application.saveEnvironment requires (all of them, Dokploy `.required()`). */
const PRESERVED_FIELDS = ["env", "buildSecrets", "createEnvFile"];

const SHA_PATTERN = /^[0-9a-f]{7,40}$/i;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * Returns the Dokploy build arguments text with GIT_SHA and BUILD_DATE set to the given values.
 * Lines for other keys, comments and blank lines are kept in order; previous GIT_SHA/BUILD_DATE lines are dropped.
 */
export function stampBuildArgs(existing, { sha, builtAt }) {
  if (!SHA_PATTERN.test(sha ?? "")) throw new Error("GIT_SHA must be a hexadecimal commit id");
  if (!ISO_UTC_PATTERN.test(builtAt ?? "")) throw new Error("BUILD_DATE must be an ISO 8601 UTC date");
  const kept = (existing ?? "")
    .split(/\r?\n/)
    .filter((line) => !STAMPED_KEYS.some((key) => new RegExp(`^\\s*${key}\\s*=`).test(line)));
  while (kept.length > 0 && kept[kept.length - 1].trim() === "") kept.pop();
  return [...kept, `GIT_SHA=${sha}`, `BUILD_DATE=${builtAt}`].join("\n");
}

/** Builds the application.saveEnvironment body from the application.one response. */
export function buildSaveEnvironmentPayload(application, applicationId, stamp) {
  if (application === null || typeof application !== "object") throw new Error("Dokploy application.one did not return an object");
  const missing = [...PRESERVED_FIELDS, "buildArgs"].filter((field) => !Object.hasOwn(application, field));
  // Saving without a field would erase it in Dokploy (every field is written), so an unknown response shape aborts.
  if (missing.length > 0) throw new Error(`Dokploy application.one is missing ${missing.join(", ")}; build arguments were not changed`);
  return {
    applicationId,
    env: application.env,
    buildArgs: stampBuildArgs(application.buildArgs, stamp),
    buildSecrets: application.buildSecrets,
    createEnvFile: application.createEnvFile,
  };
}

function main([inputPath, outputPath]) {
  const { DOKPLOY_APPLICATION_ID: applicationId, GIT_SHA: sha, BUILD_DATE: builtAt } = process.env;
  if (!inputPath || !outputPath || !applicationId) {
    throw new Error("usage: DOKPLOY_APPLICATION_ID=.. GIT_SHA=.. BUILD_DATE=.. node dokploy-build-args.mjs <application.json> <payload.json>");
  }
  const application = JSON.parse(readFileSync(inputPath, "utf8"));
  const payload = buildSaveEnvironmentPayload(application, applicationId, { sha, builtAt });
  writeFileSync(outputPath, JSON.stringify(payload), { mode: 0o600 });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    // Only the message: it never contains values read from Dokploy.
    console.error(error instanceof Error ? error.message : "dokploy-build-args failed");
    process.exit(1);
  }
}
