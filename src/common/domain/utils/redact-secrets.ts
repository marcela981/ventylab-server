/*
 * Funcionalidad: Utilidad redactSecrets
 * Descripción: Reemplaza recursivamente por un marcador los valores de claves sensibles (contraseñas, hashes de contraseña, tokens, secretos, claves de API, credenciales) en objetos y arreglos, sin mutar el original y sin distinguir mayúsculas, guiones ni guiones bajos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const REDACTED_VALUE: string = "[REDACTED]";

const SENSITIVE_KEYS: ReadonlySet<string> = new Set<string>(["authorization", "credential", "credentials", "cookie", "otp"]);

const SENSITIVE_KEY_SUFFIXES: readonly string[] = ["password", "passwordhash", "hash", "token", "secret", "apikey", "privatekey", "credential", "credentials"];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[-_]/g, "");
}

export function isSensitiveKey(key: string): boolean {
  const normalized: string = normalizeKey(key);

  return SENSITIVE_KEYS.has(normalized) || SENSITIVE_KEY_SUFFIXES.some((suffix: string) => normalized.endsWith(suffix));
}

function redactObject(source: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    redacted[key] = isSensitiveKey(key) ? REDACTED_VALUE : redactSecrets(value);
  }

  return redacted;
}

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => redactSecrets(item));
  }

  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return redactObject(value as Record<string, unknown>);
  }

  return value;
}
