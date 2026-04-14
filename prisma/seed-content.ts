/**
 * seed-content.ts
 * ================
 * Migrates educational content from JSON source files into the database.
 *
 * Sources : ventilab-web/src/features/ensenanza/shared/data/lessons/
 * Targets : Module → Lesson → Step (levels already exist from seed.ts)
 *
 * SAFE TO RE-RUN: Uses upsert for Level/Module/Lesson; deleteMany+createMany
 * for Steps (Steps have no natural unique key — wipe+reload is idempotent).
 *
 * Run:
 *   npx tsx prisma/seed-content.ts
 *
 * Autor   : Marcela Mazo Castro
 * Proyecto: VentyLab
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ─── Path to JSON source files (relative to this script) ─────────────────────
const LESSONS_BASE = path.resolve(
  __dirname,
  '../../ventilab-web/src/features/ensenanza/shared/data/lessons'
);

// ─── Type definitions ─────────────────────────────────────────────────────────

interface JsonSection {
  id: string;
  order: number;
  type: string;
  title: string;
  content: {
    markdown?: string;
    [key: string]: unknown;
  };
  estimatedTime?: number;
  [key: string]: unknown;
}

interface LessonJson {
  id: string;
  title: string;
  description?: string;
  estimatedTime?: number;
  difficulty?: string;
  sections: JsonSection[];
  [key: string]: unknown;
}

interface ModuleConfig {
  /** DB Module.id — must match curriculumData.js module key */
  moduleId: string;
  /** DB Lesson.id — must match modules.js lesson id */
  lessonId: string;
  /** Lesson slug for upsert unique key */
  lessonSlug: string;
  /** Existing DB Level.id */
  levelId: string;
  /** Path relative to LESSONS_BASE */
  jsonRelPath: string;
}

// ─── Level definitions (must match existing DB records from seed.ts) ──────────
// DB IDs use the 'level-*' prefix for mecanica; ventylab levels keep their full ID.
// The API's LEVEL_SLUG_MAP in levels.service.ts converts these to frontend slugs.

const LEVEL_UPSERTS = [
  {
    id: 'level-prerequisitos',
    title: 'Prerequisitos',
    track: 'mecanica',
    description: 'Contenido fundamental opcional para reforzar bases antes de iniciar el currículo principal',
    order: 1,
  },
  {
    id: 'level-beginner',
    title: 'Nivel Principiante',
    track: 'mecanica',
    description: 'Fundamentos fisiológicos y conceptos básicos de ventilación mecánica',
    order: 2,
  },
  {
    id: 'level-intermedio',
    title: 'Nivel Intermedio',
    track: 'mecanica',
    description: 'Modalidades ventilatorias y manejo de parámetros críticos',
    order: 3,
  },
  {
    id: 'level-avanzado',
    title: 'Nivel Avanzado',
    track: 'mecanica',
    description: 'Estrategias especializadas y casos clínicos complejos',
    order: 4,
  },
  {
    id: 'ventylab-principiante',
    title: 'Principiante',
    track: 'ventylab',
    description: 'Primeros pasos con la plataforma: navegación, simulador y configuración básica',
    order: 1,
  },
  {
    id: 'ventylab-intermedio',
    title: 'Intermedio',
    track: 'ventylab',
    description: 'Interpretación de datos del simulador y uso de casos clínicos',
    order: 2,
  },
  {
    id: 'ventylab-avanzado',
    title: 'Avanzado',
    track: 'ventylab',
    description: 'Escenarios complejos, evaluación y personalización del flujo de trabajo',
    order: 3,
  },
];

// ─── Module/Lesson/JSON config ────────────────────────────────────────────────
// Each entry defines: which module, which lesson, which JSON file to read Steps from.
// moduleId + lessonId must match curriculumData.js / modules.js exactly.

const MODULE_CONFIGS: ModuleConfig[] = [
  // ── BEGINNER (level-beginner) ──────────────────────────────────────────────
  // Beginner modules: moduleId === lessonId (single-lesson modules, IDs equal)
  {
    moduleId: 'module-01-inversion-fisiologica',
    lessonId: 'module-01-inversion-fisiologica',
    lessonSlug: 'inversion-fisiologica',
    levelId: 'level-beginner',
    jsonRelPath: 'mecanica/level01-principiante/module-01-inversion-fisiologica.json',
  },
  {
    moduleId: 'module-02-ecuacion-movimiento',
    lessonId: 'module-02-ecuacion-movimiento',
    lessonSlug: 'ecuacion-movimiento',
    levelId: 'level-beginner',
    jsonRelPath: 'mecanica/level01-principiante/module-02-ecuacion-movimiento.json',
  },
  {
    moduleId: 'module-03-variables-fase',
    lessonId: 'module-03-variables-fase',
    lessonSlug: 'variables-fase',
    levelId: 'level-beginner',
    jsonRelPath: 'mecanica/level01-principiante/module-03-variables-fase.json',
  },
  {
    moduleId: 'module-04-modos-ventilatorios',
    lessonId: 'module-04-modos-ventilatorios',
    lessonSlug: 'modos-ventilatorios',
    levelId: 'level-beginner',
    jsonRelPath: 'mecanica/level01-principiante/module-04-modos-ventilatorios.json',
  },
  {
    moduleId: 'module-05-monitorizacion-grafica',
    lessonId: 'module-05-monitorizacion-grafica',
    lessonSlug: 'monitorizacion-grafica',
    levelId: 'level-beginner',
    jsonRelPath: 'mecanica/level01-principiante/module-05-monitorizacion-grafica.json',
  },
  {
    moduleId: 'module-06-efectos-sistemicos',
    lessonId: 'module-06-efectos-sistemicos',
    lessonSlug: 'efectos-sistemicos',
    levelId: 'level-beginner',
    jsonRelPath: 'mecanica/level01-principiante/module-06-efectos-sistemicos.json',
  },

  // ── INTERMEDIATE (level-intermedio) ───────────────────────────────────────
  {
    moduleId: 'module-01-vcv-vs-pcv',
    lessonId: 'lesson-vcv-vs-pcv',
    lessonSlug: 'vcv-vs-pcv',
    levelId: 'level-intermedio',
    jsonRelPath: 'mecanica/level02-intermedio/module-01-Ventilacion-vcv-vs-pcv.json',
  },
  {
    moduleId: 'module-02-peep-optimizar-oxigenacion',
    lessonId: 'lesson-peep-optimizar-oxigenacion',
    lessonSlug: 'peep-optimizar-oxigenacion',
    levelId: 'level-intermedio',
    jsonRelPath: 'mecanica/level02-intermedio/module-02-peep-optimizar-oxigenacion.json',
  },
  {
    moduleId: 'module-03-soporte-psv-cpap',
    lessonId: 'lesson-soporte-psv-cpap',
    lessonSlug: 'soporte-psv-cpap',
    levelId: 'level-intermedio',
    jsonRelPath: 'mecanica/level02-intermedio/module-03-soporte-PSV-CPAP.json',
  },
  {
    moduleId: 'module-04-duales-simv',
    lessonId: 'lesson-duales-simv',
    lessonSlug: 'duales-simv',
    levelId: 'level-intermedio',
    jsonRelPath: 'mecanica/level02-intermedio/module-04-duales-simv.json',
  },
  {
    moduleId: 'module-05-graficas-fine-tuning',
    lessonId: 'lesson-graficas-fine-tuning',
    lessonSlug: 'graficas-fine-tuning',
    levelId: 'level-intermedio',
    jsonRelPath: 'mecanica/level02-intermedio/module-05-graficas-fine-tuning.json',
  },
  {
    moduleId: 'module-06-avanzado-evaluacion-destete',
    lessonId: 'lesson-avanzado-evaluacion-destete',
    lessonSlug: 'avanzado-evaluacion-destete',
    levelId: 'level-intermedio',
    jsonRelPath: 'mecanica/level02-intermedio/module-06-avanzado-evaluacion-destete.json',
  },

  // ── ADVANCED (level-avanzado) ──────────────────────────────────────────────
  {
    moduleId: 'module-01-vili-ventilacion-protectora',
    lessonId: 'lesson-vili-ventilacion-protectora',
    lessonSlug: 'vili-ventilacion-protectora',
    levelId: 'level-avanzado',
    jsonRelPath: 'mecanica/level03-avanzado/module-01-daño-pulmonar-vili-ventilacion-protectora.json',
  },
  {
    moduleId: 'module-02-monitorizacion-alto-nivel',
    lessonId: 'lesson-monitorizacion-alto-nivel',
    lessonSlug: 'monitorizacion-alto-nivel',
    levelId: 'level-avanzado',
    jsonRelPath: 'mecanica/level03-avanzado/module-02-monitorizacion-alto-nivel.json',
  },
  {
    moduleId: 'module-03-advertencias-asincronias',
    lessonId: 'lesson-advertencias-asincronias',
    lessonSlug: 'advertencias-asincronias',
    levelId: 'level-avanzado',
    jsonRelPath: 'mecanica/level03-avanzado/module-03-advertencias-asincronias-situaciones-complejas.json',
  },
  {
    moduleId: 'module-04-destete-complejo-vmni',
    lessonId: 'lesson-destete-complejo-vmni',
    lessonSlug: 'destete-complejo-vmni',
    levelId: 'level-avanzado',
    jsonRelPath: 'mecanica/level03-avanzado/module-04-destete-complejo-vmni.json',
  },
  {
    moduleId: 'module-05-obesidad-sedentarismo',
    lessonId: 'lesson-obesidad-sedentarismo',
    lessonSlug: 'obesidad-sedentarismo',
    levelId: 'level-avanzado',
    jsonRelPath: 'mecanica/level03-avanzado/pathologies/module-05-obesidad-sedentarismo.json',
  },
  {
    moduleId: 'module-06-epoc-asma-fumadores',
    lessonId: 'lesson-epoc-asma-fumadores',
    lessonSlug: 'epoc-asma-fumadores',
    levelId: 'level-avanzado',
    jsonRelPath: 'mecanica/level03-avanzado/pathologies/module-06-epoc-asma-fumadores.json',
  },
  {
    moduleId: 'module-07-sdra',
    lessonId: 'lesson-sdra',
    lessonSlug: 'sdra',
    levelId: 'level-avanzado',
    jsonRelPath: 'mecanica/level03-avanzado/pathologies/module-07-sdra.json',
  },
  {
    moduleId: 'module-08-recuperacion-proteccion',
    lessonId: 'lesson-recuperacion-proteccion',
    lessonSlug: 'recuperacion-proteccion',
    levelId: 'level-avanzado',
    jsonRelPath: 'mecanica/level03-avanzado/pathologies/module-08-recuperacion-proteccion.json',
  },

  // ── VENTYLAB PRINCIPIANTE ─────────────────────────────────────────────────
  {
    moduleId: 'ventylab-module-01-historia-fisiologia',
    lessonId: 'vl-historia-fisiologia-aplicada',
    lessonSlug: 'historia-fisiologia-aplicada',
    levelId: 'ventylab-principiante',
    jsonRelPath: 'ventylab/level01-principiante/historia_fisiología_aplicada.json',
  },
  {
    moduleId: 'ventylab-module-02-ventilador-componentes',
    lessonId: 'vl-ventilador-componentes',
    lessonSlug: 'ventilador-componentes',
    levelId: 'ventylab-principiante',
    jsonRelPath: 'ventylab/level01-principiante/ventilador_compontentes.json',
  },

  // ── VENTYLAB INTERMEDIO ───────────────────────────────────────────────────
  {
    moduleId: 'ventylab-module-03-programacion-modos',
    lessonId: 'vl-programacion-modos-clasicos',
    lessonSlug: 'programacion-modos-clasicos',
    levelId: 'ventylab-intermedio',
    jsonRelPath: 'ventylab/level02-intermedio/programación_modo_clasicos.json',
  },
  {
    moduleId: 'ventylab-module-04-vni-destete',
    lessonId: 'vl-vni-destete',
    lessonSlug: 'vni-destete',
    levelId: 'ventylab-intermedio',
    jsonRelPath: 'ventylab/level02-intermedio/ventilaciónnoinvasiva_destete.json',
  },

  // ── VENTYLAB AVANZADO ─────────────────────────────────────────────────────
  {
    moduleId: 'ventylab-module-05-raciocinio-clinico',
    lessonId: 'vl-raciocinio-clinico-patologias',
    lessonSlug: 'raciocinio-clinico-patologias',
    levelId: 'ventylab-avanzado',
    jsonRelPath: 'ventylab/level03-avanzado/raciocinioclínico_patologíascríticas.json',
  },
  {
    moduleId: 'ventylab-module-06-innovacion-tecnologia',
    lessonId: 'vl-innovacion-tecnologia-gestion',
    lessonSlug: 'innovacion-tecnologia-gestion',
    levelId: 'ventylab-avanzado',
    jsonRelPath: 'ventylab/level03-avanzado/innovación_tecnología_gestión.json',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readJsonFile(relPath: string): LessonJson {
  const fullPath = path.join(LESSONS_BASE, relPath);
  // Use Buffer to handle UTF-8 encoded files with special characters (ñ, é, etc.)
  const raw = Buffer.from(fs.readFileSync(fullPath)).toString('utf8');
  return JSON.parse(raw) as LessonJson;
}

function mapContentType(sectionType: string): string {
  const mapping: Record<string, string> = {
    introduction: 'text',
    theory: 'text',
    summary: 'text',
    cheatsheet: 'text',
    quiz: 'quiz',
    exercise: 'simulation',
    clinical_case: 'simulation',
    video: 'video',
  };
  return mapping[sectionType] ?? 'text';
}

// ─── Main seed function ───────────────────────────────────────────────────────

async function seedContent(): Promise<void> {
  console.log('\n🌱 VentyLab content seed started');
  console.log(`   Source: ${LESSONS_BASE}\n`);

  // ── 1. Upsert levels ──────────────────────────────────────────────────────
  console.log('── Step 1: Upserting levels...');
  for (const level of LEVEL_UPSERTS) {
    await prisma.level.upsert({
      where: { id: level.id },
      create: {
        id: level.id,
        title: level.title,
        track: level.track,
        description: level.description,
        order: level.order,
        isActive: true,
      },
      update: {
        title: level.title,
        track: level.track,
        description: level.description,
        order: level.order,
      },
    });
    console.log(`   ✓ Level  ${level.id}`);
  }

  // ── 2. Process each module config ─────────────────────────────────────────
  console.log('\n── Step 2: Upserting modules → lessons → steps...\n');

  let totalStepsCreated = 0;
  let totalModulesProcessed = 0;

  for (const cfg of MODULE_CONFIGS) {
    // ── 2a. Read JSON source file ──────────────────────────────────────────
    const jsonPath = path.join(LESSONS_BASE, cfg.jsonRelPath);
    if (!fs.existsSync(jsonPath)) {
      console.warn(`   ⚠  JSON not found, skipping: ${cfg.jsonRelPath}`);
      continue;
    }

    let lessonJson: LessonJson;
    try {
      lessonJson = readJsonFile(cfg.jsonRelPath);
    } catch (err) {
      console.error(`   ✗  Failed to parse JSON: ${cfg.jsonRelPath}`, err);
      continue;
    }

    const sections = lessonJson.sections ?? [];

    // ── 2b. Upsert module ──────────────────────────────────────────────────
    await prisma.module.upsert({
      where: { id: cfg.moduleId },
      create: {
        id: cfg.moduleId,
        levelId: cfg.levelId,
        title: lessonJson.title,
        description: lessonJson.description ?? null,
        difficulty: lessonJson.difficulty ?? 'beginner',
        estimatedTime: lessonJson.estimatedTime ?? 0,
        order: (lessonJson as any).order ?? 0,
        isActive: true,
      },
      update: {
        levelId: cfg.levelId,
        estimatedTime: lessonJson.estimatedTime ?? 0,
      },
    });

    // ── 2c. Upsert lesson ──────────────────────────────────────────────────
    let lesson = await prisma.lesson.findFirst({
      where: { id: cfg.lessonId },
      select: { id: true },
    });

    if (!lesson) {
      // Try to find by slug within this module
      const bySlug = await prisma.lesson.findUnique({
        where: {
          moduleId_slug: {
            moduleId: cfg.moduleId,
            slug: cfg.lessonSlug,
          },
        },
        select: { id: true },
      });
      lesson = bySlug;
    }

    if (!lesson) {
      // Create with explicit ID
      lesson = await prisma.lesson.create({
        data: {
          id: cfg.lessonId,
          moduleId: cfg.moduleId,
          title: lessonJson.title,
          slug: cfg.lessonSlug,
          estimatedTime: lessonJson.estimatedTime ?? 0,
          order: 1,
          isActive: true,
        },
        select: { id: true },
      });
    } else {
      // Ensure the lesson ID is correct
      if (lesson.id !== cfg.lessonId) {
        console.warn(
          `   ⚠  Lesson found by slug but ID mismatch: ` +
          `expected ${cfg.lessonId}, got ${lesson.id} — updating slug`
        );
      }
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          moduleId: cfg.moduleId,
          slug: cfg.lessonSlug,
          estimatedTime: lessonJson.estimatedTime ?? 0,
        },
      });
    }

    const resolvedLessonId = lesson.id;

    // ── 2d. Replace steps: delete existing, create fresh from JSON ─────────
    const deleted = await prisma.step.deleteMany({
      where: { lessonId: resolvedLessonId },
    });

    if (sections.length > 0) {
      await prisma.step.createMany({
        data: sections.map((section) => ({
          lessonId: resolvedLessonId,
          title: section.title ?? null,
          // Store full section content as JSON for rich rendering
          content: JSON.stringify({
            markdown: section.content?.markdown ?? '',
            type: section.type,
            ...section.content,
          }),
          contentType: mapContentType(section.type),
          order: section.order ?? 0,
          isActive: true,
        })),
      });
    }

    const stepsCount = sections.length;
    totalStepsCreated += stepsCount;
    totalModulesProcessed++;

    console.log(
      `   ✓ ${cfg.moduleId}  →  lesson: ${resolvedLessonId}  ` +
      `[${deleted.count} old steps removed, ${stepsCount} steps created]`
    );
  }

  // ── 3. Print summary ──────────────────────────────────────────────────────
  console.log('\n── Summary ────────────────────────────────────────────────');
  const [levels, modules, lessons, steps] = await Promise.all([
    prisma.level.count(),
    prisma.module.count(),
    prisma.lesson.count(),
    prisma.step.count(),
  ]);

  console.log(`   Levels   : ${levels}`);
  console.log(`   Modules  : ${modules}  (${totalModulesProcessed} processed this run)`);
  console.log(`   Lessons  : ${lessons}`);
  console.log(`   Steps    : ${steps}  (${totalStepsCreated} created this run)`);
  console.log('\n✅ seed-content.ts completed successfully\n');
}

// ─── Entry point ─────────────────────────────────────────────────────────────

seedContent()
  .catch((err) => {
    console.error('\n✗ seed-content.ts failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
