/*
 * Funcionalidad: Analizador del markdown de lecciones
 * Descripción: Convierte el archivo markdown de una lección (marcadores de página y de bloque en comentarios HTML: <!-- page: slug | TIPO | Título --> y <!-- block: TIPO[:variante] | Título -->) en páginas con sus bloques listos para PageSection.content ({markdown}, {markdown, variant}, {latex, display} o {}); informa el número de línea de cada error. Sin dependencias
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

export const LESSON_PAGE_TYPES: readonly string[] = ["THEORY", "EXERCISE", "CASE_STUDY", "SIMULATION"] as const;

export type LessonPageType = "THEORY" | "EXERCISE" | "CASE_STUDY" | "SIMULATION";

export const LESSON_BLOCK_TYPES: readonly string[] = ["INTRODUCTION", "THEORY", "CASE_STUDY", "EXERCISE", "SUMMARY", "CALLOUT", "REFERENCES", "EQUATION", "DIVIDER", "TEXT"] as const;

export type LessonBlockType = "INTRODUCTION" | "THEORY" | "CASE_STUDY" | "EXERCISE" | "SUMMARY" | "CALLOUT" | "REFERENCES" | "EQUATION" | "DIVIDER" | "TEXT";

export const CALLOUT_VARIANTS: readonly string[] = ["info", "tip", "success", "warning", "error"] as const;

export interface ParsedBlock {
  readonly type: LessonBlockType;
  readonly variant: string | null;
  readonly title: string | null;
  /** Markdown of rich text blocks, LaTeX of EQUATION blocks, empty for DIVIDER. */
  readonly body: string;
  readonly line: number;
}

export interface ParsedPage {
  readonly slug: string;
  readonly type: LessonPageType;
  readonly title: string;
  readonly blocks: readonly ParsedBlock[];
  readonly line: number;
}

export class LessonParseError extends Error {
  public readonly line: number;

  public constructor(line: number, message: string) {
    super(`line ${line}: ${message}`);
    this.name = "LessonParseError";
    this.line = line;
  }
}

const PAGE_MARKER: RegExp = /^<!--\s*page:\s*(.*?)\s*-->\s*$/;
const BLOCK_MARKER: RegExp = /^<!--\s*block:\s*(.*?)\s*-->\s*$/;
const SLUG: RegExp = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface DraftBlock {
  readonly type: LessonBlockType;
  readonly variant: string | null;
  readonly title: string | null;
  readonly line: number;
  readonly lines: string[];
}

interface DraftPage {
  readonly slug: string;
  readonly type: LessonPageType;
  readonly title: string;
  readonly line: number;
  readonly blocks: DraftBlock[];
}

function splitFields(raw: string): string[] {
  return raw.split("|").map((field: string): string => field.trim());
}

function parsePageMarker(raw: string, line: number): DraftPage {
  const [slug, type, ...rest] = splitFields(raw);
  const title: string = rest.join(" | ").trim();

  if (!slug || !SLUG.test(slug)) {
    throw new LessonParseError(line, `invalid page slug "${slug ?? ""}"`);
  }

  if (!type || !LESSON_PAGE_TYPES.includes(type)) {
    throw new LessonParseError(line, `invalid page type "${type ?? ""}"`);
  }

  if (title === "") {
    throw new LessonParseError(line, "page title is required");
  }

  return { slug, type: type as LessonPageType, title, line, blocks: [] };
}

function parseBlockMarker(raw: string, line: number): DraftBlock {
  const [typeField, ...rest] = splitFields(raw);
  const [type, variant] = (typeField ?? "").split(":").map((part: string): string => part.trim());
  const title: string = rest.join(" | ").trim();

  if (!type || !LESSON_BLOCK_TYPES.includes(type)) {
    throw new LessonParseError(line, `invalid block type "${typeField ?? ""}"`);
  }

  if (type === "CALLOUT" && (!variant || !CALLOUT_VARIANTS.includes(variant))) {
    throw new LessonParseError(line, `CALLOUT needs a variant (${CALLOUT_VARIANTS.join(", ")})`);
  }

  if (type !== "CALLOUT" && variant !== undefined) {
    throw new LessonParseError(line, `only CALLOUT takes a variant, got "${typeField ?? ""}"`);
  }

  if (type === "DIVIDER" && title !== "") {
    throw new LessonParseError(line, "DIVIDER takes no title");
  }

  return { type: type as LessonBlockType, variant: variant ?? null, title: title === "" ? null : title, line, lines: [] };
}

function finishBlock(block: DraftBlock): ParsedBlock {
  const body: string = block.lines.join("\n").trim();

  if (block.type === "DIVIDER") {
    if (body !== "") {
      throw new LessonParseError(block.line, "DIVIDER takes no content");
    }
  } else if (body === "") {
    throw new LessonParseError(block.line, `${block.type} block is empty`);
  }

  if (block.type === "EQUATION" && (body.startsWith("$") || body.endsWith("$"))) {
    throw new LessonParseError(block.line, "EQUATION content is raw LaTeX, without $ delimiters");
  }

  return { type: block.type, variant: block.variant, title: block.title, body, line: block.line };
}

function finishPage(page: DraftPage): ParsedPage {
  if (page.blocks.length === 0) {
    throw new LessonParseError(page.line, `page "${page.slug}" has no blocks`);
  }

  return { slug: page.slug, type: page.type, title: page.title, line: page.line, blocks: page.blocks.map(finishBlock) };
}

export function parseLessonMarkdown(source: string): ParsedPage[] {
  const lines: string[] = source.replace(/^\uFEFF/, "").split(/\r?\n/);
  const pages: DraftPage[] = [];
  let currentPage: DraftPage | undefined;
  let currentBlock: DraftBlock | undefined;

  lines.forEach((text: string, index: number): void => {
    const line: number = index + 1;
    const pageMatch: RegExpMatchArray | null = PAGE_MARKER.exec(text);

    if (pageMatch) {
      currentPage = parsePageMarker(pageMatch[1] ?? "", line);
      currentBlock = undefined;
      pages.push(currentPage);

      return;
    }

    const blockMatch: RegExpMatchArray | null = BLOCK_MARKER.exec(text);

    if (blockMatch) {
      if (!currentPage) {
        throw new LessonParseError(line, "block marker before the first page marker");
      }

      currentBlock = parseBlockMarker(blockMatch[1] ?? "", line);
      currentPage.blocks.push(currentBlock);

      return;
    }

    if (currentBlock) {
      currentBlock.lines.push(text);

      return;
    }

    if (text.trim() !== "") {
      throw new LessonParseError(line, currentPage ? "content before the first block marker of the page" : "content before the first page marker");
    }
  });

  if (pages.length === 0) {
    throw new LessonParseError(1, "the lesson has no pages");
  }

  const parsed: ParsedPage[] = pages.map(finishPage);
  const seen: Set<string> = new Set<string>();

  for (const page of parsed) {
    if (seen.has(page.slug)) {
      throw new LessonParseError(page.line, `duplicate page slug "${page.slug}"`);
    }

    seen.add(page.slug);
  }

  return parsed;
}

/** PageSection.content for a parsed block (the shapes the web renderer reads). */
export function blockContent(block: ParsedBlock): Record<string, unknown> {
  if (block.type === "EQUATION") {
    return { latex: block.body, display: true };
  }

  if (block.type === "DIVIDER") {
    return {};
  }

  return block.variant === null ? { markdown: block.body } : { markdown: block.body, variant: block.variant };
}
