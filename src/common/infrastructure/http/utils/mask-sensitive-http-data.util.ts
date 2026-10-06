/*
 * Funcionalidad: Utilidad maskSensitiveHttpData
 * Descripción: Enmascara cabeceras y campos sensibles de peticiones HTTP antes de enviarlos a observabilidad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const SENSITIVE_KEY_PATTERN: RegExp = /(password|token|secret|api[-_]?key|authorization|cookie)/i;
const VISIBLE_SUFFIX_LENGTH: number = 4;

// Header/token values are often "<scheme> <credential>" (e.g. "Bearer abc123"); masking only
// the last whitespace-separated segment keeps the scheme visible while hiding the credential.
function maskValue(value: unknown): unknown {
  if (typeof value !== "string" || value.length === 0) {
    return "[REDACTED]";
  }

  const parts: string[] = value.split(" ");
  const secret: string = parts[parts.length - 1];
  const visibleSuffix: string = secret.length > VISIBLE_SUFFIX_LENGTH ? secret.slice(-VISIBLE_SUFFIX_LENGTH) : "";

  parts[parts.length - 1] = `****${visibleSuffix}`;

  return parts.join(" ");
}

export function maskSensitiveHttpData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => maskSensitiveHttpData(item));
  }

  if (value !== null && typeof value === "object") {
    const masked: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      masked[key] = SENSITIVE_KEY_PATTERN.test(key) ? maskValue(nestedValue) : maskSensitiveHttpData(nestedValue);
    }

    return masked;
  }

  return value;
}
