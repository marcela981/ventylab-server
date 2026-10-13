/*
 * Funcionalidad: Pruebas de la redacción de eventos de Sentry
 * Descripción: Verifica que redactSentryEvent oculte contraseñas, tokens, cabeceras de autorización, secretos compartidos y cookies, y enmascare correos en el cuerpo (objeto o texto JSON), la consulta y la URL de la petición adjunta a un evento, sin tocar eventos sin petición
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Event } from "@sentry/nestjs";

import { redactSentryEvent } from "@/common/infrastructure/logging/sentry-redaction";

const PASSWORD: string = "Secret-Password-123";
const EMAIL: string = "ana@ventylab.com";
const BRIDGE_SECRET: string = "bridge-secret-value";
const JWT: string = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl";

describe("redactSentryEvent", () => {
  it("should redact secrets and mask emails in every part of the attached request", () => {
    const event: Event = {
      request: {
        url: `https://api.ventylab.test/api/users/${EMAIL}?token=${JWT}&page=2`,
        data: JSON.stringify({ email: EMAIL, password: PASSWORD, nested: { refreshToken: JWT } }),
        query_string: `token=${JWT}&q=${EMAIL}`,
        headers: { authorization: `Bearer ${JWT}`, "x-nextauth-bridge-secret": BRIDGE_SECRET, "content-type": "application/json" },
        cookies: { session: "cookie-value" },
      },
    };

    const redacted: Event = redactSentryEvent(event);
    const serialized: string = JSON.stringify(redacted);

    [PASSWORD, EMAIL, BRIDGE_SECRET, JWT, "cookie-value"].forEach((secret: string): void => {
      expect(serialized).not.toContain(secret);
    });
    expect(redacted.request?.headers?.["content-type"]).toBe("application/json");
    expect(JSON.parse(redacted.request?.data as string)).toEqual({ email: "[EMAIL]", password: "[REDACTED]", nested: { refreshToken: "[REDACTED]" } });
    expect(redacted.request?.url).toContain("page=2");
  });

  it("should redact a request body attached as an object and a non JSON text body", () => {
    const fromObject: Event = redactSentryEvent({ request: { data: { password: PASSWORD, note: `mail ${EMAIL}` } } });
    const fromText: Event = redactSentryEvent({ request: { data: `password reset for ${EMAIL}` } });

    expect(fromObject.request?.data).toEqual({ password: "[REDACTED]", note: "mail [EMAIL]" });
    expect(fromText.request?.data).toBe("password reset for [EMAIL]");
  });

  it("should leave an event without request untouched", () => {
    const event: Event = { message: "plain" };

    const redacted: Event = redactSentryEvent(event);

    expect(redacted).toBe(event);
  });
});
