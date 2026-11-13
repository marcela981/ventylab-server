/*
 * Funcionalidad: audit-guards — Guardas de opt-in de los auditores E2E con efectos fuera del proceso
 * Descripción: Funciones puras que deciden si la auditoría E2E puede ejecutar G2 (CommandOutbound: envía un comando
 *              VCV real por POST /api/ventilator/commands; el backend lo publica en SU broker, que la guarda de broker
 *              de la auditoría no controla) y G4 (AdminDashboard: escribe y borra filas con Prisma). G2 exige la
 *              bandera explícita --allow-command-audit y solo debe apuntar a un backend con NODE_ENV=test o al stack
 *              local (broker local). G4 exige AUDIT_DATABASE_URL explícita: la auditoría nunca lee DATABASE_URL ni
 *              carga .env con dotenv. Los mensajes nunca imprimen la URL (puede llevar credenciales). Pruebas:
 *              node --test scripts/audit-e2e/audit-guards.test.ts
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

export const ALLOW_COMMAND_AUDIT_FLAG = "--allow-command-audit";
export const AUDIT_DATABASE_URL_ENV = "AUDIT_DATABASE_URL";

/** Why G2 must not run (no explicit opt-in), or null. */
export function commandAuditRefusal(argv: readonly string[]): string | null {
  return argv.includes(ALLOW_COMMAND_AUDIT_FLAG)
    ? null
    : `G2 sends a real ventilator command that the target backend publishes on ITS broker (the broker guard cannot see it). Pass ${ALLOW_COMMAND_AUDIT_FLAG} only against a backend running with NODE_ENV=test or the local stack broker.`;
}

/** The explicit database URL of the audit (AUDIT_DATABASE_URL), or null; never DATABASE_URL nor .env. */
export function auditDatabaseUrl(env: Readonly<Record<string, string | undefined>>): string | null {
  const url = env[AUDIT_DATABASE_URL_ENV]?.trim() ?? "";

  return url.length > 0 ? url : null;
}

/** Why G4 must not run (no AUDIT_DATABASE_URL), or null. */
export function databaseAuditRefusal(env: Readonly<Record<string, string | undefined>>): string | null {
  return auditDatabaseUrl(env) === null
    ? `G4 writes to a database: set ${AUDIT_DATABASE_URL_ENV} to a local/test database (DATABASE_URL and .env are never read by the audit).`
    : null;
}
