/*
 * Funcionalidad: Fábrica de contenido de prueba
 * Descripción: Crea con Prisma la jerarquía de contenido tal como la modela el esquema: sección → nivel → módulo → lección → página (con su módulo, lección opcional, autor y secciones de página) y pasos (tarjetas) de la lección, con títulos, slugs y órdenes únicos y estado PUBLISHED sobrescribible
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type ContentStatus,
  type Lesson,
  type Level,
  type Module,
  type Page,
  type PageSection,
  type Prisma,
  type PrismaClient,
  type Section,
  type Step,
  type User,
} from "@prisma/client";

import { nextSequence } from "./sequence";
import { createTeacher } from "./users.factory";

export interface ContentOverrides {
  readonly status?: ContentStatus;
  readonly title?: string;
  readonly order?: number;
}

export interface ContentTree {
  readonly section: Section;
  readonly level: Level;
  readonly module: Module;
  readonly lesson: Lesson;
  readonly page: Page;
  readonly pageSection: PageSection;
  readonly step: Step;
  readonly author: User;
}

function richText(text: string): Prisma.InputJsonValue {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

export async function createSection(prisma: PrismaClient, overrides: ContentOverrides = {}): Promise<Section> {
  const sequence: number = nextSequence();

  return await prisma.section.create({
    data: { slug: `test-section-${sequence}`, title: overrides.title ?? `Test section ${sequence}`, order: overrides.order ?? sequence, status: overrides.status ?? "PUBLISHED" },
  });
}

export async function createLevel(prisma: PrismaClient, section: Section, overrides: ContentOverrides = {}): Promise<Level> {
  const sequence: number = nextSequence();

  return await prisma.level.create({
    data: { title: overrides.title ?? `Test level ${sequence}`, track: section.slug, sectionId: section.id, order: overrides.order ?? sequence, status: overrides.status ?? "PUBLISHED" },
  });
}

export async function createModule(prisma: PrismaClient, level: Level, overrides: ContentOverrides = {}): Promise<Module> {
  const sequence: number = nextSequence();

  return await prisma.module.create({
    data: { title: overrides.title ?? `Test module ${sequence}`, levelId: level.id, order: overrides.order ?? sequence, status: overrides.status ?? "PUBLISHED" },
  });
}

export async function createLesson(prisma: PrismaClient, parentModule: Module, overrides: ContentOverrides = {}): Promise<Lesson> {
  const sequence: number = nextSequence();

  return await prisma.lesson.create({
    data: { moduleId: parentModule.id, title: overrides.title ?? `Test lesson ${sequence}`, slug: `test-lesson-${sequence}`, order: overrides.order ?? sequence, status: overrides.status ?? "PUBLISHED" },
  });
}

export async function createPage(prisma: PrismaClient, lesson: Lesson, author: User, overrides: ContentOverrides = {}): Promise<Page> {
  const sequence: number = nextSequence();
  const status: ContentStatus = overrides.status ?? "PUBLISHED";

  return await prisma.page.create({
    data: {
      moduleId: lesson.moduleId,
      lessonId: lesson.id,
      title: overrides.title ?? `Test page ${sequence}`,
      slug: `test-page-${sequence}`,
      order: overrides.order ?? sequence,
      status,
      isPublished: status === "PUBLISHED",
      createdBy: author.id,
    },
  });
}

export async function createPageSection(prisma: PrismaClient, page: Page, overrides: { readonly order?: number; readonly text?: string } = {}): Promise<PageSection> {
  const sequence: number = nextSequence();

  return await prisma.pageSection.create({
    data: { pageId: page.id, order: overrides.order ?? sequence, type: "TEXT", content: richText(overrides.text ?? `Test page section ${sequence}`) },
  });
}

export async function createStep(prisma: PrismaClient, lesson: Lesson, overrides: { readonly order?: number; readonly content?: string } = {}): Promise<Step> {
  const sequence: number = nextSequence();

  return await prisma.step.create({
    data: { lessonId: lesson.id, title: `Test step ${sequence}`, content: overrides.content ?? `Test step content ${sequence}`, order: overrides.order ?? sequence },
  });
}

export async function createContentTree(prisma: PrismaClient, options: { readonly status?: ContentStatus; readonly author?: User } = {}): Promise<ContentTree> {
  const author: User = options.author ?? await createTeacher(prisma);
  const overrides: ContentOverrides = { status: options.status };
  const section: Section = await createSection(prisma, overrides);
  const level: Level = await createLevel(prisma, section, overrides);
  const courseModule: Module = await createModule(prisma, level, overrides);
  const lesson: Lesson = await createLesson(prisma, courseModule, overrides);
  const page: Page = await createPage(prisma, lesson, author, overrides);
  const pageSection: PageSection = await createPageSection(prisma, page);
  const step: Step = await createStep(prisma, lesson);

  return { section, level, module: courseModule, lesson, page, pageSection, step, author };
}
