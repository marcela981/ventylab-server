/*
 * Funcionalidad: Utilidad redactSecrets
 * Descripción: Reemplaza recursivamente por un marcador los valores de claves sensibles (contraseñas y sus plurales, hashes, sales, PIN, OTP, JWT, firmas, tokens de sesión, secretos, claves de credenciales como apiKey/secretKey/accessKey, credenciales) y los valores de texto con forma de JWT o de token Bearer, en objetos y arreglos, sin mutar el original y sin distinguir mayúsculas, guiones ni guiones bajos; no oculta contadores como maxOutputTokens ni la clave "key" de un ajuste
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const REDACTED_VALUE: string = "[REDACTED]";

const SENSITIVE_KEYS: ReadonlySet<string> = new Set<string>(["authorization", "cookie", "otp", "pin", "pwd", "jwt", "salt", "signature"]);

// Plural token suffixes are explicit so usage counters (maxOutputTokens, tokensPerDay) stay visible, and a bare
// "key" (a platform-setting name) is never redacted, only compound credential keys such as apiKey.
const SENSITIVE_KEY_SUFFIXES: readonly string[] = [
  "password",
  "passwords",
  "passwordhash",
  "pwd",
  "pincode",
  "hash",
  "salt",
  "otp",
  "jwt",
  "signature",
  "token",
  "refreshtokens",
  "accesstokens",
  "idtokens",
  "authtokens",
  "apitokens",
  "sessiontokens",
  "bearertokens",
  "secret",
  "secrets",
  "apikey",
  "apikeys",
  "privatekey",
  "privatekeys",
  "secretkey",
  "secretkeys",
  "accesskey",
  "accesskeys",
  "clientkey",
  "clientkeys",
  "signingkey",
  "encryptionkey",
  "sessionkey",
  "credential",
  "credentials",
];

// A JWT header is base64url JSON, so it always starts with "eyJ"; this keeps dotted strings like versions safe.
const JWT_PATTERN: RegExp = /eyJ[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]*/g;

const BEARER_PATTERN: RegExp = /^\s*bearer\s+[A-Za-z0-9._~+/-]{8,}=*\s*$/i;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[-_]/g, "");
}

export function isSensitiveKey(key: string): boolean {
  const normalized: string = normalizeKey(key);

  return SENSITIVE_KEYS.has(normalized) || SENSITIVE_KEY_SUFFIXES.some((suffix: string) => normalized.endsWith(suffix));
}

function redactString(value: string): string {
  if (BEARER_PATTERN.test(value)) {
    return REDACTED_VALUE;
  }

  return value.replace(JWT_PATTERN, REDACTED_VALUE);
}

function redactObject(source: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    redacted[key] = isSensitiveKey(key) ? REDACTED_VALUE : redactSecrets(value);
  }

  return redacted;
}

export function redactSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item: unknown) => redactSecrets(item));
  }

  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return redactObject(value as Record<string, unknown>);
  }

  return value;
}
