/*
 * Funcionalidad: Servicio de dominio lesson-content
 * Descripción: Reúne las funciones y constantes calculatePageCount, isValidLessonContent, serializeLessonContent de la feature de lecciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const EXCLUDED_SECTION_TYPES: ReadonlySet<string> = new Set([
  "intro",
  "introduction",
  "completion",
  "complete",
  "conditional",
  "navigation",
  "redirect",
  "summary",
]);

function parseContent(content: unknown): unknown {
  return typeof content === "string" ? JSON.parse(content) : content;
}

function getSections(parsed: unknown): unknown[] | undefined {
  if (!parsed || typeof parsed !== "object") {
    return undefined;
  }

  const sections: unknown = (parsed as { sections?: unknown }).sections;

  return Array.isArray(sections) ? sections : undefined;
}

export function calculatePageCount(content: unknown): number {
  try {
    const sections: unknown[] | undefined = getSections(parseContent(content));

    if (!sections) {
      return 0;
    }

    return sections.filter((section: unknown) => {
      const type: unknown = section && typeof section === "object" ? (section as { type?: unknown }).type : undefined;

      if (!type) {
        return true;
      }

      const label: string = typeof type === "string" ? type : JSON.stringify(type);

      return !EXCLUDED_SECTION_TYPES.has(label.toLowerCase());
    }).length;
  } catch (_error: unknown) {
    return 0;
  }
}

export function isValidLessonContent(content: unknown): boolean {
  try {
    const parsed: unknown = parseContent(content);
    const sections: unknown[] | undefined = getSections(parsed);
    const type: unknown = parsed && typeof parsed === "object" ? (parsed as { type?: unknown }).type : undefined;

    return Boolean(type) && sections !== undefined && sections.length > 0;
  } catch (_error: unknown) {
    return false;
  }
}

export function serializeLessonContent(content: unknown): string {
  return typeof content === "string" ? content : JSON.stringify(content);
}
