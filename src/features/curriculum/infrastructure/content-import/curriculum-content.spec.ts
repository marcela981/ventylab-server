/*
 * Funcionalidad: Pruebas del contenido real del currículo
 * Descripción: Cada lección del manifiesto tiene su archivo en prisma/curriculum/content, se analiza sin errores y cumple las reglas editoriales (páginas, puntos clave, errores frecuentes, referencias, diagramas, ejemplo clínico y enlaces al catálogo); no quedan archivos de lección fuera del manifiesto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Dirent, readdirSync } from "node:fs";
import { join } from "node:path";

import { DEFAULT_CURRICULUM_CONTENT_DIR, fileLessonSourceReader } from "@/features/curriculum/infrastructure/content-import/curriculum-content.reader";
import { buildCurriculumPlan, type CurriculumPlan, type DesiredLesson } from "@/features/curriculum/infrastructure/content-import/curriculum-plan.builder";
import { CURRICULUM_MANIFEST, type LessonEntry, type LevelEntry, type ModuleEntry } from "@/features/curriculum/infrastructure/content-import/curriculum.manifest";

describe("curriculum content files", () => {
  const plan: CurriculumPlan = buildCurriculumPlan(CURRICULUM_MANIFEST, fileLessonSourceReader());

  it("parse and pass the editorial rules", () => {
    expect(plan.issues).toEqual([]);
  });

  it("cover every lesson of the manifest with at least three pages", () => {
    const pagesPerLesson: Map<string, number> = new Map();

    for (const page of plan.pages) {
      pagesPerLesson.set(page.lessonId, (pagesPerLesson.get(page.lessonId) ?? 0) + 1);
    }

    expect(plan.lessons.filter((lesson: DesiredLesson): boolean => (pagesPerLesson.get(lesson.id) ?? 0) < 3).map((lesson: DesiredLesson): string => lesson.id)).toEqual([]);
  });

  it("has no lesson file outside the manifest", () => {
    const expected: Set<string> = new Set(CURRICULUM_MANIFEST.levels.flatMap((level: LevelEntry) => level.modules.flatMap((entry: ModuleEntry) => entry.lessons.map((lesson: LessonEntry): string => `${entry.key}/${lesson.slug}.md`))));
    const files: string[] = readdirSync(DEFAULT_CURRICULUM_CONTENT_DIR, { withFileTypes: true })
      .filter((entry: Dirent): boolean => entry.isDirectory())
      .flatMap((entry: Dirent): string[] => readdirSync(join(DEFAULT_CURRICULUM_CONTENT_DIR, entry.name)).filter((name: string) => name.endsWith(".md")).map((name: string) => `${entry.name}/${name}`));

    expect(files.filter((file: string) => !expected.has(file))).toEqual([]);
  });
});
