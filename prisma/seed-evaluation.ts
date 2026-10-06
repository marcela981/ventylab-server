/**
 * =============================================================================
 * Funcionalidad : Seed de evaluación (quizzes, exámenes, talleres)
 * Descripción   : Puebla `evaluations` (+ `evaluation_scenarios`,
 *                 `evaluation_questions`, `evaluation_question_options`) a partir
 *                 de los archivos JSON ubicados en `prisma/seed-data/evaluation/`
 *                 del propio backend (no requiere que el frontend esté checked out).
 *                 Las tablas legacy `quizzes` y `activities` están congeladas y
 *                 este seed ya no las escribe: produce las mismas filas (ids,
 *                 forma TipTap, campos legacy_*) que la migración
 *                 20261007120000_evaluation_feature genera desde ellas, vía
 *                 `prisma/seed-helpers/evaluation-seed.mapper.ts`.
 *
 *                 Estructura esperada:
 *                   prisma/seed-data/evaluation/
 *                     ├── quizzes/
 *                     │   ├── mecanica/{principiante,intermedio,avanzado}/*.json
 *                     │   └── ventylab/{principiante,intermedio,avanzado}/*.json
 *                     ├── examenes/**\/*.json
 *                     └── talleres/**\/*.json
 *
 *                 Quizzes  → evaluations type QUIZ     (26 total: mecánica 6+6+8, ventylab 2+2+2)
 *                 Exámenes → evaluations type EXAM     (legacy_type = EXAM,   6 total)
 *                 Talleres → evaluations type WORKSHOP (legacy_type = TALLER, 9 total)
 *
 *                 SEGURO DE RE-EJECUTAR: todas las escrituras usan prisma.upsert().
 *
 *                 Comandos:
 *                   npm run seed:evaluation
 *                   npx tsx prisma/seed-evaluation.ts
 *
 * Versión       : 2.1
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Desarrollo de una aplicación web para la enseñanza de
 *                 mecánica ventilatoria que integre un sistema de
 *                 retroalimentación usando modelos de lenguaje
 * Institución   : Universidad del Valle
 * Contacto      : marcela.mazo@correounivalle.edu.co
 * =============================================================================
 */

import { type Prisma, PrismaClient } from '@prisma/client';
import * as fs   from 'fs';
import * as path from 'path';

import {
  type EvalJson,
  mapActivitySeed,
  mapQuizSeed,
  type SeedActivityType,
  type SeedEvaluationBundle,
} from './seed-helpers/evaluation-seed.mapper';

const prisma = new PrismaClient();

// ─── Paths ────────────────────────────────────────────────────────────────────
// Los JSON viven dentro del propio repo del backend para que el seed pueda
// correrse sin requerir el checkout del frontend (`ventilab-web`).
//   <ventylab-server>/prisma/seed-data/evaluation/

const EVAL_DIR = path.resolve(__dirname, 'seed-data/evaluation');

// ─── moduleId map for mecanica quizzes ────────────────────────────────────────
// The JSON files use inconsistent casing / extra words compared to the DB module
// IDs seeded by prisma/seed.ts.  This map provides the canonical DB id.
// Key = "<level>/<basename-without-.json>"
const MECANICA_MODULE_MAP: Record<string, string> = {
  // Principiante
  'principiante/inversion-fisiologica':  'module-01-inversion-fisiologica',
  'principiante/ecuacion-movimiento':    'module-02-ecuacion-movimiento',
  'principiante/variables-fase':         'module-03-variables-fase',
  'principiante/modos-ventilatorios':    'module-04-modos-ventilatorios',
  'principiante/monitorizacion-grafica': 'module-05-monitorizacion-grafica',
  'principiante/efectos-sistemicos':     'module-06-efectos-sistemicos',
  // Intermedio
  'intermedio/vcv-vs-pcv':               'module-01-vcv-vs-pcv',
  'intermedio/peep':                     'module-02-peep-optimizar-oxigenacion',
  'intermedio/psv-cpap':                 'module-03-soporte-psv-cpap',
  'intermedio/duales-simv':              'module-04-duales-simv',
  'intermedio/graficas':                 'module-05-graficas-fine-tuning',
  'intermedio/destete':                  'module-06-avanzado-evaluacion-destete',
  // Avanzado
  'avanzado/vili':              'module-01-vili-ventilacion-protectora',
  'avanzado/monitorizacion':    'module-02-monitorizacion-alto-nivel',
  'avanzado/asincronias':       'module-03-advertencias-asincronias',
  'avanzado/destete-complejo':  'module-04-destete-complejo-vmni',
  'avanzado/obesidad':          'module-05-obesidad-sedentarismo',
  'avanzado/epoc-asma':         'module-06-epoc-asma-fumadores',
  'avanzado/sdra':              'module-07-sdra',
  'avanzado/recuperacion':      'module-08-recuperacion-proteccion',
};

// ─── moduleId map for ventylab quizzes ────────────────────────────────────────
// Los JSON ventylab declaran moduleId con el nombre del archivo de lección
// (ej. "historia_fisiología_aplicada"), pero la tabla `modules` usa el id
// canónico seedeado por prisma/seed.ts. Este map traduce uno a otro.
// Key = "<level>/<basename-without-.json>"
const VENTYLAB_MODULE_MAP: Record<string, string> = {
  'principiante/quizz-1': 'ventylab-module-01-historia-fisiologia',
  'principiante/quizz-2': 'ventylab-module-02-ventilador-componentes',
  'intermedio/quizz-1':   'ventylab-module-03-programacion-modos',
  'intermedio/quizz-2':   'ventylab-module-04-vni-destete',
  'avanzado/quizz-1':     'ventylab-module-06-innovacion-tecnologia',
  'avanzado/quizz-2':     'ventylab-module-05-raciocinio-clinico',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Read + parse a JSON file using explicit utf-8 Buffer conversion. */
function readJson(filePath: string): EvalJson {
  const raw = Buffer.from(fs.readFileSync(filePath)).toString('utf-8');
  return JSON.parse(raw) as EvalJson;
}

/**
 * Walk a directory tree and collect all .json file paths,
 * sorted alphabetically per directory so order indexes are stable.
 */
function collectJsonFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

/** Derive the MECANICA_MODULE_MAP / VENTYLAB_MODULE_MAP key from a full file path. */
function moduleMapKey(filePath: string): string {
  const level = path.basename(path.dirname(filePath)); // principiante | intermedio | avanzado
  const base  = path.basename(filePath, '.json');
  return `${level}/${base}`;
}

// ─── System-user resolution ───────────────────────────────────────────────────

/**
 * Return the id of the first ADMIN / TEACHER user.
 * If none exists, create a system user so the seed is self-contained.
 */
async function resolveCreatorId(): Promise<string> {
  const existing = await prisma.user.findFirst({
    where:   { role: { in: ['ADMIN', 'TEACHER'] } },
    select:  { id: true, email: true, role: true },
    orderBy: { createdAt: 'asc' },
  });

  if (existing) {
    console.log(`   creator: ${existing.email} (${existing.role})`);
    return existing.id;
  }

  // No admin/teacher — create a minimal system user
  console.log('   No ADMIN/TEACHER found — creating system user');
  const sys = await prisma.user.create({
    data: {
      email: 'system@ventylab.edu.co',
      name:  'Sistema VentyLab',
      role:  'ADMIN',
    },
  });
  console.log(`   Created system user: ${sys.id}`);
  return sys.id;
}

// ─── Upsert of one mapped evaluation ─────────────────────────────────────────
// Every row is upserted by the same deterministic id the migration uses, so a
// fresh DB seeded here matches a DB migrated from the legacy seed, and re-running
// the seed (or running it after the migration) never duplicates rows.

async function upsertEvaluation(bundle: SeedEvaluationBundle): Promise<void> {
  const { createdById, ...evaluationUpdate } = bundle.evaluation;

  await prisma.evaluation.upsert({
    where:  { id: bundle.evaluation.id },
    update: evaluationUpdate,
    create: { ...bundle.evaluation, createdById },
  });

  if (bundle.scenario) {
    const { id, ...scenarioData } = bundle.scenario;
    const content = bundle.scenario.content as unknown as Prisma.InputJsonValue;

    await prisma.evaluationScenario.upsert({
      where:  { id },
      update: { ...scenarioData, content },
      create: { id, ...scenarioData, content },
    });
  }

  for (const question of bundle.questions) {
    const { options, ...questionData } = question;
    const prompt = question.prompt as unknown as Prisma.InputJsonValue;

    await prisma.evaluationQuestion.upsert({
      where:  { id: question.id },
      update: { ...questionData, prompt },
      create: { ...questionData, prompt },
    });

    for (const option of options) {
      await prisma.evaluationQuestionOption.upsert({
        where:  { id: option.id },
        update: option,
        create: option,
      });
    }
  }
}

async function moduleExists(moduleId: string, ownerId: string): Promise<boolean> {
  // evaluations.module_id is a FK: an unknown module is stored only in legacy_module_ref.
  const found = await prisma.module.findUnique({ where: { id: moduleId }, select: { id: true } });
  if (!found) {
    console.warn(`  ⚠  "${ownerId}": moduleId "${moduleId}" not in modules table (kept in legacy_module_ref only)`);
  }
  return found !== null;
}

async function levelExists(levelId: string): Promise<boolean> {
  const found = await prisma.level.findUnique({ where: { id: levelId }, select: { id: true } });
  return found !== null;
}

/** Map each file to its index inside its own folder (the legacy quiz `order`). */
function folderOrder(files: string[]): Map<string, number> {
  const byFolder = new Map<string, string[]>();
  for (const f of files) {
    const folder = path.dirname(f);
    byFolder.set(folder, [...(byFolder.get(folder) ?? []), f]);
  }
  const order = new Map<string, number>();
  for (const f of files) {
    order.set(f, (byFolder.get(path.dirname(f)) ?? []).indexOf(f));
  }
  return order;
}

// ─── Seed: Quizzes ────────────────────────────────────────────────────────────

async function seedQuizGroup(dir: string, moduleMap: Record<string, string>): Promise<number> {
  const files = collectJsonFiles(dir);
  const order = folderOrder(files);

  for (const filePath of files) {
    const json      = readJson(filePath);
    const moduleRef = moduleMap[moduleMapKey(filePath)] ?? json.moduleId;

    await upsertEvaluation(
      mapQuizSeed(json, { moduleRef, moduleExists: await moduleExists(moduleRef, json.id), order: order.get(filePath) ?? 0 }),
    );
  }

  return files.length;
}

async function seedQuizzes(): Promise<number> {
  const mecanica = await seedQuizGroup(path.join(EVAL_DIR, 'quizzes', 'mecanica'), MECANICA_MODULE_MAP);
  const ventylab = await seedQuizGroup(path.join(EVAL_DIR, 'quizzes', 'ventylab'), VENTYLAB_MODULE_MAP);
  return mecanica + ventylab;
}

// ─── Seed: Exams and talleres ─────────────────────────────────────────────────
// The legacy seed stored {moduleId, level, passingScore, caseStudy?, questions}
// as JSON text in activities.instructions; the mapper rebuilds that exact text
// for legacy_instructions and expands the questions and the caseStudy scenario.

async function seedActivities(dirName: string, activityType: SeedActivityType, createdById: string): Promise<number> {
  const files = collectJsonFiles(path.join(EVAL_DIR, dirName));

  for (const filePath of files) {
    const json = readJson(filePath);

    await upsertEvaluation(
      mapActivitySeed(json, activityType, {
        moduleExists: await moduleExists(json.moduleId, json.id),
        levelExists:  await levelExists(json.level),
        createdById,
      }),
    );
  }

  return files.length;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  seed-evaluation — VentyLab');
  console.log(`    eval dir: ${EVAL_DIR}\n`);

  if (!fs.existsSync(EVAL_DIR)) {
    console.error(`❌  Evaluation data directory not found:\n    ${EVAL_DIR}`);
    console.error('    Verifica que existan los JSON en prisma/seed-data/evaluation/.');
    process.exit(1);
  }

  const createdBy = await resolveCreatorId();

  console.log('\n📝  Seeding quizzes...');
  const quizCount = await seedQuizzes();
  console.log(`✅  Seeded ${quizCount} quizzes`);

  console.log('\n📋  Seeding exams...');
  const examCount = await seedActivities('examenes', 'EXAM', createdBy);
  console.log(`✅  Seeded ${examCount} exams`);

  console.log('\n🔧  Seeding talleres...');
  const tallerCount = await seedActivities('talleres', 'TALLER', createdBy);
  console.log(`✅  Seeded ${tallerCount} talleres`);

  console.log('\n' + '─'.repeat(45));
  console.log(`    ${quizCount} quizzes | ${examCount} exams | ${tallerCount} talleres`);
  console.log('─'.repeat(45) + '\n');
}

main()
  .catch((err) => {
    console.error('seed-evaluation failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
