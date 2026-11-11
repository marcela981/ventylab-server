/*
 * Funcionalidad: Pruebas de las guardas de opt-in de la auditoría E2E
 * Descripción: Verifica con node:test (sin dependencias) que G2 (comando real) solo corre con --allow-command-audit,
 *              que G4 (escrituras en base de datos) exige AUDIT_DATABASE_URL y nunca toma DATABASE_URL, y que los
 *              mensajes no repiten la URL. Ejecutar: node --test scripts/audit-e2e/audit-guards.test.ts
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { auditDatabaseUrl, commandAuditRefusal, databaseAuditRefusal } from "./audit-guards.ts";

test("the command audit (G2) needs the explicit flag", () => {
  assert.match(commandAuditRefusal(["node", "audit-e2e.ts"]) ?? "", /--allow-command-audit/u);
  assert.match(commandAuditRefusal(["node", "audit-e2e.ts", "--allow-remote-test-broker"]) ?? "", /NODE_ENV=test/u);
  assert.equal(commandAuditRefusal(["node", "audit-e2e.ts", "--allow-command-audit"]), null);
});

test("the database audit (G4) needs AUDIT_DATABASE_URL and never takes DATABASE_URL", () => {
  const url = "postgresql://user:secret@127.0.0.1:5432/test";

  assert.equal(auditDatabaseUrl({ DATABASE_URL: url }), null);
  assert.match(databaseAuditRefusal({ DATABASE_URL: url }) ?? "", /AUDIT_DATABASE_URL/u);
  assert.equal(auditDatabaseUrl({ AUDIT_DATABASE_URL: "  " }), null);
  assert.equal(auditDatabaseUrl({ AUDIT_DATABASE_URL: url }), url);
  assert.equal(databaseAuditRefusal({ AUDIT_DATABASE_URL: url }), null);
  assert.doesNotMatch(databaseAuditRefusal({ DATABASE_URL: url }) ?? "", /secret/u);
});
