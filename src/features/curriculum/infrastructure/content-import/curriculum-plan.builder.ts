/*
 * Funcionalidad: Plan deseado del currículo importable
 * Descripción: A partir del manifiesto y del markdown de cada lección construye las filas deseadas de niveles, módulos, lecciones, páginas (con sus bloques y un hash del contenido para versionar solo lo que cambió) y prerrequisitos, con ids deterministas; reúne los problemas de análisis y de validación editorial por lección. Función pura: la lectura de archivos se inyecta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHash } from "node:crypto";

import { lessonId, moduleId, pageId } from "@/features/curriculum/infrastructure/content-import/curriculum-ids";
import {
  type CurriculumManifest,
  type CurriculumTrack,
  type LessonEntry,
  type LevelEntry,
  type ModuleDifficulty,
  type ModuleEntry,
} from "@/features/curriculum/infrastructure/content-import/curriculum.manifest";
import { validateLessonContent } from "@/features/curriculum/infrastructure/content-import/lesson-content.validator";
import {
  blockContent,
  type LessonPageType,
  LessonParseError,
  type ParsedBlock,
  type ParsedPage,
  parseLessonMarkdown,
} from "@/features/curriculum/infrastructure/content-import/lesson-markdown.parser";

export type PageDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface DesiredLevel {
  readonly id: string;
  readonly title: string;
  readonly track: CurriculumTrack;
  readonly description: string;
  readonly order: number;
}

export interface DesiredModule {
  readonly id: string;
  readonly key: string;
  readonly levelId: string;
  readonly title: string;
  readonly description: string;
  readonly difficulty: ModuleDifficulty;
  readonly order: number;
  readonly estimatedTime: number;
}

export interface DesiredLesson {
  readonly id: string;
  readonly moduleId: string;
  readonly title: string;
  readonly slug: string;
  readonly order: number;
  readonly estimatedTime: number;
}

export interface DesiredSection {
  readonly order: number;
  readonly type: ParsedBlock["type"];
  readonly title: string | null;
  readonly content: Record<string, unknown>;
}

export interface DesiredPage {
  readonly id: string;
  readonly moduleId: string;
  readonly lessonId: string;
  readonly slug: string;
  readonly title: string;
  readonly type: LessonPageType;
  readonly order: number;
  readonly difficulty: PageDifficulty;
  readonly estimatedMinutes: number;
  readonly learningObjectives: readonly string[];
  readonly keyTakeaways: readonly string[];
  readonly sections: readonly DesiredSection[];
  readonly contentHash: string;
}

export interface DesiredPrerequisite {
  readonly dependentId: string;
  readonly prerequisiteId: string;
}

export interface CurriculumPlan {
  readonly levels: readonly DesiredLevel[];
  readonly modules: readonly DesiredModule[];
  readonly lessons: readonly DesiredLesson[];
  readonly pages: readonly DesiredPage[];
  readonly modulePrerequisites: readonly DesiredPrerequisite[];
  readonly levelPrerequisites: readonly DesiredPrerequisite[];
  readonly retiredModuleIds: readonly string[];
  readonly retiredLessonIds: readonly string[];
  /** `<module>/<lesson>: <problem>`; the importer refuses to write while this is not empty. */
  readonly issues: readonly string[];
}

/** Returns the markdown of a lesson, or null when the file does not exist. */
export type LessonSourceReader = (moduleKey: string, lessonSlug: string) => string | null;

const PAGE_DIFFICULTY: Record<ModuleDifficulty, PageDifficulty> = {
  prerequisitos: "BEGINNER",
  beginner: "BEGINNER",
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
};

const BULLET: RegExp = /^\s*[-*]\s+(.*)$/;

/** JSON with sorted object keys: PostgreSQL jsonb does not keep the key order, so hashes must not depend on it. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    const record: Record<string, unknown> = value as Record<string, unknown>;

    return `{${Object.keys(record)
      .filter((key: string): boolean => record[key] !== undefined)
      .sort()
      .map((key: string): string => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
}

export function hashPageContent(title: string, type: string, sections: readonly DesiredSection[]): string {
  return createHash("sha256").update(canonicalJson({ title, type, sections })).digest("hex");
}

function keyTakeaways(pages: readonly ParsedPage[]): string[] {
  return pages
    .flatMap((page: ParsedPage): readonly ParsedBlock[] => page.blocks)
    .filter((block: ParsedBlock): boolean => block.type === "SUMMARY")
    .flatMap((block: ParsedBlock): string[] => block.body.split("\n").flatMap((line: string): string[] => {
      const match: RegExpExecArray | null = BULLET.exec(line);

      return match?.[1] ? [match[1].replace(/\*\*/g, "").trim()] : [];
    }));
}

function sectionsOf(page: ParsedPage): DesiredSection[] {
  return page.blocks.map((block: ParsedBlock, index: number): DesiredSection => ({ order: index + 1, type: block.type, title: block.title, content: blockContent(block) }));
}

interface ModuleBuild {
  readonly lessons: DesiredLesson[];
  readonly pages: DesiredPage[];
  readonly issues: string[];
  readonly estimatedTime: number;
}

function buildModule(level: LevelEntry, entry: ModuleEntry, read: LessonSourceReader): ModuleBuild {
  const id: string = moduleId(entry);
  const lessons: DesiredLesson[] = [];
  const pages: DesiredPage[] = [];
  const issues: string[] = [];
  const pageSlugs: Set<string> = new Set<string>();
  let estimatedTime: number = 0;

  entry.lessons.forEach((lesson: LessonEntry, lessonIndex: number): void => {
    const currentLessonId: string = lessonId(entry.key, lesson);
    const where: string = `${entry.key}/${lesson.slug}`;

    lessons.push({ id: currentLessonId, moduleId: id, title: lesson.title, slug: lesson.slug, order: lessonIndex + 1, estimatedTime: lesson.estimatedMinutes });
    estimatedTime += lesson.estimatedMinutes;

    const source: string | null = read(entry.key, lesson.slug);

    if (source === null) {
      issues.push(`${where}: content file is missing`);

      return;
    }

    let parsed: ParsedPage[];

    try {
      parsed = parseLessonMarkdown(source);
    } catch (error: unknown) {
      issues.push(`${where}: ${error instanceof LessonParseError ? error.message : String(error)}`);

      return;
    }

    issues.push(...validateLessonContent(parsed, { clinical: level.track === "mecanica" }).map((issue: string): string => `${where}: ${issue}`));

    const takeaways: string[] = keyTakeaways(parsed);
    const minutesPerPage: number = Math.max(1, Math.round(lesson.estimatedMinutes / parsed.length));

    for (const page of parsed) {
      const slug: string = `${lesson.slug}-${page.slug}`;

      if (pageSlugs.has(slug)) {
        issues.push(`${where}: page slug "${slug}" collides inside the module`);
      }

      pageSlugs.add(slug);

      const sections: DesiredSection[] = sectionsOf(page);

      pages.push({
        id: pageId(entry.key, lesson.slug, page.slug),
        moduleId: id,
        lessonId: currentLessonId,
        slug,
        title: page.title,
        type: page.type,
        order: pages.length + 1,
        difficulty: PAGE_DIFFICULTY[level.difficulty],
        estimatedMinutes: minutesPerPage,
        learningObjectives: lesson.objectives,
        keyTakeaways: takeaways,
        sections,
        contentHash: hashPageContent(page.title, page.type, sections),
      });
    }
  });

  return { lessons, pages, issues, estimatedTime };
}

function manifestIssues(manifest: CurriculumManifest): string[] {
  const issues: string[] = [];
  const moduleIds: Set<string> = new Set<string>();
  const lessonIds: Set<string> = new Set<string>();
  const levelTitles: Set<string> = new Set<string>();

  for (const level of manifest.levels) {
    if (levelTitles.has(level.title)) {
      issues.push(`level title "${level.title}" is repeated`);
    }

    levelTitles.add(level.title);

    for (const entry of level.modules) {
      const id: string = moduleId(entry);

      if (moduleIds.has(id) || manifest.retiredModuleIds.includes(id)) {
        issues.push(`module id "${id}" is repeated or also retired`);
      }

      moduleIds.add(id);

      const slugs: Set<string> = new Set<string>();

      for (const lesson of entry.lessons) {
        const currentLessonId: string = lessonId(entry.key, lesson);

        if (slugs.has(lesson.slug)) {
          issues.push(`${entry.key}: lesson slug "${lesson.slug}" is repeated`);
        }

        if (lessonIds.has(currentLessonId) || manifest.retiredLessonIds.includes(currentLessonId)) {
          issues.push(`${entry.key}: lesson id "${currentLessonId}" is repeated or also retired`);
        }

        slugs.add(lesson.slug);
        lessonIds.add(currentLessonId);
      }
    }
  }

  return issues;
}

export function buildCurriculumPlan(manifest: CurriculumManifest, read: LessonSourceReader): CurriculumPlan {
  const levels: DesiredLevel[] = [];
  const modules: DesiredModule[] = [];
  const lessons: DesiredLesson[] = [];
  const pages: DesiredPage[] = [];
  const modulePrerequisites: DesiredPrerequisite[] = [];
  const levelPrerequisites: DesiredPrerequisite[] = [];
  const issues: string[] = manifestIssues(manifest);

  for (const level of manifest.levels) {
    levels.push({ id: level.id, title: level.title, track: level.track, description: level.description, order: level.order });

    if (level.prerequisiteLevelId) {
      levelPrerequisites.push({ dependentId: level.id, prerequisiteId: level.prerequisiteLevelId });
    }

    level.modules.forEach((entry: ModuleEntry, index: number): void => {
      const built: ModuleBuild = buildModule(level, entry, read);
      const id: string = moduleId(entry);

      modules.push({ id, key: entry.key, levelId: level.id, title: entry.title, description: entry.description, difficulty: level.difficulty, order: index + 1, estimatedTime: built.estimatedTime });
      lessons.push(...built.lessons);
      pages.push(...built.pages);
      issues.push(...built.issues);

      const previous: ModuleEntry | undefined = index > 0 ? level.modules[index - 1] : undefined;

      if (level.sequentialModules && previous) {
        modulePrerequisites.push({ dependentId: id, prerequisiteId: moduleId(previous) });
      }
    });
  }

  return {
    levels,
    modules,
    lessons,
    pages,
    modulePrerequisites,
    levelPrerequisites,
    retiredModuleIds: manifest.retiredModuleIds,
    retiredLessonIds: manifest.retiredLessonIds,
    issues,
  };
}
