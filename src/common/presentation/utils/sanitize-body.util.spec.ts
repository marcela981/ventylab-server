/*
 * Funcionalidad: Pruebas de sanitizeBody
 * Descripción: Verifica que se oculten contraseñas, tokens y credenciales y se enmascaren los correos en cualquier nivel del cuerpo, sin distinguir mayúsculas y sin modificar el original, y que la descripción de una excepción para el registro no conserve correos, tokens ni los valores u objetos de una validación fallida
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ValidationError } from "class-validator";

import { describeExceptionForLog, type LoggedException, sanitizeBody, sanitizeLogText } from "@/common/presentation/utils/sanitize-body.util";

const REDACTED: string = "[REDACTED]";

describe("sanitizeBody", () => {
  it("returns null for an empty or missing body", () => {
    const results: (Record<string, unknown> | null)[] = [sanitizeBody(undefined), sanitizeBody({})];

    expect(results).toEqual([null, null]);
  });

  it("redacts every sensitive top-level field and keeps the rest", () => {
    const body: Record<string, unknown> = {
      email: "ana@ventylab.com",
      password: "Secret123",
      token: "t",
      secret: "s",
      authorization: "Bearer x",
      refreshToken: "r",
      accessToken: "a",
      idToken: "i",
      credential: "c",
      passwordHash: "h",
      currentPassword: "old",
      newPassword: "new",
    };

    const sanitized: Record<string, unknown> | null = sanitizeBody(body);

    expect(sanitized).toEqual({
      email: "[EMAIL]",
      password: REDACTED,
      token: REDACTED,
      secret: REDACTED,
      authorization: REDACTED,
      refreshToken: REDACTED,
      accessToken: REDACTED,
      idToken: REDACTED,
      credential: REDACTED,
      passwordHash: REDACTED,
      currentPassword: REDACTED,
      newPassword: REDACTED,
    });
  });

  it("matches sensitive keys case-insensitively", () => {
    const body: Record<string, unknown> = { Password: "x", REFRESHTOKEN: "y", IdToken: "z" };

    const sanitized: Record<string, unknown> | null = sanitizeBody(body);

    expect(sanitized).toEqual({ Password: REDACTED, REFRESHTOKEN: REDACTED, IdToken: REDACTED });
  });

  it("redacts nested objects and objects inside arrays", () => {
    const body: Record<string, unknown> = {
      session: { user: { email: "ana@ventylab.com", accessToken: "a" }, refreshToken: "r" },
      items: [{ credential: "c", name: "n" }, "plain"],
    };

    const sanitized: Record<string, unknown> | null = sanitizeBody(body);

    expect(sanitized).toEqual({
      session: { user: { email: "[EMAIL]", accessToken: REDACTED }, refreshToken: REDACTED },
      items: [{ credential: REDACTED, name: "n" }, "plain"],
    });
  });

  it("does not mutate the original body", () => {
    const body: Record<string, unknown> = { nested: { password: "Secret123" } };

    sanitizeBody(body);

    expect(body).toEqual({ nested: { password: "Secret123" } });
  });

  it("masks email addresses inside free text values", () => {
    const body: Record<string, unknown> = { note: "Contact ana.maria+test@uni.edu.co or pedro@ventylab.com", tags: ["x@y.io"] };

    const sanitized: Record<string, unknown> | null = sanitizeBody(body);

    expect(sanitized).toEqual({ note: "Contact [EMAIL] or [EMAIL]", tags: ["[EMAIL]"] });
  });
});

describe("sanitizeLogText", () => {
  it("masks emails and JWTs in a log message", () => {
    const text: string = "User ana@ventylab.com sent eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl";

    const sanitized: string = sanitizeLogText(text);

    expect(sanitized).toBe("User [EMAIL] sent [REDACTED]");
  });
});

describe("describeExceptionForLog", () => {
  it("keeps only property paths and constraint names of validation errors, never the received object or value", () => {
    const target: Record<string, unknown> = { email: "ana@ventylab.com", password: "Secret123", profile: { phone: "300" } };
    const errors: ValidationError[] = [
      { property: "password", value: "Secret123", target, constraints: { matches: "users.password_strength|{\"value\":\"Secret123\"}" }, children: [] },
      { property: "profile", value: target.profile, target, children: [{ property: "phone", value: "300", constraints: { isPhoneNumber: "bad 300" }, children: [] }] },
    ];

    const logged: LoggedException = describeExceptionForLog(new Error("Bad Request"), errors);

    expect(logged.validation).toEqual([{ property: "password", constraints: ["matches"] }, { property: "profile.phone", constraints: ["isPhoneNumber"] }]);
    expect(JSON.stringify(logged)).not.toContain("Secret123");
    expect(JSON.stringify(logged)).not.toContain("ana@ventylab.com");
  });

  it("masks emails in the message and stack of any error", () => {
    const error: Error = new Error("No account for ana@ventylab.com");

    const logged: LoggedException = describeExceptionForLog(error);

    expect(logged).toMatchObject({ name: "Error", message: "No account for [EMAIL]" });
    expect(logged.stack).not.toContain("ana@ventylab.com");
    expect(logged.validation).toBeUndefined();
  });

  it("describes a thrown value that is not an Error", () => {
    const logged: LoggedException = describeExceptionForLog("failure for ana@ventylab.com");

    expect(logged).toEqual({ name: "string", message: "failure for [EMAIL]" });
  });
});
