/*
 * Funcionalidad: Pruebas del validador del contenido de lecciones
 * Descripción: Una lección completa no tiene problemas; se informan el número de páginas fuera de rango, los bloques obligatorios que faltan, la falta de diagrama y de ejemplo clínico en lecciones clínicas, imágenes fuera de /learning/diagrams o sin texto alternativo, enlaces al simulador con casos desconocidos y HTML crudo (sin confundirlo con fórmulas ni código)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { simulatorCaseIds, validateLessonContent } from "@/features/curriculum/infrastructure/content-import/lesson-content.validator";
import { type ParsedPage, parseLessonMarkdown } from "@/features/curriculum/infrastructure/content-import/lesson-markdown.parser";

function lesson(extra: string = "", diagram: string = "![Curva presión-volumen](/learning/diagrams/b2-curva-pv.svg \"Figura: curva\")"): string {
  return [
    "<!-- page: conceptos | THEORY | Conceptos -->",
    "<!-- block: THEORY | Concepto -->",
    `Texto con $a<b$ y \`<code>\`. ${diagram}`,
    "<!-- page: caso | CASE_STUDY | Caso -->",
    "<!-- block: CASE_STUDY | Ejemplo clínico -->",
    "Paciente de 60 años.",
    "<!-- block: CALLOUT:tip | Practícalo en el simulador -->",
    "Abre [el caso](/simulador?tab=simular&case=engine-ards-obese).",
    extra,
    "<!-- page: sintesis | THEORY | Síntesis -->",
    "<!-- block: SUMMARY | Puntos clave -->",
    "- Uno.",
    "<!-- block: CALLOUT:warning | Errores frecuentes -->",
    "- Error.",
    "<!-- block: REFERENCES | Referencias -->",
    "- West, J. B. (2021).",
  ].join("\n");
}

function validate(source: string, clinical: boolean = true): string[] {
  return validateLessonContent(parseLessonMarkdown(source), { clinical });
}

describe("validateLessonContent", () => {
  it("accepts a complete clinical lesson", () => {
    expect(validate(lesson())).toEqual([]);
  });

  it("reports the page count out of range", () => {
    const pages: ParsedPage[] = parseLessonMarkdown(lesson());

    expect(validateLessonContent(pages.slice(0, 2), { clinical: false })).toContain("has 2 pages (expected 3-6)");
  });

  it("reports the missing required blocks", () => {
    const source: string = lesson().replace("SUMMARY", "THEORY").replace("CALLOUT:warning", "CALLOUT:info").replace("REFERENCES", "THEORY");

    expect(validate(source)).toEqual(
      expect.arrayContaining(["missing SUMMARY block (Puntos clave)", "missing CALLOUT:warning block (Errores frecuentes)", "missing REFERENCES block"]),
    );
  });

  it("requires a diagram and a clinical example only in clinical lessons", () => {
    const source: string = lesson("", "").replace("CASE_STUDY | Ejemplo", "THEORY | Ejemplo");

    expect(validate(source)).toEqual(["clinical lesson without a diagram", "clinical lesson without a CASE_STUDY block (Ejemplo clínico)"]);
    expect(validate(source, false)).toEqual([]);
  });

  it("only accepts diagrams from /learning/diagrams with alt text", () => {
    const issues: string[] = validate(lesson("![](/learning/diagrams/b2-otra.svg) ![Foto](https://example.com/x.png)"));

    expect(issues).toEqual([expect.stringContaining("has no alt text"), expect.stringContaining("is not a /learning/diagrams/<name>.svg file")]);
  });

  it("only links to catalog cases", () => {
    const source: string = lesson("Y [otro](/simulador?tab=simular&case=caso-inventado) y [sin caso](/simulador?tab=simular).");

    expect(simulatorCaseIds(parseLessonMarkdown(source))).toEqual(["engine-ards-obese", "caso-inventado", null]);
    expect(validate(source)).toEqual(["simulator link with unknown case \"caso-inventado\"", "simulator link with unknown case \"\""]);
  });

  it("reports raw HTML outside math and code", () => {
    expect(validate(lesson("<div>texto</div>"))).toEqual([expect.stringContaining("raw HTML")]);
  });
});
