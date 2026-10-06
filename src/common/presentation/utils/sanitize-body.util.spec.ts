/*
 * Funcionalidad: Pruebas de sanitizeBody
 * Descripción: Verifica que se oculten contraseñas, tokens y credenciales en cualquier nivel del cuerpo, sin distinguir mayúsculas y sin modificar el original
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { sanitizeBody } from "@/common/presentation/utils/sanitize-body.util";

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
      email: "ana@ventylab.com",
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
      session: { user: { email: "ana@ventylab.com", accessToken: REDACTED }, refreshToken: REDACTED },
      items: [{ credential: REDACTED, name: "n" }, "plain"],
    });
  });

  it("does not mutate the original body", () => {
    const body: Record<string, unknown> = { nested: { password: "Secret123" } };

    sanitizeBody(body);

    expect(body).toEqual({ nested: { password: "Secret123" } });
  });
});
