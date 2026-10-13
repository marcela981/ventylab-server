/*
 * Funcionalidad: Semilla de contenido de la demostración
 * Descripción: Restaura las secciones que siembra la migración (mecanica y ventylab) y publica una ruta completa dentro de la sección mecanica: un nivel, dos módulos, tres lecciones y seis páginas con bloques markdown y su revisión publicada; expone la estructura con IDs deterministas para el resto de la semilla
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PageType, type Prisma, type SectionType } from "@prisma/client";

import { DEMO_TEACHERS } from "../demo-cast";
import { type DemoContext, type DemoDb, demoId, upsertAll } from "../demo-support";

export interface DemoPage {
  readonly id: string;
  readonly lessonId: string;
  readonly moduleId: string;
  readonly order: number;
  readonly slug: string;
  readonly title: string;
  readonly type: PageType;
  readonly blocks: readonly DemoBlock[];
}

export interface DemoBlock {
  readonly type: SectionType;
  readonly title: string;
  readonly markdown: string;
}

export interface DemoLesson {
  readonly id: string;
  readonly moduleId: string;
  readonly order: number;
  readonly slug: string;
  readonly title: string;
  readonly pages: readonly DemoPage[];
}

export interface DemoModule {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly lessons: readonly DemoLesson[];
}

interface PageSeed {
  readonly slug: string;
  readonly title: string;
  readonly type: PageType;
  readonly blocks: readonly DemoBlock[];
}

interface LessonSeed {
  readonly slug: string;
  readonly title: string;
  readonly pages: readonly PageSeed[];
}

const MIGRATION_SECTIONS: readonly { readonly id: string; readonly slug: string; readonly title: string; readonly order: number }[] = [
  { id: "section-mecanica", slug: "mecanica", title: "Mecánica ventilatoria", order: 0 },
  { id: "section-ventylab", slug: "ventylab", title: "VentyLab", order: 1 },
];

const DEMO_SECTION_SLUG: string = "mecanica";

export const DEMO_LEVEL_ID: string = demoId("level:fundamentos");

function theory(title: string, markdown: string): DemoBlock {
  return { type: "THEORY", title, markdown };
}

function introduction(markdown: string): DemoBlock {
  return { type: "INTRODUCTION", title: "Introducción", markdown };
}

function summary(markdown: string): DemoBlock {
  return { type: "SUMMARY", title: "Resumen", markdown };
}

interface ModuleSeed {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly lessons: readonly LessonSeed[];
}

const MODULE_SEEDS: readonly ModuleSeed[] = [
  {
    key: "mecanica-aplicada",
    title: "Mecánica respiratoria aplicada",
    description: "Ecuación del movimiento, compliance y resistencia en el paciente ventilado.",
    lessons: [
      {
        slug: "ecuacion-del-movimiento",
        title: "La ecuación del movimiento",
        pages: [
          {
            slug: "componentes-de-la-presion",
            title: "Componentes de la presión en la vía aérea",
            type: "THEORY",
            blocks: [
              introduction("La presión que genera el ventilador vence dos cargas: la elástica y la resistiva."),
              theory("Ecuación", "**Paw = V/C + R·Flujo + PEEP**. Cada término representa una carga distinta del sistema respiratorio."),
            ],
          },
          {
            slug: "ejercicio-presion-meseta",
            title: "Ejercicio: presión meseta y presión pico",
            type: "EXERCISE",
            blocks: [
              theory("Planteamiento", "Con Vt 450 mL, C 45 mL/cmH2O y PEEP 8 cmH2O, estime la presión meseta."),
              summary("La presión meseta refleja la carga elástica; la diferencia pico-meseta refleja la carga resistiva."),
            ],
          },
        ],
      },
      {
        slug: "compliance-y-resistencia",
        title: "Compliance y resistencia",
        pages: [
          {
            slug: "medicion-de-compliance",
            title: "Medición de la compliance estática",
            type: "THEORY",
            blocks: [
              introduction("La compliance estática se calcula con una pausa inspiratoria."),
              theory("Fórmula", "**Cst = Vt / (Pmeseta − PEEP)**. Valores bajos sugieren un pulmón rígido."),
            ],
          },
          {
            slug: "caso-broncoespasmo",
            title: "Caso: aumento de la resistencia",
            type: "CASE_STUDY",
            blocks: [
              theory("Caso", "Paciente con broncoespasmo: la presión pico sube mientras la meseta se mantiene estable."),
              summary("Una brecha pico-meseta creciente orienta a un problema resistivo."),
            ],
          },
        ],
      },
    ],
  },
  {
    key: "modos-basicos",
    title: "Modos ventilatorios básicos",
    description: "Diferencias entre ventilación controlada por volumen y por presión.",
    lessons: [
      {
        slug: "volumen-vs-presion",
        title: "Volumen control frente a presión control",
        pages: [
          {
            slug: "variable-de-control",
            title: "La variable de control",
            type: "THEORY",
            blocks: [
              introduction("En VCV el volumen es la variable controlada; en PCV lo es la presión."),
              theory("Consecuencias", "En VCV la presión depende de la mecánica; en PCV el volumen corriente depende de la mecánica."),
            ],
          },
          {
            slug: "simulacion-cambio-de-modo",
            title: "Simulación: cambio de modo",
            type: "SIMULATION",
            blocks: [
              theory("Actividad", "Cambie de VCV a PCV en el simulador y observe el volumen corriente al reducir la compliance."),
              summary("La elección del modo define qué variable queda protegida ante cambios de la mecánica."),
            ],
          },
        ],
      },
    ],
  },
];

export const DEMO_MODULES: readonly DemoModule[] = MODULE_SEEDS.map((moduleSeed: ModuleSeed, moduleIndex: number): DemoModule => {
  const moduleId: string = demoId(`module:${moduleSeed.key}`);
  let pageOrder: number = 0;

  return {
    id: moduleId,
    order: moduleIndex + 1,
    title: moduleSeed.title,
    description: moduleSeed.description,
    lessons: moduleSeed.lessons.map((lessonSeed: LessonSeed, lessonIndex: number): DemoLesson => {
      const lessonId: string = demoId(`lesson:${lessonSeed.slug}`);

      return {
        id: lessonId,
        moduleId,
        order: lessonIndex + 1,
        slug: lessonSeed.slug,
        title: lessonSeed.title,
        pages: lessonSeed.pages.map((pageSeed: PageSeed): DemoPage => {
          pageOrder++;

          return { id: demoId(`page:${pageSeed.slug}`), lessonId, moduleId, order: pageOrder, ...pageSeed };
        }),
      };
    }),
  };
});

const DEMO_LESSONS: readonly DemoLesson[] = DEMO_MODULES.flatMap((demoModule: DemoModule) => demoModule.lessons);

export const DEMO_PAGES: readonly DemoPage[] = DEMO_LESSONS.flatMap((lesson: DemoLesson) => lesson.pages);

export function demoLesson(index: number): DemoLesson {
  const lesson: DemoLesson | undefined = DEMO_LESSONS[index];

  if (!lesson) {
    throw new Error(`Demo lesson ${index} does not exist`);
  }

  return lesson;
}

function blockContent(block: DemoBlock): Prisma.InputJsonObject {
  return { markdown: block.markdown };
}

export async function seedContent(db: DemoDb, context: DemoContext): Promise<void> {
  const authorId: string = DEMO_TEACHERS[0].id;
  const createdAt: Date = context.clock.at(-50, 8);
  const publishedAt: Date = context.clock.at(-45, 8);

  let sectionId: string | undefined;

  for (const section of MIGRATION_SECTIONS) {
    const row: { id: string } = await db.section.upsert({
      where: { slug: section.slug },
      create: { ...section, status: "PUBLISHED" },
      update: { title: section.title, order: section.order, status: "PUBLISHED" },
      select: { id: true },
    });

    sectionId = section.slug === DEMO_SECTION_SLUG ? row.id : sectionId;
  }

  const level: Prisma.LevelCreateManyInput = {
    id: DEMO_LEVEL_ID,
    title: "Demo · Fundamentos de ventilación mecánica",
    track: "mecanica",
    description: "Ruta publicada de la base de demostración",
    order: 90,
    color: "#2563EB",
    tags: ["demo"],
    status: "PUBLISHED",
    sectionId,
    isActive: true,
    createdAt,
    updatedAt: createdAt,
  };

  await db.level.upsert({ where: { id: DEMO_LEVEL_ID }, create: level, update: level });

  const modules: Prisma.ModuleCreateManyInput[] = DEMO_MODULES.map((demoModule: DemoModule): Prisma.ModuleCreateManyInput => ({
    id: demoModule.id,
    levelId: DEMO_LEVEL_ID,
    title: demoModule.title,
    description: demoModule.description,
    difficulty: "beginner",
    estimatedTime: 40,
    order: demoModule.order,
    status: "PUBLISHED",
    isActive: true,
    tags: ["demo"],
    createdAt,
    updatedAt: createdAt,
  }));

  await upsertAll(modules, (row: Prisma.ModuleCreateManyInput, id: string) => db.module.upsert({ where: { id }, create: row, update: row }));

  const lessons: Prisma.LessonCreateManyInput[] = DEMO_LESSONS.map((lesson: DemoLesson): Prisma.LessonCreateManyInput => ({
    id: lesson.id,
    moduleId: lesson.moduleId,
    title: lesson.title,
    slug: lesson.slug,
    order: lesson.order,
    estimatedTime: 20,
    status: "PUBLISHED",
    isActive: true,
    createdAt,
    updatedAt: createdAt,
  }));

  await upsertAll(lessons, (row: Prisma.LessonCreateManyInput, id: string) => db.lesson.upsert({ where: { id }, create: row, update: row }));

  const pages: Prisma.PageCreateManyInput[] = DEMO_PAGES.map((page: DemoPage): Prisma.PageCreateManyInput => ({
    id: page.id,
    moduleId: page.moduleId,
    lessonId: page.lessonId,
    title: page.title,
    slug: page.slug,
    order: page.order,
    type: page.type,
    difficulty: "BEGINNER",
    estimatedMinutes: 10,
    learningObjectives: [`Comprender: ${page.title.toLowerCase()}`],
    keyTakeaways: page.blocks.map((block: DemoBlock) => block.title),
    tags: ["demo"],
    version: 1,
    isActive: true,
    isPublished: true,
    status: "PUBLISHED",
    createdBy: authorId,
    updatedBy: authorId,
    createdAt,
    updatedAt: publishedAt,
    publishedAt,
  }));

  await upsertAll(pages, (row: Prisma.PageCreateManyInput, id: string) => db.page.upsert({ where: { id }, create: row, update: row }));

  const pageSections: Prisma.PageSectionCreateManyInput[] = DEMO_PAGES.flatMap((page: DemoPage) =>
    page.blocks.map((block: DemoBlock, index: number): Prisma.PageSectionCreateManyInput => ({
      id: demoId(`page-section:${page.slug}:${index + 1}`),
      pageId: page.id,
      order: index + 1,
      type: block.type,
      title: block.title,
      content: blockContent(block),
      estimatedTime: 5,
      isActive: true,
      createdBy: authorId,
      updatedBy: authorId,
      createdAt,
      updatedAt: createdAt,
    })),
  );

  await upsertAll(pageSections, (row: Prisma.PageSectionCreateManyInput, id: string) => db.pageSection.upsert({ where: { id }, create: row, update: row }));

  const revisions: Prisma.PageRevisionCreateManyInput[] = DEMO_PAGES.map((page: DemoPage): Prisma.PageRevisionCreateManyInput => ({
    id: demoId(`page-revision:${page.slug}:1`),
    pageId: page.id,
    version: 1,
    title: page.title,
    type: page.type,
    sectionsSnapshot: page.blocks.map((block: DemoBlock, index: number): Prisma.InputJsonObject => ({ order: index + 1, type: block.type, title: block.title, content: blockContent(block) })),
    changeLog: "Publicación inicial (demo)",
    changedBy: authorId,
    changedAt: publishedAt,
  }));

  await upsertAll(revisions, (row: Prisma.PageRevisionCreateManyInput, id: string) => db.pageRevision.upsert({ where: { id }, create: row, update: row }));
}
