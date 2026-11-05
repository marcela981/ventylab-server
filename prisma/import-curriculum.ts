/*
 * Funcionalidad: Comando de importación del currículo
 * Descripción: CLI idempotente que importa el currículo de prisma/curriculum/content según el manifiesto (src/features/curriculum/infrastructure/content-import). Por defecto solo simula e imprime el informe; --apply escribe en una transacción (exige --author <correo> de un usuario existente); --foreign-pages keep|archive decide qué hacer con las páginas del editor que no pertenecen a la importación; --print-ids imprime la tabla de ids del currículo en Markdown. Contra una base que no es local exige además --confirm-backup (pg_dump previo, ver docs/cierre/importacion-curriculo.md)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 *
 * Run: npx tsx prisma/import-curriculum.ts [--apply --author <email>] [--foreign-pages keep|archive] [--print-ids]
 */
import { PrismaClient } from "@prisma/client";

import { lessonId, moduleId } from "../src/features/curriculum/infrastructure/content-import/curriculum-ids";
import { CURRICULUM_MANIFEST } from "../src/features/curriculum/infrastructure/content-import/curriculum.manifest";
import { DEFAULT_CURRICULUM_CONTENT_DIR, fileLessonSourceReader } from "../src/features/curriculum/infrastructure/content-import/curriculum-content.reader";
import { buildCurriculumPlan, type CurriculumPlan } from "../src/features/curriculum/infrastructure/content-import/curriculum-plan.builder";
import { type ForeignPagesPolicy, importCurriculum, type ImportReport } from "../src/features/curriculum/infrastructure/content-import/curriculum.importer";

function argValue(name: string): string | undefined {
  const index: number = process.argv.indexOf(name);

  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function printIds(): void {
  for (const level of CURRICULUM_MANIFEST.levels) {
    console.log(`\n### ${level.track} · ${level.title} (\`${level.id}\`)\n`);
    console.log("| # | Módulo (id) | Clave | Título | Lecciones (id — título) |\n|---|---|---|---|---|");
    level.modules.forEach((entry, index) => {
      const lessons: string = entry.lessons.map((lesson) => `\`${lessonId(entry.key, lesson)}\` — ${lesson.title}`).join("<br>");

      console.log(`| ${index + 1} | \`${moduleId(entry)}\` | \`${entry.key}\` | ${entry.title} | ${lessons} |`);
    });
  }
}

function isLocalDatabase(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    return ["localhost", "127.0.0.1", "::1", "postgres"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

function printReport(report: ImportReport): void {
  console.log(report.applied ? "\nImport APPLIED." : "\nDry run (nothing written). Use --apply --author <email> to write.");
  console.table(report.counts);

  if (report.foreignPages.length > 0) {
    console.log(`\nPages not owned by the import inside managed modules (${report.foreignPages.length}); policy decides keep or archive:`);
    console.table(report.foreignPages);
  }

  if (report.foreignLessons.length > 0) {
    console.log(`\nLessons not in the manifest inside managed modules (${report.foreignLessons.length}), left untouched:`);
    console.table(report.foreignLessons);
  }
}

async function main(): Promise<void> {
  if (hasFlag("--print-ids")) {
    printIds();

    return;
  }

  const apply: boolean = hasFlag("--apply");
  const foreignPages: string = argValue("--foreign-pages") ?? "keep";

  if (foreignPages !== "keep" && foreignPages !== "archive") {
    throw new Error("--foreign-pages must be keep or archive");
  }

  if (apply && !isLocalDatabase(process.env.DATABASE_URL) && !hasFlag("--confirm-backup")) {
    throw new Error("Refusing to write to a non-local database without --confirm-backup (take a pg_dump first: docs/cierre/importacion-curriculo.md)");
  }

  const plan: CurriculumPlan = buildCurriculumPlan(CURRICULUM_MANIFEST, fileLessonSourceReader(argValue("--content-dir") ?? DEFAULT_CURRICULUM_CONTENT_DIR));

  console.log(`Curriculum: ${plan.levels.length} levels, ${plan.modules.length} modules, ${plan.lessons.length} lessons, ${plan.pages.length} pages.`);

  if (plan.issues.length > 0) {
    console.error(`\n${plan.issues.length} content problems:\n${plan.issues.join("\n")}`);
    process.exitCode = 1;

    return;
  }

  const prisma: PrismaClient = new PrismaClient();

  try {
    let authorId: string | null = null;
    const authorEmail: string | undefined = argValue("--author");

    if (authorEmail) {
      const author: { id: string } | null = await prisma.user.findUnique({ where: { email: authorEmail }, select: { id: true } });

      if (!author) {
        throw new Error(`No user with email ${authorEmail}`);
      }

      authorId = author.id;
    } else if (apply) {
      throw new Error("--apply needs --author <email> (createdBy of the pages)");
    }

    printReport(await importCurriculum(prisma, plan, { apply, authorId, foreignPages: foreignPages as ForeignPagesPolicy, now: new Date() }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
