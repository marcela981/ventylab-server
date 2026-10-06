/*
 * Funcionalidad: Utilidad sanitizeBody
 * Descripción: Oculta contraseñas, tokens, credenciales y otros campos sensibles del cuerpo antes de registrarlo, en cualquier nivel de anidamiento y sin distinguir mayúsculas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const REDACTED_VALUE: string = "[REDACTED]";

const SENSITIVE_FIELDS: ReadonlySet<string> = new Set<string>([
  "password",
  "passwordhash",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "credential",
  "secret",
  "authorization",
]);

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => sanitizeValue(item));
  }

  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return sanitizeObject(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeObject(source: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    sanitized[key] = SENSITIVE_FIELDS.has(key.toLowerCase()) ? REDACTED_VALUE : sanitizeValue(value);
  }

  return sanitized;
}

export function sanitizeBody(
  body: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!body || Object.keys(body).length === 0) {
    return null;
  }

  return sanitizeObject(body);
}
