/**
 * migrate-all-lessons.ts
 * ======================
 * Migración completa de todos los JSON de lecciones → Page + PageSection.
 *
 * Cubre:
 *   - mecanica/level01-principiante  (6 lecciones)
 *   - mecanica/level02-intermedio    (6 lecciones)
 *   - mecanica/level03-avanzado      (8 lecciones, incl. pathologies/)
 *   - ventylab/level01-principiante  (2 lecciones)
 *   - ventylab/level02-intermedio    (2 lecciones)
 *   - ventylab/level03-avanzado      (2 lecciones)
 *
 * Estrategia por página:
 *   - EXISTE  → borra PageSections + PageRevisions y los recrea desde el JSON.
 *               El registro Page y PageProgress se preservan intactos.
 *   - NO EXISTE → crea Page + PageSections desde cero.
 *
 * Seguro de re-ejecutar: siempre deja la BD sincronizada con los JSON.
 *
 * Uso:
 *   npx tsx scripts/migrate-all-lessons.ts
 */

import { PrismaClient, SectionType, PageType, ContentDifficulty } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({ log: ['error', 'warn'] });

// ─── Paths ────────────────────────────────────────────────────────────────────

const WEB_LESSONS = path.resolve(
  __dirname,
  '../../ventilab-web/src/features/ensenanza/shared/data/lessons'
);

const M = (subpath: string) => path.join(WEB_LESSONS, 'mecanica', subpath);
const V = (subpath: string) => path.join(WEB_LESSONS, 'ventylab', subpath);

// ─── Lesson descriptors ───────────────────────────────────────────────────────

interface LessonDescriptor {
  jsonPath: string;        // absolute path to JSON file
  moduleId: string;        // DB Module.id
  lessonId: string;        // DB Lesson.id (legacyLessonId)
  pageOrder?: number;      // Page.order within module (default 1)
}

const LESSONS: LessonDescriptor[] = [
  // ── mecanica / nivel 1 ─────────────────────────────────────────────────────
  {
    jsonPath: M('level01-principiante/module-01-inversion-fisiologica.json'),
    moduleId: 'module-01-inversion-fisiologica',
    lessonId: 'lesson-inversion-fisiologica',
  },
  {
    jsonPath: M('level01-principiante/module-02-ecuacion-movimiento.json'),
    moduleId: 'module-02-ecuacion-movimiento',
    lessonId: 'lesson-ecuacion-movimiento',
  },
  {
    jsonPath: M('level01-principiante/module-03-variables-fase.json'),
    moduleId: 'module-03-variables-fase',
    lessonId: 'lesson-variables-fase',
  },
  {
    jsonPath: M('level01-principiante/module-04-modos-ventilatorios.json'),
    moduleId: 'module-04-modos-ventilatorios',
    lessonId: 'lesson-modos-ventilatorios',
  },
  {
    jsonPath: M('level01-principiante/module-05-monitorizacion-grafica.json'),
    moduleId: 'module-05-monitorizacion-grafica',
    lessonId: 'lesson-monitorizacion-grafica',
  },
  {
    jsonPath: M('level01-principiante/module-06-efectos-sistemicos.json'),
    moduleId: 'module-06-efectos-sistemicos',
    lessonId: 'lesson-efectos-sistemicos',
  },

  // ── mecanica / nivel 2 ─────────────────────────────────────────────────────
  {
    jsonPath: M('level02-intermedio/module-01-Ventilacion-vcv-vs-pcv.json'),
    moduleId: 'module-01-vcv-vs-pcv',
    lessonId: 'lesson-vcv-vs-pcv',
  },
  {
    jsonPath: M('level02-intermedio/module-02-peep-optimizar-oxigenacion.json'),
    moduleId: 'module-02-peep-optimizar-oxigenacion',
    lessonId: 'lesson-peep-optimizar-oxigenacion',
  },
  {
    jsonPath: M('level02-intermedio/module-03-soporte-PSV-CPAP.json'),
    moduleId: 'module-03-soporte-psv-cpap',
    lessonId: 'lesson-soporte-psv-cpap',
  },
  {
    jsonPath: M('level02-intermedio/module-04-duales-simv.json'),
    moduleId: 'module-04-duales-simv',
    lessonId: 'lesson-duales-simv',
  },
  {
    jsonPath: M('level02-intermedio/module-05-graficas-fine-tuning.json'),
    moduleId: 'module-05-graficas-fine-tuning',
    lessonId: 'lesson-graficas-fine-tuning',
  },
  {
    jsonPath: M('level02-intermedio/module-06-avanzado-evaluacion-destete.json'),
    moduleId: 'module-06-avanzado-evaluacion-destete',
    lessonId: 'lesson-avanzado-evaluacion-destete',
  },

  // ── mecanica / nivel 3 ─────────────────────────────────────────────────────
  {
    jsonPath: M('level03-avanzado/module-01-daño-pulmonar-vili-ventilacion-protectora.json'),
    moduleId: 'module-01-vili-ventilacion-protectora',
    lessonId: 'lesson-vili-ventilacion-protectora',
  },
  {
    jsonPath: M('level03-avanzado/module-02-monitorizacion-alto-nivel.json'),
    moduleId: 'module-02-monitorizacion-alto-nivel',
    lessonId: 'lesson-monitorizacion-alto-nivel',
  },
  {
    jsonPath: M('level03-avanzado/module-03-advertencias-asincronias-situaciones-complejas.json'),
    moduleId: 'module-03-advertencias-asincronias',
    lessonId: 'lesson-advertencias-asincronias',
  },
  {
    jsonPath: M('level03-avanzado/module-04-destete-complejo-vmni.json'),
    moduleId: 'module-04-destete-complejo-vmni',
    lessonId: 'lesson-destete-complejo-vmni',
  },
  {
    jsonPath: M('level03-avanzado/pathologies/module-05-obesidad-sedentarismo.json'),
    moduleId: 'module-05-obesidad-sedentarismo',
    lessonId: 'lesson-obesidad-sedentarismo',
  },
  {
    jsonPath: M('level03-avanzado/pathologies/module-06-epoc-asma-fumadores.json'),
    moduleId: 'module-06-epoc-asma-fumadores',
    lessonId: 'lesson-epoc-asma-fumadores',
  },
  {
    jsonPath: M('level03-avanzado/pathologies/module-07-sdra.json'),
    moduleId: 'module-07-sdra',
    lessonId: 'lesson-sdra',
  },
  {
    jsonPath: M('level03-avanzado/pathologies/module-08-recuperacion-proteccion.json'),
    moduleId: 'module-08-recuperacion-proteccion',
    lessonId: 'lesson-recuperacion-proteccion',
  },

  // ── ventylab / nivel 1 ─────────────────────────────────────────────────────
  {
    jsonPath: V('level01-principiante/historia_fisiología_aplicada.json'),
    moduleId: 'ventylab-module-01-historia-fisiologia',
    lessonId: 'vl-historia-fisiologia-aplicada',
  },
  {
    jsonPath: V('level01-principiante/ventilador_compontentes.json'),
    moduleId: 'ventylab-module-02-ventilador-componentes',
    lessonId: 'vl-ventilador-componentes',
  },

  // ── ventylab / nivel 2 ─────────────────────────────────────────────────────
  {
    jsonPath: V('level02-intermedio/programación_modo_clasicos.json'),
    moduleId: 'ventylab-module-03-programacion-modos',
    lessonId: 'vl-programacion-modos-clasicos',
  },
  {
    jsonPath: V('level02-intermedio/ventilaciónnoinvasiva_destete.json'),
    moduleId: 'ventylab-module-04-vni-destete',
    lessonId: 'vl-vni-destete',
  },

  // ── ventylab / nivel 3 ─────────────────────────────────────────────────────
  {
    jsonPath: V('level03-avanzado/raciocinioclínico_patologíascríticas.json'),
    moduleId: 'ventylab-module-05-raciocinio-clinico',
    lessonId: 'vl-raciocinio-clinico-patologias',
  },
  {
    jsonPath: V('level03-avanzado/innovación_tecnología_gestión.json'),
    moduleId: 'ventylab-module-06-innovacion-tecnologia',
    lessonId: 'vl-innovacion-tecnologia-gestion',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapSectionType(jsonType: string): SectionType {
  const map: Record<string, SectionType> = {
    introduction : 'INTRODUCTION',
    theory       : 'THEORY',
    case         : 'CASE_STUDY',   // legacy type used in level01 JSONs
    case_study   : 'CASE_STUDY',   // new type added by workshop script
    summary      : 'SUMMARY',
    exercise     : 'EXERCISE',     // new type added by workshop script
    quiz         : 'QUIZ',
    references   : 'REFERENCES',
    text         : 'TEXT',
    image        : 'IMAGE',
    video        : 'VIDEO',
    code         : 'CODE',
    callout      : 'CALLOUT',
  };
  return map[jsonType?.toLowerCase()] ?? 'TEXT';
}

function mapDifficulty(raw: string): ContentDifficulty {
  const map: Record<string, ContentDifficulty> = {
    beginner     : 'BEGINNER',
    intermediate : 'INTERMEDIATE',
    advanced     : 'ADVANCED',
    prerequisitos: 'BEGINNER',
  };
  return map[raw?.toLowerCase()] ?? 'INTERMEDIATE';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

/** Fix split learningObjectives (each sentence fragment on its own array item). */
function fixLearningObjectives(raw: string[]): string[] {
  if (!raw?.length) return [];
  const fixed: string[] = [];
  let current = '';
  for (const item of raw) {
    const t = item.trim();
    if (!t) continue;
    const startsNew = /^[A-ZÁÉÍÓÚÑ]/.test(t);
    if (startsNew && current) { fixed.push(current.trim()); current = t; }
    else if (startsNew)       { current = t; }
    else                      { current += ' ' + t; }
  }
  if (current) fixed.push(current.trim());
  return fixed;
}

// ─── Core migration ───────────────────────────────────────────────────────────

async function migrateLesson(desc: LessonDescriptor, systemUserId: string) {
  // 1. Read JSON
  if (!fs.existsSync(desc.jsonPath)) {
    throw new Error(`JSON not found: ${desc.jsonPath}`);
  }
  const json = JSON.parse(fs.readFileSync(desc.jsonPath, 'utf-8'));
  const legacyJsonId: string = json.id;

  // 2. Check module exists
  const module = await prisma.module.findUnique({ where: { id: desc.moduleId } });
  if (!module) throw new Error(`Module "${desc.moduleId}" not in DB — run seed first`);

  // 3. Find existing page
  let existingPage = await prisma.page.findFirst({
    where: { OR: [{ legacyJsonId }, { legacyLessonId: desc.lessonId }] },
    select: { id: true },
  });

  const learningObjectives = fixLearningObjectives(json.learningObjectives ?? []);
  const sectionsRaw: any[] = json.sections ?? [];
  const exercises: any[]   = json.exercises ?? [];
  const quizData: any      = json.quiz ?? null;

  // Build all PageSection create-data in order
  const sectionPayloads: any[] = [];
  let order = 1;

  // Regular sections from JSON
  for (const s of sectionsRaw) {
    if (!s?.content) continue; // skip malformed
    sectionPayloads.push({
      order: order++,
      type : mapSectionType(s.type),
      title: s.title ?? null,
      content: s.content ?? { markdown: '' },
      sectionId    : s.id ?? null,
      estimatedTime: s.estimatedTime ?? null,
      isActive     : true,
      createdBy    : systemUserId,
    });
  }

  // Exercises array (root level)
  for (const ex of exercises) {
    sectionPayloads.push({
      order: order++,
      type : 'EXERCISE' as SectionType,
      title: ex.title ?? 'Ejercicio',
      content: {
        exerciseType       : ex.type,
        isEvaluation       : ex.is_evaluation ?? false,
        instructions       : ex.instructions ?? '',
        estimatedTime      : ex.estimated_time ?? null,
        categories         : ex.content?.categories ?? [],
        items              : ex.content?.items ?? [],
        hints              : ex.hints ?? [],
        feedbackOnComplete : ex.feedback_on_complete ?? '',
        learningPoints     : ex.learning_points ?? [],
      },
      sectionId    : ex.id ?? null,
      estimatedTime: ex.estimated_time ?? null,
      isActive     : true,
      createdBy    : systemUserId,
    });
  }

  // Quiz (root level)
  if (quizData?.questions?.length) {
    sectionPayloads.push({
      order: order++,
      type : 'QUIZ' as SectionType,
      title: `Quiz: ${json.title?.substring(0, 60) ?? 'Quiz'}`,
      content: {
        quizId      : quizData.id,
        passingScore: quizData.passingScore,
        questions   : quizData.questions,
      },
      sectionId: quizData.id ?? null,
      isActive : true,
      createdBy: systemUserId,
    });
  }

  // 4. Upsert Page + refresh PageSections in a transaction
  await prisma.$transaction(async (tx) => {
    let pageId: string;

    if (existingPage) {
      // Refresh: delete old sections and revisions, keep the Page row intact
      // (PageProgress is FK to Page.id — safe to keep)
      await tx.pageRevision.deleteMany({ where: { pageId: existingPage.id } });
      await tx.pageSection.deleteMany({ where: { pageId: existingPage.id } });

      // Update Page metadata
      await tx.page.update({
        where: { id: existingPage.id },
        data: {
          title              : json.title,
          description        : json.description ?? null,
          difficulty         : mapDifficulty(json.difficulty),
          bloomLevel         : json.bloomLevel ?? null,
          estimatedMinutes   : json.estimatedTime ?? null,
          learningObjectives,
          prerequisites      : json.prerequisites ?? [],
          hasRequiredQuiz    : false, // non-blocking: quiz is in sections, not gating
          minQuizScore       : null,
          aiConfig           : json.ai_integration ?? null,
          resources          : json.resources ?? null,
          isActive           : true,
          isPublished        : true,
          publishedAt        : new Date(),
          legacyLessonId     : desc.lessonId,
          legacyJsonId,
          updatedBy          : systemUserId,
        },
      });
      pageId = existingPage.id;
    } else {
      // Create new Page
      const created = await tx.page.create({
        data: {
          moduleId           : desc.moduleId,
          title              : json.title,
          slug               : slugify(json.title),
          order              : desc.pageOrder ?? 1,
          type               : 'THEORY' as PageType,
          description        : json.description ?? null,
          difficulty         : mapDifficulty(json.difficulty),
          bloomLevel         : json.bloomLevel ?? null,
          estimatedMinutes   : json.estimatedTime ?? null,
          learningObjectives,
          prerequisites      : json.prerequisites ?? [],
          keyTakeaways       : [],
          tags               : [],
          hasRequiredQuiz    : false,
          minQuizScore       : null,
          aiConfig           : json.ai_integration ?? null,
          resources          : json.resources ?? null,
          version            : 1,
          isActive           : true,
          isPublished        : true,
          publishedAt        : new Date(),
          legacyLessonId     : desc.lessonId,
          legacyJsonId,
          createdBy          : systemUserId,
        },
      });
      pageId = created.id;
    }

    // Insert all sections
    for (const payload of sectionPayloads) {
      await tx.pageSection.create({ data: { pageId, ...payload } });
    }

    // Create revision snapshot
    const allSections = await tx.pageSection.findMany({
      where   : { pageId },
      orderBy : { order: 'asc' },
    });

    await tx.pageRevision.create({
      data: {
        pageId,
        version : 1,
        title   : json.title,
        type    : 'THEORY' as PageType,
        sectionsSnapshot: allSections.map(s => ({
          id           : s.id,
          order        : s.order,
          type         : s.type,
          title        : s.title,
          content      : s.content,
          sectionId    : s.sectionId,
          estimatedTime: s.estimatedTime,
        })),
        changeLog : existingPage
          ? 'Full refresh from JSON (migrate-all-lessons)'
          : 'Initial migration from JSON',
        changedBy : systemUserId,
      },
    });
  }, { maxWait: 15000, timeout: 60000 });

  return {
    status  : existingPage ? 'REFRESHED' : 'CREATED',
    sections: sectionPayloads.length,
  };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== migrate-all-lessons.ts ===\n');

  // Resolve or create system user
  let systemUser = await prisma.user.findFirst({
    where: { email: 'system@ventylab.local' },
    select: { id: true },
  });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: 'system@ventylab.local',
        name : 'System',
        role : 'ADMIN',
      },
      select: { id: true },
    });
    console.log('Created system user: system@ventylab.local');
  }
  const systemUserId = systemUser.id;

  const results: { lesson: string; status: string; sections: number; error?: string }[] = [];

  for (const desc of LESSONS) {
    const name = path.basename(desc.jsonPath);
    try {
      const r = await migrateLesson(desc, systemUserId);
      results.push({ lesson: name, status: r.status, sections: r.sections });
      console.log(`  [${r.status}]  ${name}  (${r.sections} sections)`);
    } catch (err: any) {
      results.push({ lesson: name, status: 'ERROR', sections: 0, error: err.message });
      console.error(`  [ERROR]   ${name}: ${err.message}`);
    }
  }

  // Summary
  const created   = results.filter(r => r.status === 'CREATED').length;
  const refreshed = results.filter(r => r.status === 'REFRESHED').length;
  const errors    = results.filter(r => r.status === 'ERROR').length;
  const total     = results.reduce((s, r) => s + r.sections, 0);

  console.log(`\n--- Summary ---`);
  console.log(`  Created   : ${created}`);
  console.log(`  Refreshed : ${refreshed}`);
  console.log(`  Errors    : ${errors}`);
  console.log(`  Total sections in DB: ${total}`);

  if (errors > 0) {
    console.log('\nErrors:');
    results.filter(r => r.status === 'ERROR').forEach(r =>
      console.log(`  - ${r.lesson}: ${r.error}`)
    );
    process.exit(1);
  }

  console.log('\nDone.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
