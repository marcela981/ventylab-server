/**
 * =============================================================================
 * Funcionalidad : Seed de evaluación (quizzes, exámenes, talleres)
 * Descripción   : Puebla las tablas `quizzes` y `activities` a partir de los
 *                 archivos JSON ubicados en `prisma/seed-data/evaluation/` del
 *                 propio backend (no requiere que el frontend esté checked out).
 *
 *                 Estructura esperada:
 *                   prisma/seed-data/evaluation/
 *                     ├── quizzes/
 *                     │   ├── mecanica/{principiante,intermedio,avanzado}/*.json
 *                     │   └── ventylab/{principiante,intermedio,avanzado}/*.json
 *                     ├── examenes/**\/*.json
 *                     └── talleres/**\/*.json
 *
 *                 Quizzes  → tabla quizzes    (26 total: mecánica 6+6+8, ventylab 2+2+2)
 *                 Exámenes → tabla activities (type = EXAM,   6 total)
 *                 Talleres → tabla activities (type = TALLER, 9 total)
 *
 *                 SEGURO DE RE-EJECUTAR: todas las escrituras usan prisma.upsert().
 *
 *                 Comandos:
 *                   npm run seed:evaluation
 *                   npx tsx prisma/seed-evaluation.ts
 *
 * Versión       : 2.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Desarrollo de una aplicación web para la enseñanza de
 *                 mecánica ventilatoria que integre un sistema de
 *                 retroalimentación usando modelos de lenguaje
 * Institución   : Universidad del Valle
 * Contacto      : marcela.mazo@correounivalle.edu.co
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';
import * as fs   from 'fs';
import * as path from 'path';

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

// ─── Type definitions ─────────────────────────────────────────────────────────

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'scenario_choice';
  text: string;
  options: QuizOption[];
  explanation?: string;
}

interface CaseStudy {
  patient: string;
  scenario: string;
  objective: string;
}

interface EvalJson {
  id: string;
  type: 'quiz' | 'examen' | 'taller';
  title: string;
  description: string;
  moduleId: string;
  level: string;
  passingScore: number;
  questions: QuizQuestion[];
  caseStudy?: CaseStudy;
}

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

/** Derive the MECANICA_MODULE_MAP key from a full file path. */
function mecanicaKey(filePath: string): string {
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

// ─── Seed: Quizzes ────────────────────────────────────────────────────────────

async function seedQuizzes(): Promise<number> {
  let count = 0;

  // ── mecanica ──────────────────────────────────────────────────────────────
  const mecanicaDir = path.join(EVAL_DIR, 'quizzes', 'mecanica');
  const mecanicaFiles = collectJsonFiles(mecanicaDir);

  // Group by folder to assign per-folder order index
  const byFolder = new Map<string, string[]>();
  for (const f of mecanicaFiles) {
    const folder = path.dirname(f);
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder)!.push(f);
  }

  for (const filePath of mecanicaFiles) {
    const json     = readJson(filePath);
    const key      = mecanicaKey(filePath);
    const moduleId = MECANICA_MODULE_MAP[key] ?? json.moduleId;

    // Advisory module-existence check (Quiz.moduleId has no FK in Prisma schema —
    // a missing module will NOT cause a DB error; we warn and continue).
    const moduleExists = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!moduleExists) {
      console.warn(`  ⚠  Quiz "${json.id}": moduleId "${moduleId}" not in modules table (stored as-is)`);
    }

    const folder = path.dirname(filePath);
    const order  = (byFolder.get(folder) ?? []).indexOf(filePath);

    await prisma.quiz.upsert({
      where:  { id: json.id },
      update: { title: json.title, description: json.description, moduleId, questions: json.questions as any, passingScore: json.passingScore, isActive: true, order },
      create: { id: json.id, title: json.title, description: json.description, moduleId, questions: json.questions as any, passingScore: json.passingScore, isActive: true, order },
    });
    count++;
  }

  // ── ventylab ──────────────────────────────────────────────────────────────
  const ventylabDir   = path.join(EVAL_DIR, 'quizzes', 'ventylab');
  const ventylabFiles = collectJsonFiles(ventylabDir);

  const vByFolder = new Map<string, string[]>();
  for (const f of ventylabFiles) {
    const folder = path.dirname(f);
    if (!vByFolder.has(folder)) vByFolder.set(folder, []);
    vByFolder.get(folder)!.push(f);
  }

  for (const filePath of ventylabFiles) {
    const json     = readJson(filePath);
    const moduleId = json.moduleId;

    // Advisory check — ventylab moduleIds use a different naming convention
    const moduleExists = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!moduleExists) {
      console.warn(`  ⚠  Quiz "${json.id}": moduleId "${moduleId}" not in modules table (stored as-is)`);
    }

    const folder = path.dirname(filePath);
    const order  = (vByFolder.get(folder) ?? []).indexOf(filePath);

    await prisma.quiz.upsert({
      where:  { id: json.id },
      update: { title: json.title, description: json.description, moduleId, questions: json.questions as any, passingScore: json.passingScore, isActive: true, order },
      create: { id: json.id, title: json.title, description: json.description, moduleId, questions: json.questions as any, passingScore: json.passingScore, isActive: true, order },
    });
    count++;
  }

  return count;
}

// ─── Seed: Exams ──────────────────────────────────────────────────────────────

async function seedExams(createdBy: string): Promise<number> {
  let count = 0;
  const examsDir = path.join(EVAL_DIR, 'examenes');

  for (const filePath of collectJsonFiles(examsDir)) {
    const json = readJson(filePath);

    // Store full question data (with explanations) in `instructions` as JSON string.
    const instructions = JSON.stringify(
      { moduleId: json.moduleId, level: json.level, passingScore: json.passingScore, questions: json.questions },
      null,
      2,
    );

    await prisma.activity.upsert({
      where:  { id: json.id },
      update: { title: json.title, description: json.description, instructions, type: 'EXAM', maxScore: 100, isPublished: true, isActive: true },
      create: { id: json.id, title: json.title, description: json.description, instructions, type: 'EXAM', maxScore: 100, isPublished: true, isActive: true, createdBy },
    });
    count++;
  }

  return count;
}

// ─── Seed: Talleres ───────────────────────────────────────────────────────────

async function seedTalleres(createdBy: string): Promise<number> {
  let count = 0;
  const talleresDir = path.join(EVAL_DIR, 'talleres');

  for (const filePath of collectJsonFiles(talleresDir)) {
    const json = readJson(filePath);

    // Store caseStudy + questions in `instructions` as JSON string.
    const instructions = JSON.stringify(
      { moduleId: json.moduleId, level: json.level, passingScore: json.passingScore, caseStudy: json.caseStudy ?? null, questions: json.questions },
      null,
      2,
    );

    await prisma.activity.upsert({
      where:  { id: json.id },
      update: { title: json.title, description: json.description, instructions, type: 'TALLER', maxScore: 100, isPublished: true, isActive: true },
      create: { id: json.id, title: json.title, description: json.description, instructions, type: 'TALLER', maxScore: 100, isPublished: true, isActive: true, createdBy },
    });
    count++;
  }

  return count;
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
  const examCount = await seedExams(createdBy);
  console.log(`✅  Seeded ${examCount} exams`);

  console.log('\n🔧  Seeding talleres...');
  const tallerCount = await seedTalleres(createdBy);
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
