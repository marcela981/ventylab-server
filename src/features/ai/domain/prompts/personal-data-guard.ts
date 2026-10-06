/*
 * Funcionalidad: Protección de datos personales en prompts
 * Descripción: Funciones puras que eliminan correos electrónicos y los nombres indicados por el consumidor (como palabras completas con límites Unicode, sin distinguir mayúsculas, del más largo al más corto) del texto que se envía a los proveedores de IA
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const REDACTED_EMAIL: string = "[correo eliminado]";

export const REDACTED_NAME: string = "[nombre eliminado]";

const EMAIL_PATTERN: RegExp = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const MIN_REDACTED_NAME_LENGTH: number = 3;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripEmails(text: string): string {
  return text.replace(EMAIL_PATTERN, REDACTED_EMAIL);
}

export function containsEmail(text: string): boolean {
  return new RegExp(EMAIL_PATTERN.source).test(text);
}

export function redactPersonalData(text: string, names: readonly string[] = []): string {
  let redacted: string = stripEmails(text);
  const candidates: string[] = names
    .map((name: string) => name.trim())
    .filter((name: string) => name.length >= MIN_REDACTED_NAME_LENGTH)
    .sort((left: string, right: string) => right.length - left.length);

  for (const name of candidates) {
    redacted = redacted.replace(wholeWordPattern(name), REDACTED_NAME);
  }

  return redacted;
}

// Letters and digits on either side mean the name is part of a longer word (for example "Ana" inside "anatomía"), so it is left untouched.
function wholeWordPattern(name: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(name)}(?![\\p{L}\\p{N}])`, "giu");
}
