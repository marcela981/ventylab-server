/*
 * Funcionalidad: Lector del contenido del currículo en disco
 * Descripción: Ubica la carpeta prisma/curriculum/content del repositorio y lee el markdown de cada lección (<módulo>/<lección>.md) para el constructor del plan; devuelve null si el archivo no existe. Depende de node:fs y node:path
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { type LessonSourceReader } from "@/features/curriculum/infrastructure/content-import/curriculum-plan.builder";

/** `<repo>/prisma/curriculum/content` (this file lives in `<repo>/src/features/curriculum/infrastructure/content-import`). */
export const DEFAULT_CURRICULUM_CONTENT_DIR: string = resolve(__dirname, "..", "..", "..", "..", "..", "prisma", "curriculum", "content");

export function fileLessonSourceReader(contentDir: string = DEFAULT_CURRICULUM_CONTENT_DIR): LessonSourceReader {
  return (moduleKey: string, lessonSlug: string): string | null => {
    const path: string = join(contentDir, moduleKey, `${lessonSlug}.md`);

    return existsSync(path) ? readFileSync(path, "utf8") : null;
  };
}
