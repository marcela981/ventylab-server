/*
 * Funcionalidad: Enmascarado de direcciones de correo
 * Descripción: Reemplaza por un marcador cada dirección de correo dentro de textos, arreglos y objetos anidados (sin modificar las claves), para que los registros de errores y los eventos de monitoreo no guarden datos personales
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const MASKED_EMAIL_VALUE: string = "[EMAIL]";

const EMAIL_PATTERN: RegExp = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;

export function maskEmailsInText(text: string): string {
  return text.replace(EMAIL_PATTERN, MASKED_EMAIL_VALUE);
}

export function maskEmailAddresses(value: unknown): unknown {
  if (typeof value === "string") {
    return maskEmailsInText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item: unknown) => maskEmailAddresses(item));
  }

  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, nested]: [string, unknown]): [string, unknown] => [key, maskEmailAddresses(nested)]));
  }

  return value;
}
