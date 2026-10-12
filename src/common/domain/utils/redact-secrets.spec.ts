/*
 * Funcionalidad: Pruebas de redactSecrets
 * Descripción: Verifica que redactSecrets oculte claves de credenciales (contraseñas, PIN, OTP, sales, JWT, firmas, claves compuestas y plurales) y valores con forma de JWT o token Bearer, sin ocultar contadores de tokens ni la clave "key" de un ajuste
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { isSensitiveKey, REDACTED_VALUE, redactSecrets } from "@/common/domain/utils/redact-secrets";

const SAMPLE_JWT: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1LTEifQ.c2lnbmF0dXJlLXZhbHVl";

describe("redactSecrets", () => {
  it.each([
    "secretKey",
    "accessKey",
    "clientKey",
    "privateKey",
    "apiKey",
    "api_key",
    "signingKey",
    "pwd",
    "newPwd",
    "pin",
    "pinCode",
    "salt",
    "passwordSalt",
    "jwt",
    "idJwt",
    "signature",
    "webhookSignature",
    "otp",
    "smsOtp",
    "credential",
    "credentials",
    "awsCredentials",
    "passwords",
    "refreshTokens",
    "accessTokens",
    "secrets",
    "clientSecret",
    "password",
    "passwordHash",
    "refreshToken",
    "authorization",
    "cookie",
  ])("treats %s as a sensitive key", (key: string) => {
    const result: boolean = isSensitiveKey(key);

    expect(result).toBe(true);
  });

  it.each(["key", "maxOutputTokens", "tokensPerDay", "inputTokens", "outputTokens", "totalTokens", "tokens", "value", "keyword", "spinning", "status", "pinned"])(
    "keeps %s visible",
    (key: string) => {
      const result: boolean = isSensitiveKey(key);

      expect(result).toBe(false);
    },
  );

  it("redacts nested credential keys and keeps counters and setting names", () => {
    const payload: Record<string, unknown> = {
      key: "ai.maxOutputTokens",
      value: 2048,
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30, maxOutputTokens: 2048, tokensPerDay: 5000 },
      provider: { secretKey: "sk", accessKey: "ak", passwords: ["a", "b"] },
    };

    const redacted: unknown = redactSecrets(payload);

    expect(redacted).toEqual({
      key: "ai.maxOutputTokens",
      value: 2048,
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30, maxOutputTokens: 2048, tokensPerDay: 5000 },
      provider: { secretKey: REDACTED_VALUE, accessKey: REDACTED_VALUE, passwords: REDACTED_VALUE },
    });
  });

  it("redacts JWT-shaped values regardless of key, including inside text and arrays", () => {
    const payload: Record<string, unknown> = { note: SAMPLE_JWT, message: `issued ${SAMPLE_JWT} today`, list: [SAMPLE_JWT] };

    const redacted: unknown = redactSecrets(payload);

    expect(redacted).toEqual({ note: REDACTED_VALUE, message: `issued ${REDACTED_VALUE} today`, list: [REDACTED_VALUE] });
  });

  it("redacts bearer token values regardless of key", () => {
    const payload: Record<string, unknown> = { header: "Bearer abcdef123456", lower: "bearer  opaque.token-value_01" };

    const redacted: unknown = redactSecrets(payload);

    expect(redacted).toEqual({ header: REDACTED_VALUE, lower: REDACTED_VALUE });
  });

  it("keeps ordinary dotted strings and prose untouched", () => {
    const payload: Record<string, unknown> = { version: "1.2.3", ip: "203.0.113.10", i18n: "common.validation.string", text: "the bearer of good news" };

    const redacted: unknown = redactSecrets(payload);

    expect(redacted).toEqual(payload);
  });
});
