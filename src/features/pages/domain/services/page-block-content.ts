/*
 * Funcionalidad: Validación y saneamiento del contenido de bloques
 * Descripción: Valida por tipo el contenido de un bloque de página (Tiptap JSON estructural para texto enriquecido, media obligatoria para imagen y archivo, video por media o URL de YouTube/Vimeo, fuente KaTeX para ecuaciones) y sanea cada cadena HTML con el saneador recibido, descartando campos desconocidos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  CODE_BLOCK_TYPE,
  DIVIDER_BLOCK_TYPE,
  EQUATION_BLOCK_TYPE,
  MEDIA_REQUIRED_BLOCK_TYPES,
  type PageBlockTypeValue,
  RICH_TEXT_BLOCK_TYPES,
  VIDEO_BLOCK_TYPE,
} from "@/features/pages/domain/value-objects/page-block-type";

export interface BlockSanitizer {
  sanitizeHtml(html: string): string;
  stripTags(text: string): string;
}

export interface BlockInput {
  readonly type: PageBlockTypeValue;
  readonly content: unknown;
  readonly mediaId?: string;
}

export type BlockValidationResult =
  | { readonly valid: true; readonly content: Record<string, unknown>; readonly mediaId?: string }
  | { readonly valid: false; readonly reason: string };

export const ALLOWED_VIDEO_HOSTS: readonly string[] = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
] as const;

const MAX_TIPTAP_DEPTH: number = 40;
const MAX_TIPTAP_NODES: number = 5000;
const MAX_LATEX_LENGTH: number = 10000;
const MAX_TEXT_FIELD_LENGTH: number = 100000;
const NODE_TYPE_PATTERN: RegExp = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const SAFE_LINK_PATTERN: RegExp = /^(https?:\/\/|mailto:|\/|#)/i;

interface NodeBudget {
  remaining: number;
}

export function normalizeBlock(input: BlockInput, sanitizer: BlockSanitizer): BlockValidationResult {
  const raw: unknown = input.content ?? {};

  if (!isPlainObject(raw)) {
    return invalid("content_not_object");
  }

  if (RICH_TEXT_BLOCK_TYPES.includes(input.type)) {
    return input.mediaId ? invalid("media_not_allowed") : normalizeRichText(raw, sanitizer);
  }

  if (MEDIA_REQUIRED_BLOCK_TYPES.includes(input.type)) {
    return input.mediaId ? valid(pickCaptions(raw, sanitizer), input.mediaId) : invalid("media_required");
  }

  if (input.type === VIDEO_BLOCK_TYPE) {
    return normalizeVideo(raw, input.mediaId, sanitizer);
  }

  if (input.mediaId) {
    return invalid("media_not_allowed");
  }

  if (input.type === EQUATION_BLOCK_TYPE) {
    return normalizeEquation(raw);
  }

  if (input.type === CODE_BLOCK_TYPE) {
    return normalizeCode(raw);
  }

  return input.type === DIVIDER_BLOCK_TYPE ? valid({}) : invalid("unsupported_type");
}

export function isAllowedVideoUrl(value: string): boolean {
  try {
    const url: URL = new URL(value);

    return url.protocol === "https:" && ALLOWED_VIDEO_HOSTS.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function sanitizeTiptapNode(node: unknown, sanitizer: BlockSanitizer, depth: number, budget: NodeBudget): Record<string, unknown> | undefined {
  budget.remaining -= 1;

  if (depth > MAX_TIPTAP_DEPTH || budget.remaining < 0 || !isPlainObject(node) || typeof node.type !== "string" || !NODE_TYPE_PATTERN.test(node.type)) {
    return undefined;
  }

  const result: Record<string, unknown> = { type: node.type };

  if (node.text !== undefined) {
    if (typeof node.text !== "string") {
      return undefined;
    }

    result.text = sanitizer.stripTags(node.text);
  }

  if (node.attrs !== undefined) {
    const attrs: Record<string, unknown> | undefined = sanitizeAttrs(node.attrs, sanitizer);

    if (!attrs) {
      return undefined;
    }

    result.attrs = attrs;
  }

  if (node.marks !== undefined) {
    const marks: Record<string, unknown>[] | undefined = sanitizeMarks(node.marks, sanitizer);

    if (!marks) {
      return undefined;
    }

    result.marks = marks;
  }

  if (node.content !== undefined) {
    if (!Array.isArray(node.content)) {
      return undefined;
    }

    const children: Record<string, unknown>[] = [];

    for (const child of node.content) {
      const sanitizedChild: Record<string, unknown> | undefined = sanitizeTiptapNode(child, sanitizer, depth + 1, budget);

      if (!sanitizedChild) {
        return undefined;
      }

      children.push(sanitizedChild);
    }

    result.content = children;
  }

  return result;
}

function normalizeRichText(raw: Record<string, unknown>, sanitizer: BlockSanitizer): BlockValidationResult {
  const content: Record<string, unknown> = {};

  if (raw.doc !== undefined) {
    if (!isPlainObject(raw.doc) || raw.doc.type !== "doc") {
      return invalid("invalid_tiptap_document");
    }

    const doc: Record<string, unknown> | undefined = sanitizeTiptapNode(raw.doc, sanitizer, 0, { remaining: MAX_TIPTAP_NODES });

    if (!doc) {
      return invalid("invalid_tiptap_document");
    }

    content.doc = doc;
  }

  for (const field of ["markdown", "html"]) {
    if (raw[field] !== undefined) {
      if (typeof raw[field] !== "string" || raw[field].length > MAX_TEXT_FIELD_LENGTH) {
        return invalid(`invalid_${field}`);
      }

      content[field] = sanitizer.sanitizeHtml(raw[field]);
    }
  }

  if (raw.variant !== undefined) {
    if (typeof raw.variant !== "string") {
      return invalid("invalid_variant");
    }

    content.variant = sanitizer.stripTags(raw.variant);
  }

  return content.doc === undefined && content.markdown === undefined && content.html === undefined ? invalid("rich_text_required") : valid(content);
}

function normalizeVideo(raw: Record<string, unknown>, mediaId: string | undefined, sanitizer: BlockSanitizer): BlockValidationResult {
  const hasUrl: boolean = raw.url !== undefined;

  if (hasUrl === (mediaId !== undefined)) {
    return invalid("video_source_required");
  }

  const content: Record<string, unknown> = pickCaptions(raw, sanitizer);

  if (!hasUrl) {
    return valid(content, mediaId);
  }

  if (typeof raw.url !== "string" || !isAllowedVideoUrl(raw.url)) {
    return invalid("video_host_not_allowed");
  }

  return valid({ ...content, url: raw.url });
}

function normalizeEquation(raw: Record<string, unknown>): BlockValidationResult {
  if (typeof raw.latex !== "string" || raw.latex.trim().length === 0 || raw.latex.length > MAX_LATEX_LENGTH) {
    return invalid("invalid_equation");
  }

  if (raw.display !== undefined && typeof raw.display !== "boolean") {
    return invalid("invalid_equation");
  }

  return valid(raw.display === undefined ? { latex: raw.latex } : { latex: raw.latex, display: raw.display });
}

function normalizeCode(raw: Record<string, unknown>): BlockValidationResult {
  if (typeof raw.code !== "string" || raw.code.length > MAX_TEXT_FIELD_LENGTH) {
    return invalid("invalid_code");
  }

  if (raw.language !== undefined && (typeof raw.language !== "string" || !NODE_TYPE_PATTERN.test(raw.language))) {
    return invalid("invalid_code");
  }

  return valid(raw.language === undefined ? { code: raw.code } : { code: raw.code, language: raw.language });
}

function pickCaptions(raw: Record<string, unknown>, sanitizer: BlockSanitizer): Record<string, unknown> {
  const content: Record<string, unknown> = {};

  for (const field of ["caption", "alt"]) {
    if (typeof raw[field] === "string") {
      content[field] = sanitizer.sanitizeHtml(raw[field]);
    }
  }

  return content;
}

function sanitizeAttrs(attrs: unknown, sanitizer: BlockSanitizer): Record<string, unknown> | undefined {
  if (!isPlainObject(attrs)) {
    return undefined;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
    } else if (typeof value === "string") {
      if ((key === "href" || key === "src") && !SAFE_LINK_PATTERN.test(value.trim())) {
        return undefined;
      }

      result[key] = sanitizer.stripTags(value);
    } else {
      return undefined;
    }
  }

  return result;
}

function sanitizeMarks(marks: unknown, sanitizer: BlockSanitizer): Record<string, unknown>[] | undefined {
  if (!Array.isArray(marks)) {
    return undefined;
  }

  const result: Record<string, unknown>[] = [];

  for (const mark of marks) {
    if (!isPlainObject(mark) || typeof mark.type !== "string" || !NODE_TYPE_PATTERN.test(mark.type)) {
      return undefined;
    }

    const sanitizedMark: Record<string, unknown> = { type: mark.type };

    if (mark.attrs !== undefined) {
      const attrs: Record<string, unknown> | undefined = sanitizeAttrs(mark.attrs, sanitizer);

      if (!attrs) {
        return undefined;
      }

      sanitizedMark.attrs = attrs;
    }

    result.push(sanitizedMark);
  }

  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valid(content: Record<string, unknown>, mediaId?: string): BlockValidationResult {
  return mediaId === undefined ? { valid: true, content } : { valid: true, content, mediaId };
}

function invalid(reason: string): BlockValidationResult {
  return { valid: false, reason };
}
