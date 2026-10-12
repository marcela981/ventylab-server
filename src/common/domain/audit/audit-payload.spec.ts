/*
 * Funcionalidad: Pruebas de las utilidades de carga útil de auditoría
 * Descripción: Verifica que el diff conserve solo los campos cambiados, que los textos largos y el contenido enriquecido se guarden como sha256 y longitud y que los secretos se oculten en cualquier nivel
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHash } from "crypto";

import {
  AUDIT_LONG_TEXT_THRESHOLD,
  type AuditPayload,
  type AuditStateDiff,
  diffAuditStates,
  protectAuditPayload,
} from "@/common/domain/audit/audit-payload";
import { REDACTED_VALUE } from "@/common/domain/utils/redact-secrets";

describe("diffAuditStates", () => {
  it("keeps only the fields whose value changed", () => {
    const before: AuditPayload = { role: "STUDENT", name: "Ana", tags: ["a"], updatedAt: new Date("2026-01-01T00:00:00Z") };
    const after: AuditPayload = { role: "TEACHER", name: "Ana", tags: ["a"], updatedAt: new Date("2026-01-01T00:00:00Z") };

    const diff: AuditStateDiff = diffAuditStates(before, after);

    expect(diff).toEqual({ before: { role: "STUDENT" }, after: { role: "TEACHER" } });
  });

  it("records fields that only exist on one side", () => {
    const diff: AuditStateDiff = diffAuditStates({ status: "ACTIVE" }, { status: "INACTIVE", removedGroupIds: ["g-1"] });

    expect(diff).toEqual({ before: { status: "ACTIVE" }, after: { status: "INACTIVE", removedGroupIds: ["g-1"] } });
  });

  it("compares nested values structurally", () => {
    const diff: AuditStateDiff = diffAuditStates({ window: { from: 1, to: 2 } }, { window: { from: 1, to: 2 } });

    expect(diff).toEqual({ before: {}, after: {} });
  });
});

describe("protectAuditPayload", () => {
  it("replaces text longer than the threshold with its sha256 and length", () => {
    const longText: string = "x".repeat(AUDIT_LONG_TEXT_THRESHOLD + 1);

    const protectedPayload: AuditPayload = protectAuditPayload({ notes: longText, title: "Short" });

    expect(protectedPayload).toEqual({
      notes: { sha256: createHash("sha256").update(longText).digest("hex"), length: longText.length },
      title: "Short",
    });
  });

  it("replaces HTML and editor JSON content with a digest", () => {
    const html: string = "<p>Hello <strong>world</strong></p>";
    const document: AuditPayload = { type: "doc", content: [{ type: "paragraph" }] };

    const protectedPayload: AuditPayload = protectAuditPayload({ block: { html, content: document } });

    expect(protectedPayload).toEqual({
      block: {
        html: { sha256: createHash("sha256").update(html).digest("hex"), length: html.length },
        content: { sha256: createHash("sha256").update(JSON.stringify(document)).digest("hex"), length: JSON.stringify(document).length },
      },
    });
  });

  it("redacts passwords, hashes, tokens, secrets and API keys at any depth", () => {
    const payload: AuditPayload = {
      password: "Secret123",
      user: { passwordHash: "$2b$10$abc", email: "ana@ventylab.com" },
      tokens: [{ accessToken: "a.b.c", refresh_token: "r-1", resetToken: "reset-1" }],
      provider: { apiKey: "sk-live", clientSecret: "cs" },
    };

    const protectedPayload: AuditPayload = protectAuditPayload(payload);

    expect(protectedPayload).toEqual({
      password: REDACTED_VALUE,
      user: { passwordHash: REDACTED_VALUE, email: "ana@ventylab.com" },
      tokens: [{ accessToken: REDACTED_VALUE, refresh_token: REDACTED_VALUE, resetToken: REDACTED_VALUE }],
      provider: { apiKey: REDACTED_VALUE, clientSecret: REDACTED_VALUE },
    });
  });

  it("does not mutate the original payload", () => {
    const payload: AuditPayload = { nested: { password: "Secret123" } };

    protectAuditPayload(payload);

    expect(payload).toEqual({ nested: { password: "Secret123" } });
  });
});
