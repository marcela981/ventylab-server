/*
 * Funcionalidad: Saneador HTML SanitizeHtmlSanitizer
 * Descripción: Implementa IHtmlSanitizer con la librería sanitize-html: lista blanca de etiquetas de formato, enlaces solo http, https y mailto, y eliminación total de etiquetas para texto plano de nodos Tiptap; conserva los caracteres de Markdown cuando decodificarlos no reintroduce marcado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import sanitizeHtml from "sanitize-html";

import { type IHtmlSanitizer } from "@/features/pages/application/ports/html-sanitizer.interface";

const ALLOWED_TAGS: string[] = [
  "p",
  "br",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "mark",
  "sub",
  "sup",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "span",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: { a: ["href", "title", "target", "rel"], span: ["class"], code: ["class"], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
};

const TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: "discard",
};

const ENTITY_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, "\""],
  [/&#39;/g, "'"],
  [/&amp;/g, "&"],
];

@Injectable()
export class SanitizeHtmlSanitizer implements IHtmlSanitizer {
  public sanitizeHtml(html: string): string {
    return this._sanitizePreservingText(html, HTML_OPTIONS);
  }

  public stripTags(text: string): string {
    return this._sanitizePreservingText(text, TEXT_OPTIONS);
  }

  private _sanitizePreservingText(input: string, options: sanitizeHtml.IOptions): string {
    const sanitized: string = sanitizeHtml(input, options);
    const decoded: string = ENTITY_REPLACEMENTS.reduce(
      (value: string, [pattern, replacement]: [RegExp, string]) => value.replace(pattern, replacement),
      sanitized,
    );

    // Entity-decoding keeps Markdown (">" quotes, "<" comparisons) intact; it is only accepted when it cannot smuggle markup back in.
    return sanitizeHtml(decoded, options) === sanitized ? decoded : sanitized;
  }
}
