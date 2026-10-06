/*
 * Funcionalidad: Servicio de documentos Tiptap
 * Descripción: Valida estructuralmente documentos de texto enriquecido Tiptap (tipos, atributos, marcas, profundidad y tamaño), elimina etiquetas HTML de los textos y atributos, descarta URLs inseguras y convierte el documento a texto plano
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidNoteContentError } from "@/features/notes/domain/notes.errors";

export type TiptapAttributeValue = string | number | boolean | null | (string | number)[];

export interface TiptapMark {
  type: string;
  attrs?: Record<string, TiptapAttributeValue>;
}

export interface TiptapNode {
  type: string;
  text?: string;
  attrs?: Record<string, TiptapAttributeValue>;
  marks?: TiptapMark[];
  content?: TiptapNode[];
}

export interface TiptapDocument {
  type: "doc";
  content: TiptapNode[];
}

export const TIPTAP_MAX_DEPTH: number = 32;
export const TIPTAP_MAX_NODES: number = 5000;
export const TIPTAP_MAX_TEXT_LENGTH: number = 50000;

const DOCUMENT_TYPE: string = "doc";
const TEXT_NODE_TYPE: string = "text";
const HARD_BREAK_NODE_TYPE: string = "hardBreak";
const LIST_ITEM_NODE_TYPES: readonly string[] = ["listItem", "taskItem"];
const IDENTIFIER_PATTERN: RegExp = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const URL_ATTRIBUTE_NAMES: readonly string[] = ["href", "src"];
const SAFE_URL_PATTERN: RegExp = /^(https?:\/\/|mailto:|\/|#)/i;
const MAX_ATTRIBUTE_ARRAY_LENGTH: number = 64;

interface SanitizeBudget {
  nodes: number;
  textLength: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stripHtmlTags(value: string): string {
  let current: string = value;
  let previous: string = "";

  while (current !== previous) {
    previous = current;
    current = current
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<\/?[A-Za-z][^>]*>/g, "");
  }

  return current;
}

function sanitizeAttributes(value: unknown): Record<string, TiptapAttributeValue> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!isPlainObject(value)) {
    throw new InvalidNoteContentError("attrs must be an object");
  }

  const attributes: Record<string, TiptapAttributeValue> = {};

  for (const [key, raw] of Object.entries(value)) {
    if (!IDENTIFIER_PATTERN.test(key)) {
      throw new InvalidNoteContentError(`invalid attribute name "${key}"`);
    }

    if (raw === null || typeof raw === "boolean") {
      attributes[key] = raw;
      continue;
    }

    if (typeof raw === "number") {
      if (!Number.isFinite(raw)) {
        throw new InvalidNoteContentError(`attribute "${key}" must be a finite number`);
      }

      attributes[key] = raw;
      continue;
    }

    if (typeof raw === "string") {
      const cleaned: string = stripHtmlTags(raw).trim();

      if (URL_ATTRIBUTE_NAMES.includes(key) && !SAFE_URL_PATTERN.test(cleaned)) {
        continue;
      }

      attributes[key] = cleaned;
      continue;
    }

    if (Array.isArray(raw)) {
      if (raw.length > MAX_ATTRIBUTE_ARRAY_LENGTH) {
        throw new InvalidNoteContentError(`attribute "${key}" has too many items`);
      }

      attributes[key] = raw.map((item: unknown): string | number => {
        if (typeof item === "number" && Number.isFinite(item)) {
          return item;
        }

        if (typeof item === "string") {
          return stripHtmlTags(item);
        }

        throw new InvalidNoteContentError(`attribute "${key}" contains an unsupported value`);
      });
      continue;
    }

    throw new InvalidNoteContentError(`attribute "${key}" has an unsupported value`);
  }

  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

function sanitizeMarks(value: unknown): TiptapMark[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new InvalidNoteContentError("marks must be an array");
  }

  const marks: TiptapMark[] = value.map((raw: unknown): TiptapMark => {
    if (!isPlainObject(raw) || typeof raw.type !== "string" || !IDENTIFIER_PATTERN.test(raw.type)) {
      throw new InvalidNoteContentError("every mark needs a valid type");
    }

    const attrs: Record<string, TiptapAttributeValue> | undefined = sanitizeAttributes(raw.attrs);

    return attrs ? { type: raw.type, attrs } : { type: raw.type };
  });

  return marks.length > 0 ? marks : undefined;
}

function sanitizeNode(value: unknown, depth: number, budget: SanitizeBudget): TiptapNode | undefined {
  if (depth > TIPTAP_MAX_DEPTH) {
    throw new InvalidNoteContentError("the document is nested too deeply");
  }

  if (!isPlainObject(value) || typeof value.type !== "string" || !IDENTIFIER_PATTERN.test(value.type)) {
    throw new InvalidNoteContentError("every node needs a valid type");
  }

  budget.nodes += 1;

  if (budget.nodes > TIPTAP_MAX_NODES) {
    throw new InvalidNoteContentError("the document has too many nodes");
  }

  const node: TiptapNode = { type: value.type };

  if (value.type === TEXT_NODE_TYPE) {
    if (typeof value.text !== "string") {
      throw new InvalidNoteContentError("text nodes need a text string");
    }

    if (value.content !== undefined) {
      throw new InvalidNoteContentError("text nodes cannot have content");
    }

    const text: string = stripHtmlTags(value.text);

    budget.textLength += text.length;

    if (budget.textLength > TIPTAP_MAX_TEXT_LENGTH) {
      throw new InvalidNoteContentError("the document text is too long");
    }

    if (text.length === 0) {
      return undefined;
    }

    node.text = text;
  } else if (value.text !== undefined) {
    throw new InvalidNoteContentError("only text nodes can have text");
  }

  const attrs: Record<string, TiptapAttributeValue> | undefined = sanitizeAttributes(value.attrs);
  const marks: TiptapMark[] | undefined = sanitizeMarks(value.marks);

  if (attrs) {
    node.attrs = attrs;
  }

  if (marks) {
    node.marks = marks;
  }

  if (value.content !== undefined && value.content !== null) {
    node.content = sanitizeChildren(value.content, depth + 1, budget);
  }

  return node;
}

function sanitizeChildren(value: unknown, depth: number, budget: SanitizeBudget): TiptapNode[] {
  if (!Array.isArray(value)) {
    throw new InvalidNoteContentError("content must be an array");
  }

  const children: TiptapNode[] = [];

  for (const raw of value) {
    const child: TiptapNode | undefined = sanitizeNode(raw, depth, budget);

    if (child) {
      children.push(child);
    }
  }

  return children;
}

export function sanitizeTiptapDocument(value: unknown): TiptapDocument {
  if (!isPlainObject(value) || value.type !== DOCUMENT_TYPE) {
    throw new InvalidNoteContentError("the root node must be a doc");
  }

  const budget: SanitizeBudget = { nodes: 0, textLength: 0 };
  const content: TiptapNode[] = value.content === undefined || value.content === null ? [] : sanitizeChildren(value.content, 1, budget);

  return { type: "doc", content };
}

function renderNode(node: TiptapNode): string {
  if (node.type === TEXT_NODE_TYPE) {
    return node.text ?? "";
  }

  if (node.type === HARD_BREAK_NODE_TYPE) {
    return "\n";
  }

  const children: TiptapNode[] = node.content ?? [];
  const isInline: boolean = children.some((child: TiptapNode) => child.type === TEXT_NODE_TYPE || child.type === HARD_BREAK_NODE_TYPE);
  const rendered: string = children.map((child: TiptapNode) => renderNode(child)).join(isInline ? "" : "\n");

  return LIST_ITEM_NODE_TYPES.includes(node.type) ? `- ${rendered}` : rendered;
}

export function tiptapToPlainText(document: TiptapDocument): string {
  return document.content
    .map((node: TiptapNode) => renderNode(node))
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
