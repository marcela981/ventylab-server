/*
 * Funcionalidad: Texto plano de páginas para el tutor
 * Descripción: Convierte las secciones de una página (documentos TipTap, markdown/HTML, leyendas, ecuaciones y código) en texto plano para el contexto del tutor, reutilizando el renderizador TipTap y el limpiador de etiquetas de la feature de notas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { sanitizeTiptapDocument, stripHtmlTags, tiptapToPlainText } from "@/features/notes/domain/services/tiptap-document";

export interface PageTextSection {
  readonly title?: string;
  readonly content: unknown;
}

const MARKUP_FIELDS: readonly string[] = ["markdown", "html"];

const TEXT_FIELDS: readonly string[] = ["text", "caption", "alt", "latex", "code"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collapse(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function richTextToPlainText(doc: unknown): string {
  try {
    return tiptapToPlainText(sanitizeTiptapDocument(doc));
  } catch {
    return "";
  }
}

function sectionContentToPlainText(content: unknown): string[] {
  if (typeof content === "string") {
    return [collapse(stripHtmlTags(content))];
  }

  if (!isPlainObject(content)) {
    return [];
  }

  const parts: string[] = [];

  if (content.doc !== undefined) {
    parts.push(richTextToPlainText(content.doc));
  }

  for (const field of MARKUP_FIELDS) {
    const value: unknown = content[field];

    if (typeof value === "string") {
      parts.push(collapse(stripHtmlTags(value)));
    }
  }

  for (const field of TEXT_FIELDS) {
    const value: unknown = content[field];

    if (typeof value === "string") {
      parts.push(collapse(value));
    }
  }

  return parts;
}

export function pageSectionsToPlainText(sections: readonly PageTextSection[]): string {
  return sections
    .map((section: PageTextSection) =>
      [section.title?.trim() ?? "", ...sectionContentToPlainText(section.content)].filter((part: string) => part.length > 0).join("\n"),
    )
    .filter((text: string) => text.length > 0)
    .join("\n\n");
}
