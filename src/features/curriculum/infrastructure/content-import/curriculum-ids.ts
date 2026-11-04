/*
 * Funcionalidad: Identificadores deterministas del currículo importable
 * Descripción: Deriva los ids de los módulos, lecciones, páginas, bloques y revisiones del currículo con el mismo algoritmo que la semilla de demostración (SHA-256 de un nombre estable con forma de UUID versión 5) bajo el espacio de nombres ventylab-curriculum, y resuelve los ids de módulos y lecciones de julio que se conservan, para que la importación sea idempotente y otros bloques (evaluaciones) puedan referenciar los ids de antemano
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHash } from "node:crypto";

import { type LessonEntry, type ModuleEntry } from "@/features/curriculum/infrastructure/content-import/curriculum.manifest";

const NAMESPACE: string = "ventylab-curriculum";

/** Same shape as the demo seed's demoId (prisma/demo/demo-support.ts), under its own namespace. */
export function curriculumId(name: string): string {
  const hex: string = createHash("sha256").update(`${NAMESPACE}:${name}`).digest("hex");
  const variant: string = ((Number.parseInt(hex.charAt(16), 16) & 0x3) | 0x8).toString(16);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function moduleId(entry: ModuleEntry): string {
  return entry.legacy ? entry.key : curriculumId(`module:${entry.key}`);
}

export function lessonId(moduleKey: string, entry: LessonEntry): string {
  return entry.legacyId ?? curriculumId(`lesson:${moduleKey}/${entry.slug}`);
}

export function pageId(moduleKey: string, lessonSlug: string, pageSlug: string): string {
  return curriculumId(`page:${moduleKey}/${lessonSlug}/${pageSlug}`);
}

export function pageSectionId(pageIdValue: string, order: number): string {
  return curriculumId(`page-section:${pageIdValue}:${order}`);
}

export function pageRevisionId(pageIdValue: string, version: number): string {
  return curriculumId(`page-revision:${pageIdValue}:${version}`);
}
