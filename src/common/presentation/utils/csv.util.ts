/*
 * Funcionalidad: Utilidad CSV
 * Descripción: Serializa filas a CSV según RFC 4180 con terminadores CRLF, escapando comillas, comas y saltos de línea y neutralizando valores que una hoja de cálculo ejecutaría como fórmula (prefijo ')
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type CsvValue = string | number | boolean | Date | undefined;

const CSV_LINE_BREAK: string = "\r\n";

const FORMULA_PREFIXES: readonly string[] = ["=", "+", "-", "@", "\t", "\r"];

const CHARACTERS_REQUIRING_QUOTES: RegExp = /[",\r\n]/;

export function escapeCsvField(value: CsvValue): string {
  if (value === undefined) {
    return "";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  const text: string = value instanceof Date ? value.toISOString() : value;
  const safeText: string = FORMULA_PREFIXES.some((prefix: string) => text.startsWith(prefix)) ? `'${text}` : text;

  return CHARACTERS_REQUIRING_QUOTES.test(safeText) ? `"${safeText.replace(/"/g, "\"\"")}"` : safeText;
}

export function toCsv<T extends object>(rows: readonly T[], columns: readonly (keyof T & string)[]): string {
  const lines: string[] = rows.map((row: T) => columns.map((column: keyof T & string) => escapeCsvField(row[column] as CsvValue)).join(","));

  return [columns.join(","), ...lines].map((line: string) => `${line}${CSV_LINE_BREAK}`).join("");
}
