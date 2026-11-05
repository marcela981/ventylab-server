/*
 * Funcionalidad: Importación idempotente de evaluaciones alineadas con el currículo (ajustes C3)
 * Descripción: Vincula las 41 evaluaciones de julio (prisma/seed-data/evaluation/**, mismos ids que la migración y el seed de evaluación) con los módulos y niveles vigentes del currículo del Bloque B y crea las evaluaciones nuevas del Bloque C (prisma/seed-data/evaluation-curriculum/*.json: al menos un QUIZ por módulo, un WORKSHOP y un EXAM final por nivel con una pregunta SIMULATION). Reglas de escritura: una evaluación de julio que falta se crea completa con el mapeador del seed; una que existe solo actualiza moduleId y levelId (nunca su contenido, que pudo editar un docente); una evaluación c3-* se crea o se sincroniza solo mientras no tenga intentos; la pregunta SIMULATION de un examen de julio se agrega solo si el examen no tiene intentos. Todo queda en READY y sin asignar; nunca borra filas. Por defecto es una corrida en seco: escribe solo con --apply
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 *
 * Uso:
 *   npx tsx prisma/import-evaluations.ts            # corrida en seco: muestra lo que haría
 *   npx tsx prisma/import-evaluations.ts --apply    # escribe (después de importar el currículo del Bloque B)
 */
import * as fs from "fs";
import * as path from "path";

import { type Prisma, PrismaClient } from "@prisma/client";

import {
  type CurriculumEvaluationBundle,
  type CurriculumEvaluationJson,
  type CurriculumQuestionJson,
  type CurriculumQuestionRow,
  liveLevelForJulyPath,
  liveModuleFor,
  mapCurriculumEvaluation,
  mapCurriculumQuestion,
  validateCurriculumEvaluation,
  validateCurriculumQuestion,
} from "./seed-helpers/evaluation-curriculum.mapper";
import { type EvalJson, mapActivitySeed, mapQuizSeed, type SeedEvaluationBundle } from "./seed-helpers/evaluation-seed.mapper";

const prisma: PrismaClient = new PrismaClient();
const APPLY: boolean = process.argv.includes("--apply");
const JULY_DIR: string = path.join(__dirname, "seed-data", "evaluation");
const CURRICULUM_DIR: string = path.join(__dirname, "seed-data", "evaluation-curriculum");
const JULY_SIMULATION_FILES: readonly string[] = ["july-exam-simulation-questions.json"];

interface Summary {
  julyCreated: number;
  julyLinked: number;
  julyUnchanged: number;
  c3Created: number;
  c3Synced: number;
  c3Skipped: number;
  simulationAdded: number;
  simulationSkipped: number;
  warnings: string[];
}

function listJson(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry: fs.Dirent): string[] => {
      const full: string = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return listJson(full);
      }

      return entry.name.endsWith(".json") ? [full] : [];
    })
    .sort();
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

async function existingIds(table: "module" | "level"): Promise<Set<string>> {
  const rows: { id: string }[] = table === "module" ? await prisma.module.findMany({ select: { id: true } }) : await prisma.level.findMany({ select: { id: true } });

  return new Set<string>(rows.map((row: { id: string }) => row.id));
}

async function attemptCount(evaluationId: string): Promise<number> {
  return await prisma.studentEvaluationAttempt.count({ where: { evaluationId } });
}

function julyBundle(file: string, order: number): { bundle: SeedEvaluationBundle; liveModule: string | null | undefined; liveLevel: string | null } {
  const json: EvalJson = readJson<EvalJson>(file);
  const segments: string[] = path.relative(JULY_DIR, file).split(path.sep);
  const kind: string = segments[0];
  const liveLevel: string | null = liveLevelForJulyPath(segments);
  const liveModule: string | null | undefined = liveModuleFor(json.moduleId);
  const bundle: SeedEvaluationBundle =
    kind === "quizzes"
      ? mapQuizSeed(json, { moduleRef: json.moduleId, moduleExists: false, order })
      : mapActivitySeed(json, kind === "examenes" ? "EXAM" : "TALLER", { moduleExists: false, levelExists: false, createdById: null });

  return { bundle, liveModule, liveLevel };
}

async function createJulyBundle(bundle: SeedEvaluationBundle, link: { moduleId: string | null; levelId: string | null }): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.evaluation.create({ data: { ...bundle.evaluation, ...link } });

    if (bundle.scenario) {
      await tx.evaluationScenario.create({ data: { ...bundle.scenario, content: bundle.scenario.content as unknown as Prisma.InputJsonValue } });
    }

    for (const { options, ...question } of bundle.questions) {
      await tx.evaluationQuestion.create({ data: { ...question, prompt: question.prompt as unknown as Prisma.InputJsonValue } });

      for (const option of options) {
        await tx.evaluationQuestionOption.create({ data: option });
      }
    }
  });
}

async function importJuly(modules: Set<string>, levels: Set<string>, summary: Summary): Promise<void> {
  const files: string[] = listJson(JULY_DIR);

  for (const [index, file] of files.entries()) {
    const { bundle, liveModule, liveLevel } = julyBundle(file, index);
    const moduleId: string | null = liveModule && modules.has(liveModule) ? liveModule : null;
    const levelId: string | null = liveLevel && levels.has(liveLevel) ? liveLevel : null;

    if (liveModule && !modules.has(liveModule)) {
      summary.warnings.push(`${bundle.evaluation.id}: module ${liveModule} is not in the database yet (run the Block B curriculum import first)`);
    }

    if (liveLevel && !levels.has(liveLevel)) {
      summary.warnings.push(`${bundle.evaluation.id}: level ${liveLevel} is not in the database`);
    }

    const current: { moduleId: string | null; levelId: string | null } | null = await prisma.evaluation.findUnique({
      where: { id: bundle.evaluation.id },
      select: { moduleId: true, levelId: true },
    });

    if (!current) {
      summary.julyCreated++;
      console.log(`  + ${bundle.evaluation.id} (${bundle.evaluation.type}) → module ${moduleId ?? "—"}, level ${levelId ?? "—"}`);

      if (APPLY) {
        await createJulyBundle(bundle, { moduleId, levelId });
      }

      continue;
    }

    if (current.moduleId === moduleId && current.levelId === levelId) {
      summary.julyUnchanged++;
      continue;
    }

    summary.julyLinked++;
    console.log(`  ~ ${bundle.evaluation.id}: module ${current.moduleId ?? "—"} → ${moduleId ?? "—"}, level ${current.levelId ?? "—"} → ${levelId ?? "—"}`);

    if (APPLY) {
      await prisma.evaluation.update({ where: { id: bundle.evaluation.id }, data: { moduleId, levelId } });
    }
  }
}

async function writeQuestion(tx: Prisma.TransactionClient, question: CurriculumQuestionRow): Promise<void> {
  const { options, ...fields } = question;
  const data: Prisma.EvaluationQuestionUncheckedCreateInput = {
    ...fields,
    prompt: fields.prompt as unknown as Prisma.InputJsonValue,
    rubric: fields.rubric === null ? undefined : (fields.rubric as Prisma.InputJsonValue),
  };

  await tx.evaluationQuestion.upsert({ where: { id: question.id }, create: data, update: data });

  for (const option of options) {
    await tx.evaluationQuestionOption.upsert({ where: { id: option.id }, create: option, update: option });
  }
}

async function importCurriculumEvaluations(modules: Set<string>, levels: Set<string>, summary: Summary): Promise<void> {
  const files: string[] = listJson(CURRICULUM_DIR).filter((file: string) => !JULY_SIMULATION_FILES.includes(path.basename(file)) && path.basename(file) !== "july-sources.json");

  for (const [index, file] of files.entries()) {
    const json: CurriculumEvaluationJson = readJson<CurriculumEvaluationJson>(file);
    const errors: string[] = validateCurriculumEvaluation(json);

    if (json.moduleId !== null && !modules.has(json.moduleId)) {
      errors.push(`${json.id}: module ${json.moduleId} is not in the database (run the Block B curriculum import first)`);
    }

    if (!levels.has(json.levelId)) {
      errors.push(`${json.id}: level ${json.levelId} is not in the database`);
    }

    if (errors.length > 0) {
      throw new Error(`Invalid evaluation file ${path.basename(file)}:\n  ${errors.join("\n  ")}`);
    }

    const bundle: CurriculumEvaluationBundle = mapCurriculumEvaluation(json, index);
    const exists: boolean = (await prisma.evaluation.findUnique({ where: { id: json.id }, select: { id: true } })) !== null;

    if (exists && (await attemptCount(json.id)) > 0) {
      summary.c3Skipped++;
      summary.warnings.push(`${json.id}: has attempts, its content is left as it is`);
      continue;
    }

    if (exists) {
      summary.c3Synced++;
    } else {
      summary.c3Created++;
    }

    console.log(`  ${exists ? "~" : "+"} ${json.id} (${json.type}, ${json.questions.length} preguntas) → module ${json.moduleId ?? "—"}, level ${json.levelId}`);

    if (!APPLY) {
      continue;
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.evaluation.upsert({ where: { id: json.id }, create: bundle.evaluation, update: bundle.evaluation });

      if (bundle.scenario) {
        const scenario: Prisma.EvaluationScenarioUncheckedCreateInput = { ...bundle.scenario, content: bundle.scenario.content as unknown as Prisma.InputJsonValue };

        await tx.evaluationScenario.upsert({ where: { id: bundle.scenario.id }, create: scenario, update: scenario });
      }

      for (const question of bundle.questions) {
        await writeQuestion(tx, question);
      }
    });
  }
}

async function appendJulySimulations(summary: Summary): Promise<void> {
  for (const name of JULY_SIMULATION_FILES) {
    const file: string = path.join(CURRICULUM_DIR, name);

    if (!fs.existsSync(file)) {
      continue;
    }

    const entries: Record<string, unknown> = readJson<Record<string, unknown>>(file);

    for (const [examId, raw] of Object.entries(entries)) {
      if (examId === "sources") {
        continue;
      }

      const question: CurriculumQuestionJson = { ...(raw as CurriculumQuestionJson), key: "c3-simulation" };
      const errors: string[] = validateCurriculumQuestion(question, "EXAM");

      if (errors.length > 0) {
        throw new Error(`Invalid SIMULATION question for ${examId}:\n  ${errors.join("\n  ")}`);
      }

      const exam: { id: string; _count: { questions: number } } | null = await prisma.evaluation.findUnique({
        where: { id: examId },
        select: { id: true, _count: { select: { questions: true } } },
      });

      if (!exam) {
        summary.warnings.push(`${examId}: exam not found, SIMULATION question not added`);
        continue;
      }

      const row: CurriculumQuestionRow = mapCurriculumQuestion(examId, question, exam._count.questions + 1, null);
      const present: boolean = (await prisma.evaluationQuestion.findUnique({ where: { id: row.id }, select: { id: true } })) !== null;

      if (present) {
        continue;
      }

      if ((await attemptCount(examId)) > 0) {
        summary.simulationSkipped++;
        summary.warnings.push(`${examId}: has attempts, the SIMULATION question was not added (adding a question would change past grades)`);
        continue;
      }

      summary.simulationAdded++;
      console.log(`  + ${row.id} (SIMULATION, caso ${row.clinicalCaseId})`);

      if (APPLY) {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => writeQuestion(tx, row));
      }
    }
  }
}

async function main(): Promise<void> {
  console.log(APPLY ? "Importing curriculum-aligned evaluations (--apply)" : "Dry run (no writes); use --apply to import");

  const summary: Summary = { julyCreated: 0, julyLinked: 0, julyUnchanged: 0, c3Created: 0, c3Synced: 0, c3Skipped: 0, simulationAdded: 0, simulationSkipped: 0, warnings: [] };
  const modules: Set<string> = await existingIds("module");
  const levels: Set<string> = await existingIds("level");

  console.log("July evaluations:");
  await importJuly(modules, levels, summary);
  console.log("Block C evaluations:");
  await importCurriculumEvaluations(modules, levels, summary);
  console.log("SIMULATION questions of the July exams:");
  await appendJulySimulations(summary);

  console.log(
    [
      `July: ${summary.julyCreated} created, ${summary.julyLinked} linked to the curriculum, ${summary.julyUnchanged} unchanged`,
      `Block C: ${summary.c3Created} created, ${summary.c3Synced} synced, ${summary.c3Skipped} skipped (with attempts)`,
      `SIMULATION: ${summary.simulationAdded} added, ${summary.simulationSkipped} skipped (with attempts)`,
    ].join("\n"),
  );

  for (const warning of summary.warnings) {
    console.warn(`  ⚠  ${warning}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
