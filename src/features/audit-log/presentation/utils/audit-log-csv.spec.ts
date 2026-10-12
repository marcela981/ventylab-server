/*
 * Funcionalidad: Pruebas del serializador CSV de auditoría
 * Descripción: Verifica la cabecera, el escape RFC 4180 de comillas, comas y saltos de línea, la serialización JSON de los estados y el prefijo contra inyección de fórmulas en celdas que empiezan por =, +, - o @
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildAuditEntry } from "@/features/audit-log/application/testing/audit-log-test-doubles-spec";
import { toAuditLogCsv } from "@/features/audit-log/presentation/utils/audit-log-csv";

describe("toAuditLogCsv", () => {
  it("writes the header and one CRLF-terminated row per entry with JSON states", () => {
    const csv: string = toAuditLogCsv([buildAuditEntry()]);
    const lines: string[] = csv.split("\r\n");

    expect(lines[0]).toBe("performedAt,action,actorId,actorRole,targetCollection,targetType,targetId,description,reason,before,after,metadata,requestId,ip");
    expect(lines[1]).toBe("2026-10-01T10:00:00.000Z,user_role_changed,admin-1,ADMIN,users,user,u-2,,,\"{\"\"role\"\":\"\"STUDENT\"\"}\",\"{\"\"role\"\":\"\"TEACHER\"\"}\",,,");
    expect(lines[2]).toBe("");
  });

  it("quotes fields with commas, quotes and line breaks", () => {
    const csv: string = toAuditLogCsv([buildAuditEntry({ description: "Changed, as \"requested\"\nby the coordinator", before: undefined, after: undefined })]);

    expect(csv).toContain("\"Changed, as \"\"requested\"\"\nby the coordinator\"");
  });

  it("prefixes cells that start with formula characters", () => {
    const csv: string = toAuditLogCsv([
      buildAuditEntry({ description: "=HYPERLINK(\"http://evil\")", reason: "+1", actorRole: "-2", ip: "@SUM(A1)", before: undefined, after: undefined }),
    ]);
    const row: string = csv.split("\r\n")[1];

    expect(row).toContain("'+1");
    expect(row).toContain("'-2");
    expect(row).toContain("'@SUM(A1)");
    expect(row).toContain("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(row).not.toMatch(/(^|,)[=+\-@]/);
  });
});
