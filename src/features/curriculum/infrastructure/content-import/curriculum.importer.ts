/*
 * Funcionalidad: Importador idempotente del currículo
 * Descripción: Sincroniza la base con el plan deseado (curriculum-plan.builder): secciones por track, niveles, prerrequisitos, módulos, lecciones y páginas por id determinista; reemplaza los bloques de una página solo si cambió su contenido (y entonces sube la versión y guarda una revisión), archiva lo retirado sin borrar y conserva o archiva las páginas ajenas a la importación dentro de los módulos gestionados. En simulación solo calcula el informe; con apply escribe todo en una transacción. Una segunda ejecución no cambia ninguna fila
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type PrismaClient } from "@prisma/client";

import { pageRevisionId, pageSectionId } from "@/features/curriculum/infrastructure/content-import/curriculum-ids";
import {
  canonicalJson,
  type CurriculumPlan,
  type DesiredLesson,
  type DesiredModule,
  type DesiredPage,
  type DesiredSection,
  hashPageContent,
} from "@/features/curriculum/infrastructure/content-import/curriculum-plan.builder";
import { type CurriculumTrack } from "@/features/curriculum/infrastructure/content-import/curriculum.manifest";

export type ForeignPagesPolicy = "keep" | "archive";

export interface ImportOptions {
  readonly apply: boolean;
  /** User id written as createdBy/updatedBy of pages and changedBy of revisions; required to apply. */
  readonly authorId: string | null;
  readonly foreignPages: ForeignPagesPolicy;
  readonly now: Date;
}

export type ImportEntity = "sections" | "levels" | "levelPrerequisites" | "modules" | "modulePrerequisites" | "lessons" | "pages" | "pageContents";

export interface EntityCounts {
  created: number;
  updated: number;
  unchanged: number;
  archived: number;
  removed: number;
}

export interface ForeignPage {
  readonly moduleId: string;
  readonly pageId: string;
  readonly slug: string;
  readonly title: string;
}

export interface ImportReport {
  readonly applied: boolean;
  readonly counts: Record<ImportEntity, EntityCounts>;
  readonly foreignPages: ForeignPage[];
  readonly foreignLessons: { readonly moduleId: string; readonly lessonId: string; readonly title: string }[];
}

export class CurriculumImportError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "CurriculumImportError";
  }
}

type Db = Prisma.TransactionClient | PrismaClient;

const SECTION_DEFAULTS: Record<CurriculumTrack, { readonly id: string; readonly title: string; readonly order: number }> = {
  mecanica: { id: "section-mecanica", title: "Mecánica ventilatoria", order: 0 },
  ventylab: { id: "section-ventylab", title: "VentyLab", order: 1 },
};

const PAGE_TAGS: readonly string[] = ["curriculo"];

const ENTITIES: readonly ImportEntity[] = ["sections", "levels", "levelPrerequisites", "modules", "modulePrerequisites", "lessons", "pages", "pageContents"];

function emptyCounts(): Record<ImportEntity, EntityCounts> {
  return Object.fromEntries(ENTITIES.map((entity: ImportEntity) => [entity, { created: 0, updated: 0, unchanged: 0, archived: 0, removed: 0 }])) as Record<ImportEntity, EntityCounts>;
}

function sameFields(current: Record<string, unknown>, desired: Record<string, unknown>): boolean {
  return Object.keys(desired).every((key: string): boolean => canonicalJson(current[key]) === canonicalJson(desired[key]));
}

class CurriculumSync {
  private readonly counts: Record<ImportEntity, EntityCounts> = emptyCounts();
  private readonly foreignPages: ForeignPage[] = [];
  private readonly foreignLessons: { moduleId: string; lessonId: string; title: string }[] = [];

  public constructor(
    private readonly db: Db,
    private readonly plan: CurriculumPlan,
    private readonly options: ImportOptions,
  ) {}

  public async run(): Promise<ImportReport> {
    const sectionIds: Record<CurriculumTrack, string> = await this.syncSections();

    await this.syncLevels(sectionIds);
    await this.syncLevelPrerequisites();
    await this.syncModules();
    await this.syncModulePrerequisites();
    await this.syncLessons();

    for (const desiredModule of this.plan.modules) {
      await this.syncModulePages(desiredModule);
    }

    await this.retire();

    return { applied: this.options.apply, counts: this.counts, foreignPages: this.foreignPages, foreignLessons: this.foreignLessons };
  }

  private get write(): boolean {
    return this.options.apply;
  }

  private async syncSections(): Promise<Record<CurriculumTrack, string>> {
    const result: Partial<Record<CurriculumTrack, string>> = {};
    const tracks: CurriculumTrack[] = [...new Set(this.plan.levels.map((level: { readonly track: CurriculumTrack }): CurriculumTrack => level.track))];

    for (const track of tracks) {
      const existing: { id: string } | null = await this.db.section.findUnique({ where: { slug: track }, select: { id: true } });

      if (existing) {
        this.counts.sections.unchanged++;
        result[track] = existing.id;
        continue;
      }

      const defaults: { readonly id: string; readonly title: string; readonly order: number } = SECTION_DEFAULTS[track];

      this.counts.sections.created++;
      result[track] = defaults.id;

      if (this.write) {
        await this.db.section.create({ data: { id: defaults.id, slug: track, title: defaults.title, order: defaults.order, status: "PUBLISHED" } });
      }
    }

    return result as Record<CurriculumTrack, string>;
  }

  private async syncLevels(sectionIds: Record<CurriculumTrack, string>): Promise<void> {
    for (const level of this.plan.levels) {
      const desired: Prisma.LevelUncheckedUpdateInput & Record<string, unknown> = {
        title: level.title,
        track: level.track,
        description: level.description,
        order: level.order,
        status: "PUBLISHED",
        isActive: true,
        sectionId: sectionIds[level.track],
      };
      const current: Record<string, unknown> | null = await this.db.level.findUnique({ where: { id: level.id } });

      await this.upsert("levels", current, desired, async (): Promise<void> => {
        await this.db.level.create({ data: { id: level.id, ...(desired as Prisma.LevelUncheckedCreateInput) } });
      }, async (): Promise<void> => {
        await this.db.level.update({ where: { id: level.id }, data: desired });
      });
    }
  }

  private async syncLevelPrerequisites(): Promise<void> {
    for (const prerequisite of this.plan.levelPrerequisites) {
      const where: Prisma.LevelPrerequisiteWhereUniqueInput = { level_prerequisite_unique: { levelId: prerequisite.dependentId, prerequisiteLevelId: prerequisite.prerequisiteId } };
      const existing: { id: string } | null = await this.db.levelPrerequisite.findUnique({ where, select: { id: true } });

      if (existing) {
        this.counts.levelPrerequisites.unchanged++;
        continue;
      }

      this.counts.levelPrerequisites.created++;

      if (this.write) {
        await this.db.levelPrerequisite.create({ data: { levelId: prerequisite.dependentId, prerequisiteLevelId: prerequisite.prerequisiteId } });
      }
    }
  }

  private async syncModules(): Promise<void> {
    for (const desiredModule of this.plan.modules) {
      const desired: Prisma.ModuleUncheckedUpdateInput & Record<string, unknown> = {
        levelId: desiredModule.levelId,
        title: desiredModule.title,
        description: desiredModule.description,
        difficulty: desiredModule.difficulty,
        order: desiredModule.order,
        estimatedTime: desiredModule.estimatedTime,
        status: "PUBLISHED",
        isActive: true,
      };
      const current: Record<string, unknown> | null = await this.db.module.findUnique({ where: { id: desiredModule.id } });

      await this.upsert("modules", current, desired, async (): Promise<void> => {
        await this.db.module.create({ data: { id: desiredModule.id, ...(desired as Prisma.ModuleUncheckedCreateInput) } });
      }, async (): Promise<void> => {
        await this.db.module.update({ where: { id: desiredModule.id }, data: desired });
      });
    }
  }

  private async syncModulePrerequisites(): Promise<void> {
    const managedIds: string[] = this.plan.modules.map((desiredModule: DesiredModule): string => desiredModule.id);
    const existing: { id: string; moduleId: string; prerequisiteId: string }[] = await this.db.modulePrerequisite.findMany({
      where: { moduleId: { in: managedIds } },
      select: { id: true, moduleId: true, prerequisiteId: true },
    });
    const desiredKeys: Set<string> = new Set<string>(this.plan.modulePrerequisites.map((item: { readonly dependentId: string; readonly prerequisiteId: string }): string => `${item.dependentId}>${item.prerequisiteId}`));
    const existingKeys: Set<string> = new Set<string>(existing.map((row: { moduleId: string; prerequisiteId: string }): string => `${row.moduleId}>${row.prerequisiteId}`));
    const stale: string[] = existing.filter((row: { moduleId: string; prerequisiteId: string }): boolean => !desiredKeys.has(`${row.moduleId}>${row.prerequisiteId}`)).map((row: { id: string }): string => row.id);

    this.counts.modulePrerequisites.removed += stale.length;

    if (this.write && stale.length > 0) {
      await this.db.modulePrerequisite.deleteMany({ where: { id: { in: stale } } });
    }

    for (const item of this.plan.modulePrerequisites) {
      if (existingKeys.has(`${item.dependentId}>${item.prerequisiteId}`)) {
        this.counts.modulePrerequisites.unchanged++;
        continue;
      }

      this.counts.modulePrerequisites.created++;

      if (this.write) {
        await this.db.modulePrerequisite.create({ data: { moduleId: item.dependentId, prerequisiteId: item.prerequisiteId } });
      }
    }
  }

  private async syncLessons(): Promise<void> {
    const managedIds: Set<string> = new Set<string>(this.plan.lessons.map((lesson: DesiredLesson): string => lesson.id));

    for (const lesson of this.plan.lessons) {
      const desired: Prisma.LessonUncheckedUpdateInput & Record<string, unknown> = {
        moduleId: lesson.moduleId,
        title: lesson.title,
        slug: lesson.slug,
        order: lesson.order,
        estimatedTime: lesson.estimatedTime,
        status: "PUBLISHED",
        isActive: true,
      };
      const current: Record<string, unknown> | null = await this.db.lesson.findUnique({ where: { id: lesson.id } });

      await this.upsert("lessons", current, desired, async (): Promise<void> => {
        await this.db.lesson.create({ data: { id: lesson.id, ...(desired as Prisma.LessonUncheckedCreateInput) } });
      }, async (): Promise<void> => {
        await this.db.lesson.update({ where: { id: lesson.id }, data: desired });
      });
    }

    const others: { id: string; moduleId: string; title: string }[] = await this.db.lesson.findMany({
      where: { moduleId: { in: this.plan.modules.map((desiredModule: DesiredModule): string => desiredModule.id) }, status: { not: "ARCHIVED" } },
      select: { id: true, moduleId: true, title: true },
    });

    for (const lesson of others) {
      if (!managedIds.has(lesson.id) && !this.plan.retiredLessonIds.includes(lesson.id)) {
        this.foreignLessons.push({ moduleId: lesson.moduleId, lessonId: lesson.id, title: lesson.title });
      }
    }
  }

  private async syncModulePages(desiredModule: DesiredModule): Promise<void> {
    const desiredPages: DesiredPage[] = this.plan.pages.filter((page: DesiredPage): boolean => page.moduleId === desiredModule.id);
    const desiredIds: Set<string> = new Set<string>(desiredPages.map((page: DesiredPage): string => page.id));
    const existing: Prisma.PageGetPayload<{ include: { sections: true } }>[] = await this.db.page.findMany({
      where: { moduleId: desiredModule.id },
      include: { sections: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });
    const byId: Map<string, Prisma.PageGetPayload<{ include: { sections: true } }>> = new Map(existing.map((page: Prisma.PageGetPayload<{ include: { sections: true } }>) => [page.id, page]));
    const foreign: Prisma.PageGetPayload<{ include: { sections: true } }>[] = existing.filter((page: { id: string }): boolean => !desiredIds.has(page.id));

    const finalPlacement: Map<string, { order: number; slug: string }> = new Map();

    desiredPages.forEach((page: DesiredPage): void => {
      finalPlacement.set(page.id, { order: page.order, slug: page.slug });
    });

    const takenSlugs: Set<string> = new Set<string>(desiredPages.map((page: DesiredPage): string => page.slug));

    foreign.forEach((page: { id: string; slug: string; title: string }, index: number): void => {
      const slug: string = takenSlugs.has(page.slug) ? `${page.slug}-${page.id.slice(0, 8)}` : page.slug;

      finalPlacement.set(page.id, { order: desiredPages.length + index + 1, slug });
      this.foreignPages.push({ moduleId: desiredModule.id, pageId: page.id, slug: page.slug, title: page.title });
    });

    const moving: Prisma.PageGetPayload<{ include: { sections: true } }>[] = existing.filter((page: { id: string; order: number; slug: string }): boolean => {
      const target: { order: number; slug: string } | undefined = finalPlacement.get(page.id);

      return target !== undefined && (target.order !== page.order || target.slug !== page.slug);
    });

    // Park the pages that move on temporary slots first: (moduleId, order) and (moduleId, slug) are unique.
    if (this.write) {
      for (const [index, page] of moving.entries()) {
        await this.db.page.update({ where: { id: page.id }, data: { order: -(index + 1), slug: `tmp-${page.id}` } });
      }
    }

    for (const page of foreign) {
      const target: { order: number; slug: string } = finalPlacement.get(page.id) as { order: number; slug: string };
      const archive: boolean = this.options.foreignPages === "archive" && page.status !== "ARCHIVED";
      const data: Prisma.PageUncheckedUpdateInput = { order: target.order, slug: target.slug, ...(archive ? { status: "ARCHIVED", isPublished: false, isActive: false } : {}) };

      if (archive) {
        this.counts.pages.archived++;
      }

      if (this.write && (archive || moving.includes(page))) {
        await this.db.page.update({ where: { id: page.id }, data });
      }
    }

    for (const page of desiredPages) {
      await this.syncPage(page, byId.get(page.id) ?? null);
    }
  }

  private async syncPage(page: DesiredPage, current: Prisma.PageGetPayload<{ include: { sections: true } }> | null): Promise<void> {
    const desired: Prisma.PageUncheckedUpdateInput & Record<string, unknown> = {
      moduleId: page.moduleId,
      lessonId: page.lessonId,
      title: page.title,
      slug: page.slug,
      order: page.order,
      type: page.type,
      difficulty: page.difficulty,
      estimatedMinutes: page.estimatedMinutes,
      learningObjectives: [...page.learningObjectives],
      keyTakeaways: [...page.keyTakeaways],
      tags: [...PAGE_TAGS],
      isActive: true,
      isPublished: true,
      status: "PUBLISHED",
    };

    if (!current) {
      this.counts.pages.created++;
      this.counts.pageContents.created++;

      if (this.write) {
        const authorId: string = this.authorId();

        await this.db.page.create({
          data: { id: page.id, ...(desired as Prisma.PageUncheckedCreateInput), version: 1, createdBy: authorId, updatedBy: authorId, publishedAt: this.options.now },
        });
        await this.writeContent(page, 1);
      }

      return;
    }

    const currentHash: string = hashPageContent(current.title, current.type, current.sections.map((section: { order: number; type: string; title: string | null; content: unknown }): DesiredSection => ({
      order: section.order,
      type: section.type as DesiredSection["type"],
      title: section.title,
      content: section.content as Record<string, unknown>,
    })));
    const contentChanged: boolean = currentHash !== page.contentHash;
    const fieldsChanged: boolean = !sameFields(current, desired);

    if (!contentChanged && !fieldsChanged) {
      this.counts.pages.unchanged++;
      this.counts.pageContents.unchanged++;

      return;
    }

    this.counts.pages[fieldsChanged ? "updated" : "unchanged"]++;
    this.counts.pageContents[contentChanged ? "updated" : "unchanged"]++;

    if (!this.write) {
      return;
    }

    const version: number = contentChanged ? current.version + 1 : current.version;

    await this.db.page.update({
      where: { id: page.id },
      data: { ...desired, version, updatedBy: this.authorId(), ...(current.publishedAt ? {} : { publishedAt: this.options.now }) },
    });

    if (contentChanged) {
      await this.db.pageSection.deleteMany({ where: { pageId: page.id } });
      await this.writeContent(page, version);
    }
  }

  private async writeContent(page: DesiredPage, version: number): Promise<void> {
    const authorId: string = this.authorId();

    await this.db.pageSection.createMany({
      data: page.sections.map((section: DesiredSection): Prisma.PageSectionCreateManyInput => ({
        id: pageSectionId(page.id, section.order),
        pageId: page.id,
        order: section.order,
        type: section.type,
        title: section.title,
        content: section.content as Prisma.InputJsonObject,
        isActive: true,
        createdBy: authorId,
        updatedBy: authorId,
      })),
    });
    await this.db.pageRevision.upsert({
      where: { pageId_version: { pageId: page.id, version } },
      create: {
        id: pageRevisionId(page.id, version),
        pageId: page.id,
        version,
        title: page.title,
        type: page.type,
        sectionsSnapshot: page.sections.map((section: DesiredSection): Prisma.InputJsonObject => ({ ...section, content: section.content as Prisma.InputJsonObject })),
        changeLog: version === 1 ? "Importación del currículo" : "Actualización del currículo",
        changedBy: authorId,
        changedAt: this.options.now,
      },
      update: {},
    });
  }

  private async retire(): Promise<void> {
    const modules: { id: string; status: string; isActive: boolean }[] = await this.db.module.findMany({ where: { id: { in: [...this.plan.retiredModuleIds] } }, select: { id: true, status: true, isActive: true } });

    for (const row of modules) {
      if (row.status === "ARCHIVED" && !row.isActive) {
        this.counts.modules.unchanged++;
        continue;
      }

      this.counts.modules.archived++;

      if (this.write) {
        await this.db.module.update({ where: { id: row.id }, data: { status: "ARCHIVED", isActive: false } });
      }
    }

    const lessons: { id: string; status: string; isActive: boolean }[] = await this.db.lesson.findMany({ where: { id: { in: [...this.plan.retiredLessonIds] } }, select: { id: true, status: true, isActive: true } });

    for (const row of lessons) {
      if (row.status === "ARCHIVED" && !row.isActive) {
        this.counts.lessons.unchanged++;
        continue;
      }

      this.counts.lessons.archived++;

      if (this.write) {
        await this.db.lesson.update({ where: { id: row.id }, data: { status: "ARCHIVED", isActive: false } });
      }
    }
  }

  private async upsert(entity: ImportEntity, current: Record<string, unknown> | null, desired: Record<string, unknown>, create: () => Promise<void>, update: () => Promise<void>): Promise<void> {
    if (!current) {
      this.counts[entity].created++;

      if (this.write) {
        await create();
      }

      return;
    }

    if (sameFields(current, desired)) {
      this.counts[entity].unchanged++;

      return;
    }

    this.counts[entity].updated++;

    if (this.write) {
      await update();
    }
  }

  private authorId(): string {
    if (!this.options.authorId) {
      throw new CurriculumImportError("An author user id is required to write pages");
    }

    return this.options.authorId;
  }
}

/** Dry run (apply = false) reads only; apply writes everything in one transaction. */
export async function importCurriculum(db: PrismaClient, plan: CurriculumPlan, options: ImportOptions): Promise<ImportReport> {
  if (plan.issues.length > 0) {
    throw new CurriculumImportError(`The curriculum has ${plan.issues.length} content problems; fix them before importing:\n${plan.issues.join("\n")}`);
  }

  if (!options.apply) {
    return new CurriculumSync(db, plan, options).run();
  }

  if (!options.authorId) {
    throw new CurriculumImportError("An author user id is required to apply the import");
  }

  return db.$transaction((tx: Prisma.TransactionClient): Promise<ImportReport> => new CurriculumSync(tx, plan, options).run(), { timeout: 600_000, maxWait: 30_000 });
}
