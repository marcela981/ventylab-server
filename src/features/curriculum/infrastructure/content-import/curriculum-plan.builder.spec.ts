/*
 * Funcionalidad: Pruebas del plan deseado del currículo y de sus ids
 * Descripción: Ids deterministas con forma UUID v5 y estables entre ejecuciones; ids de julio conservados; órdenes de páginas por módulo; prerrequisitos en cadena solo en los niveles secuenciales; hash del contenido independiente del orden de las claves; problemas por archivo faltante, inválido o con reglas editoriales incumplidas; manifiesto real sin ids ni slugs repetidos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { curriculumId, lessonId, moduleId } from "@/features/curriculum/infrastructure/content-import/curriculum-ids";
import { buildCurriculumPlan, canonicalJson, type CurriculumPlan, type DesiredLesson, type DesiredModule, type DesiredPage, hashPageContent } from "@/features/curriculum/infrastructure/content-import/curriculum-plan.builder";
import { CURRICULUM_MANIFEST, type CurriculumManifest, type LevelEntry } from "@/features/curriculum/infrastructure/content-import/curriculum.manifest";

const VALID_LESSON: string = [
  "<!-- page: uno | THEORY | Uno -->",
  "<!-- block: THEORY | Concepto -->",
  "![Diagrama](/learning/diagrams/x-uno.svg)",
  "<!-- page: dos | CASE_STUDY | Dos -->",
  "<!-- block: CASE_STUDY | Ejemplo clínico -->",
  "Caso.",
  "<!-- page: tres | THEORY | Tres -->",
  "<!-- block: SUMMARY | Puntos clave -->",
  "- **Primero** punto.",
  "- Segundo punto.",
  "<!-- block: CALLOUT:warning | Errores frecuentes -->",
  "- Error.",
  "<!-- block: REFERENCES | Referencias -->",
  "- Ref.",
].join("\n");

const MANIFEST: CurriculumManifest = {
  levels: [
    {
      id: "level-a",
      track: "mecanica",
      title: "A",
      description: "Nivel A",
      order: 1,
      difficulty: "intermediate",
      sequentialModules: true,
      prerequisiteLevelId: "level-0",
      modules: [
        { key: "legacy-module", legacy: true, title: "M1", description: "d", lessons: [{ slug: "l1", title: "L1", legacyId: "legacy-lesson", estimatedMinutes: 30, objectives: ["o"] }] },
        { key: "nuevo", legacy: false, title: "M2", description: "d", lessons: [{ slug: "l2", title: "L2", estimatedMinutes: 31, objectives: [] }, { slug: "l3", title: "L3", estimatedMinutes: 10, objectives: [] }] },
      ],
    },
  ],
  retiredModuleIds: ["old-module"],
  retiredLessonIds: ["old-lesson"],
};

function planWith(read: (moduleKey: string, slug: string) => string | null): CurriculumPlan {
  return buildCurriculumPlan(MANIFEST, read);
}

describe("curriculum ids", () => {
  it("derives stable UUID v5 shaped ids from a name", () => {
    const id: string = curriculumId("module:nuevo");

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(curriculumId("module:nuevo")).toBe(id);
    expect(curriculumId("module:otro")).not.toBe(id);
  });

  it("keeps the July ids of legacy modules and lessons", () => {
    const [legacy, fresh] = MANIFEST.levels[0].modules;

    expect(moduleId(legacy)).toBe("legacy-module");
    expect(lessonId(legacy.key, legacy.lessons[0])).toBe("legacy-lesson");
    expect(moduleId(fresh)).toBe(curriculumId("module:nuevo"));
    expect(lessonId(fresh.key, fresh.lessons[0])).toBe(curriculumId("lesson:nuevo/l2"));
  });
});

describe("buildCurriculumPlan", () => {
  const plan: CurriculumPlan = planWith((): string => VALID_LESSON);

  it("builds every row with deterministic ids and no issues", () => {
    expect(plan.issues).toEqual([]);
    expect(plan.modules.map((row: DesiredModule) => [row.id, row.order, row.estimatedTime])).toEqual([
      ["legacy-module", 1, 30],
      [curriculumId("module:nuevo"), 2, 41],
    ]);
    expect(plan.lessons.map((row: DesiredLesson) => [row.id, row.order])).toEqual([
      ["legacy-lesson", 1],
      [curriculumId("lesson:nuevo/l2"), 1],
      [curriculumId("lesson:nuevo/l3"), 2],
    ]);
    expect(buildCurriculumPlan(MANIFEST, (): string => VALID_LESSON)).toEqual(plan);
  });

  it("numbers pages per module across lessons and prefixes the slug with the lesson", () => {
    const pages: DesiredPage[] = plan.pages.filter((page: DesiredPage): boolean => page.moduleId === curriculumId("module:nuevo"));

    expect(pages.map((page: DesiredPage) => [page.slug, page.order])).toEqual([
      ["l2-uno", 1], ["l2-dos", 2], ["l2-tres", 3], ["l3-uno", 4], ["l3-dos", 5], ["l3-tres", 6],
    ]);
    expect(pages[0]).toMatchObject({ difficulty: "INTERMEDIATE", estimatedMinutes: 10, keyTakeaways: ["Primero punto.", "Segundo punto."] });
  });

  it("chains the modules of a sequential level and keeps the level prerequisite", () => {
    expect(plan.modulePrerequisites).toEqual([{ dependentId: curriculumId("module:nuevo"), prerequisiteId: "legacy-module" }]);
    expect(plan.levelPrerequisites).toEqual([{ dependentId: "level-a", prerequisiteId: "level-0" }]);
  });

  it("reports missing, unparseable and incomplete lessons", () => {
    const issues: readonly string[] = planWith((moduleKey: string, slug: string): string | null => {
      if (slug === "l1") {
        return null;
      }

      return slug === "l2" ? "texto suelto" : VALID_LESSON.replace("REFERENCES", "THEORY");
    }).issues;

    expect(issues).toEqual([
      "legacy-module/l1: content file is missing",
      expect.stringMatching(/^nuevo\/l2: line 1: content before the first page marker/),
      "nuevo/l3: missing REFERENCES block",
    ]);
  });

  it("hashes page content independently of the object key order", () => {
    expect(canonicalJson({ b: 1, a: [{ d: 2, c: null }] })).toBe(canonicalJson({ a: [{ c: null, d: 2 }], b: 1 }));
    expect(hashPageContent("T", "THEORY", [{ order: 1, type: "CALLOUT", title: null, content: { variant: "tip", markdown: "x" } }]))
      .toBe(hashPageContent("T", "THEORY", [{ order: 1, type: "CALLOUT", title: null, content: { markdown: "x", variant: "tip" } }]));
  });
});

describe("CURRICULUM_MANIFEST", () => {
  it("has no repeated ids, slugs or level titles", () => {
    expect(buildCurriculumPlan(CURRICULUM_MANIFEST, (): string => VALID_LESSON).issues).toEqual([]);
  });

  it("keeps the level ids of production", () => {
    expect(CURRICULUM_MANIFEST.levels.map((level: LevelEntry): string => level.id)).toEqual([
      "level-prerequisitos", "level-beginner", "level-intermedio", "level-avanzado", "ventylab-principiante", "ventylab-intermedio", "ventylab-avanzado",
    ]);
  });
});
