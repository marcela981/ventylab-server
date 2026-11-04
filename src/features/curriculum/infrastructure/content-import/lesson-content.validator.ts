/*
 * Funcionalidad: Validador del contenido de lecciones
 * Descripción: Reglas editoriales mínimas de cada lección importada: entre 3 y 6 páginas, bloques de puntos clave (SUMMARY), errores frecuentes (CALLOUT warning) y referencias (REFERENCES); en las lecciones clínicas (track mecánica) al menos un diagrama SVG de /learning/diagrams/ y un ejemplo clínico (CASE_STUDY); enlaces "Practícalo en el simulador" solo a casos del catálogo de arranque; imágenes con texto alternativo y solo desde /learning/diagrams/; sin HTML crudo. Devuelve la lista de problemas (vacía si la lección es válida). Sin dependencias
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ParsedBlock, type ParsedPage } from "@/features/curriculum/infrastructure/content-import/lesson-markdown.parser";

export const MIN_PAGES_PER_LESSON: number = 3;
export const MAX_PAGES_PER_LESSON: number = 6;

/** Catalog cases inserted at startup in every environment (ClinicalCasesBootstrapService). */
export const SIMULATOR_CATALOG_CASE_IDS: readonly string[] = [
  "engine-normal-lung",
  "engine-copd-exacerbation",
  "engine-ards-obese",
  "engine-asthma-crisis",
  "july-neumonia-grave",
  "july-epoc-descompensado",
  "july-sdra-sepsis",
] as const;

export const DIAGRAM_PATH_PREFIX: string = "/learning/diagrams/";

const IMAGE: RegExp = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const DIAGRAM_FILE: RegExp = /^\/learning\/diagrams\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/;
const SIMULATOR_LINK: RegExp = /\]\((\/simulador\?[^)\s]*)\)/g;
const RAW_HTML: RegExp = /<\/?[a-zA-Z][^>]*>/;
const MAX_BLOCK_LENGTH: number = 100_000;

export interface LessonValidationContext {
  readonly clinical: boolean;
}

function allBlocks(pages: readonly ParsedPage[]): ParsedBlock[] {
  return pages.flatMap((page: ParsedPage): readonly ParsedBlock[] => page.blocks);
}

function hasBlock(blocks: readonly ParsedBlock[], type: string, variant: string | null = null): boolean {
  return blocks.some((block: ParsedBlock): boolean => block.type === type && (variant === null || block.variant === variant));
}

/** Image targets referenced by the lesson (markdown images). */
export function lessonImages(pages: readonly ParsedPage[]): { readonly alt: string; readonly src: string; readonly line: number }[] {
  return allBlocks(pages).flatMap((block: ParsedBlock) =>
    [...block.body.matchAll(IMAGE)].map((match: RegExpMatchArray) => ({ alt: (match[1] ?? "").trim(), src: match[2] ?? "", line: block.line })),
  );
}

/** Case ids of the "Practícalo en el simulador" links; null for a link without `case`. */
export function simulatorCaseIds(pages: readonly ParsedPage[]): (string | null)[] {
  return allBlocks(pages).flatMap((block: ParsedBlock) =>
    [...block.body.matchAll(SIMULATOR_LINK)].map((match: RegExpMatchArray): string | null => new URLSearchParams((match[1] ?? "").split("?")[1] ?? "").get("case")),
  );
}

function stripCode(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]*`/g, "")
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .replace(/\$[^$\n]*\$/g, "");
}

export function validateLessonContent(pages: readonly ParsedPage[], context: LessonValidationContext): string[] {
  const issues: string[] = [];
  const blocks: ParsedBlock[] = allBlocks(pages);

  if (pages.length < MIN_PAGES_PER_LESSON || pages.length > MAX_PAGES_PER_LESSON) {
    issues.push(`has ${pages.length} pages (expected ${MIN_PAGES_PER_LESSON}-${MAX_PAGES_PER_LESSON})`);
  }

  if (!hasBlock(blocks, "SUMMARY")) {
    issues.push("missing SUMMARY block (Puntos clave)");
  }

  if (!hasBlock(blocks, "CALLOUT", "warning")) {
    issues.push("missing CALLOUT:warning block (Errores frecuentes)");
  }

  if (!hasBlock(blocks, "REFERENCES")) {
    issues.push("missing REFERENCES block");
  }

  const images: { readonly alt: string; readonly src: string; readonly line: number }[] = lessonImages(pages);

  if (context.clinical) {
    if (images.length === 0) {
      issues.push("clinical lesson without a diagram");
    }

    if (!hasBlock(blocks, "CASE_STUDY")) {
      issues.push("clinical lesson without a CASE_STUDY block (Ejemplo clínico)");
    }
  }

  for (const image of images) {
    if (!DIAGRAM_FILE.test(image.src)) {
      issues.push(`line ${image.line}: image "${image.src}" is not a /learning/diagrams/<name>.svg file`);
    }

    if (image.alt === "") {
      issues.push(`line ${image.line}: image "${image.src}" has no alt text`);
    }
  }

  for (const caseId of simulatorCaseIds(pages)) {
    if (caseId === null || !SIMULATOR_CATALOG_CASE_IDS.includes(caseId)) {
      issues.push(`simulator link with unknown case "${caseId ?? ""}"`);
    }
  }

  for (const block of blocks) {
    if (block.body.length > MAX_BLOCK_LENGTH) {
      issues.push(`line ${block.line}: block longer than ${MAX_BLOCK_LENGTH} characters`);
    }

    if (block.type !== "EQUATION" && RAW_HTML.test(stripCode(block.body))) {
      issues.push(`line ${block.line}: raw HTML is not rendered (use Markdown)`);
    }
  }

  return issues;
}
