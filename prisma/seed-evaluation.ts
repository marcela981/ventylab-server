/**
 * seed-evaluation.ts
 * ==================
 * Seeds quizzes, exams and talleres from frontend JSON files into the database.
 *
 * Sources : ../../ventilab-web/src/features/ensenanza/shared/data/evaluation/
 *   quizzes/mecanica/{principiante,intermedio,avanzado}/*.json  → table: quizzes
 *   quizzes/ventylab/{principiante,intermedio,avanzado}/*.json  → table: quizzes
 *   examenes/**\/final.json                                     → table: activities (EXAM)
 *   talleres/**\/*.json                                         → table: activities (TALLER)
 *
 * SAFE TO RE-RUN: uses prisma upsert throughout.
 *
 * Run:
 *   npx tsx prisma/seed-evaluation.ts
 *   npm run seed:evaluation
 *
 * Autor   : Marcela Mazo Castro
 * Proyecto: VentyLab
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ─── Paths ───────────────────────────────────────────────────────────────────

const EVAL_DIR = path.resolve(
  __dirname,
  '../../ventilab-web/src/features/ensenanza/shared/data/evaluation'
);

// ─── moduleId override map for mecanica quizzes ───────────────────────────────
// Key: relative path from the quizzes/mecanica/ directory (level/basename without .json)
const MECANICA_MODULE_MAP: Record<string, string> = {
  'principiante/inversion-fisiologica':  'module-01-inversion-fisiologica',
  'principiante/ecuacion-movimiento':    'module-02-ecuacion-movimiento',
  'principiante/variables-fase':         'module-03-variables-fase',
  'principiante/modos-ventilatorios':    'module-04-modos-ventilatorios',
  'principiante/monitorizacion-grafica': 'module-05-monitorizacion-grafica',
  'principiante/efectos-sistemicos':     'module-06-efectos-sistemicos',
  'intermedio/vcv-vs-pcv':               'module-01-vcv-vs-pcv',
  'intermedio/peep':                     'module-02-peep-optimizar-oxigenacion',
  'intermedio/psv-cpap':                 'module-03-soporte-psv-cpap',
  'intermedio/duales-simv':              'module-04-duales-simv',
  'intermedio/graficas':                 'module-05-graficas-fine-tuning',
  'intermedio/destete':                  'module-06-evaluacion-destete',
  'avanzado/vili':                       'module-01-dano-pulmonar-vili',
  'avanzado/monitorizacion':             'module-02-monitorizacion-alto-nivel',
  'avanzado/asincronias':                'module-03-asincronias',
  'avanzado/destete-complejo':           'module-04-destete-vmni',
  'avanzado/obesidad':                   'module-05-obesidad',
  'avanzado/epoc-asma':                  'module-06-epoc-asma',
  'avanzado/sdra':                       'module-07-sdra',
  'avanzado/recuperacion':               'module-08-recuperacion',
};

// ─── Type definitions ─────────────────────────────────────────────────────────

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string; // present in taller scenario_choice
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

function readJson(filePath: string): EvalJson {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as EvalJson;
}

/** Walk a directory tree and collect all .json file paths */
function collectJsonFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

/** Derive the mecanica map key from a full file path */
function mecanicaKey(filePath: string): string {
  const base = path.basename(filePath, '.json');
  const level = path.basename(path.dirname(filePath)); // principiante | intermedio | avanzado
  return `${level}/${base}`;
}

// ─── Seed functions ───────────────────────────────────────────────────────────

async function seedQuizzes(creatorId: string): Promise<number> {
  let count = 0;

  // ── mecanica quizzes ────────────────────────────────────────────────────────
  const mecanicaDir = path.join(EVAL_DIR, 'quizzes', 'mecanica');
  for (const filePath of collectJsonFiles(mecanicaDir)) {
    const json = readJson(filePath);
    const key   = mecanicaKey(filePath);
    const moduleId = MECANICA_MODULE_MAP[key] ?? json.moduleId;

    await prisma.quiz.upsert({
      where:  { id: json.id },
      update: {
        title:       json.title,
        description: json.description,
        moduleId,
        questions:   json.questions as any,
        passingScore: json.passingScore,
        isActive:    true,
      },
      create: {
        id:          json.id,
        title:       json.title,
        description: json.description,
        moduleId,
        questions:   json.questions as any,
        passingScore: json.passingScore,
        order:       0,
        isActive:    true,
      },
    });
    count++;
  }

  // ── ventylab quizzes ────────────────────────────────────────────────────────
  // These have no mecanica module mapping; use the moduleId from the JSON as-is.
  const ventylabDir = path.join(EVAL_DIR, 'quizzes', 'ventylab');
  for (const filePath of collectJsonFiles(ventylabDir)) {
    const json = readJson(filePath);

    await prisma.quiz.upsert({
      where:  { id: json.id },
      update: {
        title:       json.title,
        description: json.description,
        moduleId:    json.moduleId,
        questions:   json.questions as any,
        passingScore: json.passingScore,
        isActive:    true,
      },
      create: {
        id:          json.id,
        title:       json.title,
        description: json.description,
        moduleId:    json.moduleId,
        questions:   json.questions as any,
        passingScore: json.passingScore,
        order:       0,
        isActive:    true,
      },
    });
    count++;
  }

  return count;
}

async function seedExams(creatorId: string): Promise<number> {
  let count = 0;
  const examsDir = path.join(EVAL_DIR, 'examenes');

  for (const filePath of collectJsonFiles(examsDir)) {
    const json = readJson(filePath);

    // Store the full question set as JSON in `instructions`.
    // `description` keeps the human-readable text.
    const instructionsJson = JSON.stringify({
      moduleId:    json.moduleId,
      level:       json.level,
      passingScore: json.passingScore,
      questions:   json.questions,
    }, null, 2);

    await prisma.activity.upsert({
      where:  { id: json.id },
      update: {
        title:        json.title,
        description:  json.description,
        instructions: instructionsJson,
        type:         'EXAM',
        maxScore:     100,
        isPublished:  true,
        isActive:     true,
      },
      create: {
        id:           json.id,
        title:        json.title,
        description:  json.description,
        instructions: instructionsJson,
        type:         'EXAM',
        maxScore:     100,
        isPublished:  true,
        isActive:     true,
        createdBy:    creatorId,
      },
    });
    count++;
  }

  return count;
}

async function seedTalleres(creatorId: string): Promise<number> {
  let count = 0;
  const talleresDir = path.join(EVAL_DIR, 'talleres');

  for (const filePath of collectJsonFiles(talleresDir)) {
    const json = readJson(filePath);

    // Store caseStudy + questions as structured JSON in `instructions`.
    const instructionsJson = JSON.stringify({
      moduleId:    json.moduleId,
      level:       json.level,
      passingScore: json.passingScore,
      caseStudy:   json.caseStudy ?? null,
      questions:   json.questions,
    }, null, 2);

    await prisma.activity.upsert({
      where:  { id: json.id },
      update: {
        title:        json.title,
        description:  json.description,
        instructions: instructionsJson,
        type:         'TALLER',
        maxScore:     100,
        isPublished:  true,
        isActive:     true,
      },
      create: {
        id:           json.id,
        title:        json.title,
        description:  json.description,
        instructions: instructionsJson,
        type:         'TALLER',
        maxScore:     100,
        isPublished:  true,
        isActive:     true,
        createdBy:    creatorId,
      },
    });
    count++;
  }

  return count;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 seed-evaluation: starting...\n');

  // Verify evaluation data directory
  if (!fs.existsSync(EVAL_DIR)) {
    console.error(`✗  Evaluation data directory not found:\n   ${EVAL_DIR}`);
    console.error('   Make sure ventilab-web is cloned alongside ventylab-server.');
    process.exit(1);
  }

  // Resolve createdBy: first ADMIN or TEACHER user in DB
  const creator = await prisma.user.findFirst({
    where:   { role: { in: ['ADMIN', 'TEACHER'] } },
    select:  { id: true, email: true, role: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!creator) {
    console.error('✗  No ADMIN or TEACHER user found in the database.');
    console.error('   Run the main seed first: npx prisma db seed');
    process.exit(1);
  }

  console.log(`   Using creator: ${creator.email} (${creator.role})`);
  console.log(`   Eval dir:      ${EVAL_DIR}\n`);

  const quizCount   = await seedQuizzes(creator.id);
  const examCount   = await seedExams(creator.id);
  const tallerCount = await seedTalleres(creator.id);

  console.log('─'.repeat(50));
  console.log(`✔  Seeded: ${quizCount} quizzes, ${examCount} exams, ${tallerCount} talleres`);
  console.log('─'.repeat(50));
}

main()
  .catch((err) => {
    console.error('seed-evaluation failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
