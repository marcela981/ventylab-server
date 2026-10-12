/*
 * Funcionalidad: Chequeo de deriva de migraciones
 * Descripción: Sobre un PostgreSQL desechable en Docker compara prisma/migrations con prisma/schema.prisma (migrate diff con base sombra y --exit-code), aplica las migraciones con migrate deploy sobre una base vacía y comprueba que existan los disparadores de superadmin y de auditoría de solo inserción; elimina el contenedor siempre
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { startPostgres } from "./lib/postgres-container.mjs";
import { isMainModule, minimalEnv, runNode, tail } from "./lib/process.mjs";

export const REQUIRED_TRIGGERS = [
  "users_protect_superadmin_update",
  "users_protect_superadmin_delete",
  "audit_logs_append_only",
  "audit_logs_append_only_truncate",
];

export async function checkMigrationDrift({ log = console.log } = {}) {
  const container = await startPostgres("drift");

  try {
    await container.createDatabase("shadow");

    const env = minimalEnv({ DATABASE_URL: container.url(), DIRECT_URL: container.url() });

    log(`[drift] container ${container.name} on 127.0.0.1:${container.port}`);

    const diff = await runNode("prisma", [
      "migrate", "diff",
      "--from-migrations", "prisma/migrations",
      "--to-schema-datamodel", "prisma/schema.prisma",
      "--shadow-database-url", container.url("shadow"),
      "--exit-code",
    ], { env });

    if (diff.code === 2) {
      return { ok: false, detail: `schema.prisma and prisma/migrations differ; create a migration for:\n${tail(diff.output, 60)}` };
    }

    if (diff.code !== 0) {
      return { ok: false, detail: `prisma migrate diff failed:\n${tail(diff.output)}` };
    }

    log("[drift] migrations match schema.prisma");

    const deploy = await runNode("prisma", ["migrate", "deploy"], { env });

    if (deploy.code !== 0) {
      return { ok: false, detail: `prisma migrate deploy on an empty database failed:\n${tail(deploy.output)}` };
    }

    log("[drift] migrate deploy applied every migration to an empty database");

    const triggers = await container.psql("SELECT tgname FROM pg_trigger WHERE NOT tgisinternal ORDER BY tgname");

    if (triggers.code !== 0) {
      return { ok: false, detail: `pg_trigger query failed:\n${triggers.output}` };
    }

    const present = new Set(triggers.output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
    const missing = REQUIRED_TRIGGERS.filter((trigger) => !present.has(trigger));

    if (missing.length > 0) {
      return { ok: false, detail: `missing database triggers: ${missing.join(", ")}` };
    }

    return { ok: true, detail: `no drift; ${REQUIRED_TRIGGERS.length} required triggers present` };
  } finally {
    await container.remove();
    log(`[drift] container ${container.name} removed`);
  }
}

if (isMainModule(import.meta.url)) {
  checkMigrationDrift()
    .then((result) => {
      console.log(result.ok ? `[drift] OK: ${result.detail}` : `[drift] FAILED: ${result.detail}`);
      process.exitCode = result.ok ? 0 : 1;
    })
    .catch((error) => {
      console.error(`[drift] ERROR: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    });
}
