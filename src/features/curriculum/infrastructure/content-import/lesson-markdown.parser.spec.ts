/*
 * Funcionalidad: Pruebas del analizador del markdown de lecciones
 * Descripción: Páginas y bloques con sus tipos, variantes y títulos; contenido de PageSection por tipo; errores con número de línea (marcadores inválidos, contenido fuera de bloque, bloques vacíos, slugs repetidos, ecuaciones con delimitadores)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { blockContent, LessonParseError, type ParsedBlock, type ParsedPage, parseLessonMarkdown } from "@/features/curriculum/infrastructure/content-import/lesson-markdown.parser";

const LESSON: string = [
  "<!-- page: conceptos | THEORY | Conceptos -->",
  "<!-- block: INTRODUCTION | Introducción -->",
  "La compliance mide la distensibilidad.",
  "",
  "<!-- block: EQUATION | Compliance estática -->",
  "C_{st} = \\frac{V_T}{P_{plat} - PEEP}",
  "<!-- page: sintesis | THEORY | Síntesis | resumen -->",
  "<!-- block: CALLOUT:warning | Errores frecuentes -->",
  "- Confundir pico y meseta.",
  "<!-- block: DIVIDER -->",
  "<!-- block: REFERENCES -->",
  "- West, J. B. (2021).",
].join("\n");

function parseError(source: string): LessonParseError {
  try {
    parseLessonMarkdown(source);
  } catch (error: unknown) {
    if (error instanceof LessonParseError) {
      return error;
    }
  }

  throw new Error("expected a LessonParseError");
}

describe("parseLessonMarkdown", () => {
  it("reads pages and blocks in order with their types, variants and titles", () => {
    const pages: ParsedPage[] = parseLessonMarkdown(LESSON);

    expect(pages.map((page: ParsedPage) => [page.slug, page.type, page.title])).toEqual([
      ["conceptos", "THEORY", "Conceptos"],
      ["sintesis", "THEORY", "Síntesis | resumen"],
    ]);
    expect(pages[1]?.blocks.map((block: ParsedBlock) => [block.type, block.variant, block.title])).toEqual([
      ["CALLOUT", "warning", "Errores frecuentes"],
      ["DIVIDER", null, null],
      ["REFERENCES", null, null],
    ]);
    expect(pages[0]?.blocks[0]?.body).toBe("La compliance mide la distensibilidad.");
  });

  it("builds the PageSection content the renderer reads", () => {
    const [first, second] = parseLessonMarkdown(LESSON);

    expect(blockContent(first.blocks[0])).toEqual({ markdown: "La compliance mide la distensibilidad." });
    expect(blockContent(first.blocks[1])).toEqual({ latex: "C_{st} = \\frac{V_T}{P_{plat} - PEEP}", display: true });
    expect(blockContent(second.blocks[0])).toEqual({ markdown: "- Confundir pico y meseta.", variant: "warning" });
    expect(blockContent(second.blocks[1])).toEqual({});
  });

  it("accepts CRLF line endings and a byte order mark", () => {
    expect(parseLessonMarkdown(`\uFEFF${LESSON.replace(/\n/g, "\r\n")}`)).toHaveLength(2);
  });

  it.each([
    ["content before the first page", "texto\n<!-- page: a | THEORY | A -->\n<!-- block: THEORY -->\nx", 1, "before the first page"],
    ["an invalid page type", "<!-- page: a | LECTURE | A -->", 1, "invalid page type"],
    ["an invalid page slug", "<!-- page: Página A | THEORY | A -->", 1, "invalid page slug"],
    ["a page without title", "<!-- page: a | THEORY -->", 1, "title is required"],
    ["a callout without variant", "<!-- page: a | THEORY | A -->\n<!-- block: CALLOUT | Nota -->\nx", 2, "needs a variant"],
    ["a variant on another type", "<!-- page: a | THEORY | A -->\n<!-- block: THEORY:tip -->\nx", 2, "only CALLOUT"],
    ["an empty block", "<!-- page: a | THEORY | A -->\n<!-- block: THEORY | T -->\n\n", 2, "is empty"],
    ["a page without blocks", "<!-- page: a | THEORY | A -->\n<!-- page: b | THEORY | B -->\n<!-- block: THEORY -->\nx", 1, "has no blocks"],
    ["text between a page and its first block", "<!-- page: a | THEORY | A -->\ntexto", 2, "before the first block"],
    ["a duplicate page slug", "<!-- page: a | THEORY | A -->\n<!-- block: THEORY -->\nx\n<!-- page: a | THEORY | B -->\n<!-- block: THEORY -->\ny", 4, "duplicate page slug"],
    ["an equation with dollar delimiters", "<!-- page: a | THEORY | A -->\n<!-- block: EQUATION -->\n$$x$$", 2, "without $"],
    ["content in a divider", "<!-- page: a | THEORY | A -->\n<!-- block: DIVIDER -->\nx", 2, "no content"],
  ])("rejects %s with its line number", (_name: string, source: string, line: number, message: string) => {
    const error: LessonParseError = parseError(source);

    expect(error.line).toBe(line);
    expect(error.message).toContain(message);
  });

  it("rejects an empty file", () => {
    expect(parseError("\n\n").message).toContain("no pages");
  });
});
