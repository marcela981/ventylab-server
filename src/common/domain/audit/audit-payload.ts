/*
 * Funcionalidad: Utilidades de carga útil de auditoría
 * Descripción: Calcula el diff de estados anterior y posterior conservando solo los campos que cambiaron y protege las cargas útiles de auditoría: oculta secretos con redactSecrets y reemplaza textos largos o contenido enriquecido (HTML, documentos JSON de editor) por su huella sha256 y su longitud
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHash } from "crypto";

import { redactSecrets } from "@/common/domain/utils/redact-secrets";

export const AUDIT_LONG_TEXT_THRESHOLD: number = 2_000;

const RICH_CONTENT_KEYS: ReadonlySet<string> = new Set<string>(["content", "html", "body", "richtext", "contentjson", "blocks"]);

const HTML_TAG_PATTERN: RegExp = /<\/?[a-z][\s\S]*>/i;

export type AuditPayload = Record<string, unknown>;

export interface AuditContentDigest {
  readonly sha256: string;
  readonly length: number;
}

export interface AuditStateDiff {
  readonly before: AuditPayload;
  readonly after: AuditPayload;
}

function toComparable(value: unknown): string {
  return JSON.stringify(value, (_key: string, item: unknown) => (item === undefined ? null : item)) ?? "null";
}

export function diffAuditStates(before: AuditPayload, after: AuditPayload): AuditStateDiff {
  const changedBefore: AuditPayload = {};
  const changedAfter: AuditPayload = {};
  const keys: Set<string> = new Set<string>([...Object.keys(before), ...Object.keys(after)]);

  for (const key of keys) {
    if (toComparable(before[key]) === toComparable(after[key])) {
      continue;
    }

    if (key in before) changedBefore[key] = before[key];
    if (key in after) changedAfter[key] = after[key];
  }

  return { before: changedBefore, after: changedAfter };
}

export function digestAuditContent(text: string): AuditContentDigest {
  return { sha256: createHash("sha256").update(text).digest("hex"), length: text.length };
}

function protectValue(key: string | undefined, value: unknown): unknown {
  const isRichContentKey: boolean = key !== undefined && RICH_CONTENT_KEYS.has(key.toLowerCase());

  if (typeof value === "string") {
    return value.length > AUDIT_LONG_TEXT_THRESHOLD || (isRichContentKey && HTML_TAG_PATTERN.test(value)) ? digestAuditContent(value) : value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value !== null && typeof value === "object") {
    if (isRichContentKey) {
      return digestAuditContent(JSON.stringify(value));
    }

    if (Array.isArray(value)) {
      return value.map((item: unknown) => protectValue(undefined, item));
    }

    const protectedObject: AuditPayload = {};

    for (const [childKey, child] of Object.entries(value as AuditPayload)) {
      protectedObject[childKey] = protectValue(childKey, child);
    }

    return protectedObject;
  }

  return value;
}

export function protectAuditPayload(payload: AuditPayload): AuditPayload {
  return protectValue(undefined, redactSecrets(payload)) as AuditPayload;
}
