/*
 * Funcionalidad: Pruebas del mapeo del seed de evaluaciones
 * Descripción: Verifica que el mapeo puro del seed produce, para un quiz, un examen y un taller, los mismos ids, la misma forma TipTap y los mismos campos legacy_* que la migración 20261007120000_evaluation_feature genera desde quizzes y activities, y que los JSON reales de prisma/seed-data/evaluation dan 26 quizzes, 6 exámenes y 9 talleres con ids únicos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import * as fs from "fs";
import * as path from "path";

import {
  activityInstructions,
  type EvalJson,
  mapActivitySeed,
  mapQuizSeed,
  type SeedEvaluationBundle,
  type SeedQuestionRow,
} from "./evaluation-seed.mapper";

const QUIZ_JSON: EvalJson = {
  id: "quiz-x",
  type: "quiz",
  title: "Quiz X",
  description: "Quiz description",
  moduleId: "json-module",
  level: "level01-principiante",
  passingScore: 70,
  questions: [
    {
      id: "q1",
      type: "multiple_choice",
      text: "First prompt",
      explanation: "Because",
      options: [
        { id: "a", text: "Right", isCorrect: true, feedback: "Yes" },
        { id: "b", text: "Wrong", isCorrect: false },
      ],
    },
    { id: "q2", type: "true_false", text: "Second prompt", options: [{ id: "t", text: "True", isCorrect: true }, { id: "f", text: "False", isCorrect: false }] },
    { id: "q2", type: "multiple_choice", question: "Fallback prompt", options: [{ id: "a", label: "L1", isCorrect: "TRUE" }, { id: "a", isCorrect: true }] },
    { type: "scenario_choice", text: "", options: [] },
  ],
};

const TALLER_JSON: EvalJson = {
  id: "taller-x",
  type: "taller",
  title: "Taller X",
  description: "Taller description",
  moduleId: "level03-talleres",
  level: "level03-avanzado",
  passingScore: 80,
  caseStudy: { patient: "Patient line", scenario: "", objective: "Objective line" },
  questions: [{ id: "t1q1", type: "scenario_choice", text: "Scenario prompt", options: [{ id: "a", text: "Only", isCorrect: true }] }],
};

const EVAL_DIR: string = path.resolve(__dirname, "../seed-data/evaluation");

function collectJsonFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a: fs.Dirent, b: fs.Dirent) => a.name.localeCompare(b.name))
    .flatMap((entry: fs.Dirent): string[] => {
      const full: string = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return collectJsonFiles(full);
      }

      return entry.name.endsWith(".json") ? [full] : [];
    });
}

function readJson(file: string): EvalJson {
  return JSON.parse(fs.readFileSync(file, "utf-8")) as EvalJson;
}

function paragraph(text: string): { type: string; content: { type: string; text: string }[] } {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

describe("mapQuizSeed", () => {
  it("maps a quiz row exactly like section 4 of the migration", () => {
    const bundle: SeedEvaluationBundle = mapQuizSeed(QUIZ_JSON, { moduleRef: "module-01-x", moduleExists: true, order: 3 });

    expect(bundle.evaluation).toEqual({
      id: "quiz-x",
      type: "QUIZ",
      title: "Quiz X",
      description: "Quiz description",
      moduleId: "module-01-x",
      levelId: null,
      lessonId: null,
      durationMinutes: null,
      maxAttempts: 1,
      shuffleQuestions: false,
      showResultsImmediately: true,
      status: "READY",
      order: 3,
      createdById: null,
      legacySource: "quiz",
      legacyType: null,
      legacyPassingScore: 70,
      legacyMaxScore: null,
      legacyDueDate: null,
      legacyModuleRef: "module-01-x",
      legacyInstructions: null,
    });
    expect(bundle.scenario).toBeNull();
  });

  it("keeps an unknown module only in legacy_module_ref", () => {
    const bundle: SeedEvaluationBundle = mapQuizSeed(QUIZ_JSON, { moduleRef: "missing", moduleExists: false, order: 0 });

    expect(bundle.evaluation.moduleId).toBeNull();
    expect(bundle.evaluation.legacyModuleRef).toBe("missing");
  });

  it("expands questions and options with the migration id, type, prompt and legacy rules", () => {
    const questions: SeedQuestionRow[] = mapQuizSeed(QUIZ_JSON, { moduleRef: "m", moduleExists: true, order: 0 }).questions;

    expect(questions.map((question: SeedQuestionRow) => [question.id, question.order, question.type, question.legacyType, question.legacyRef])).toEqual([
      ["quiz-x:q1", 1, "SINGLE_CHOICE", "multiple_choice", "q1"],
      ["quiz-x:#2", 2, "TRUE_FALSE", "true_false", "q2"],
      ["quiz-x:#3", 3, "MULTIPLE_CHOICE", "multiple_choice", "q2"],
      ["quiz-x:#4", 4, "SINGLE_CHOICE", "scenario_choice", null],
    ]);
    expect(questions[0]).toEqual({
      id: "quiz-x:q1",
      evaluationId: "quiz-x",
      scenarioId: null,
      order: 1,
      type: "SINGLE_CHOICE",
      prompt: { type: "doc", content: [paragraph("First prompt")] },
      mediaIds: [],
      points: 1,
      explanation: "Because",
      clinicalCaseId: null,
      legacyType: "multiple_choice",
      legacyRef: "q1",
      options: [
        { id: "quiz-x:q1:a", questionId: "quiz-x:q1", order: 1, content: "Right", mediaId: null, isCorrect: true, legacyFeedback: "Yes", legacyRef: "a" },
        { id: "quiz-x:q1:b", questionId: "quiz-x:q1", order: 2, content: "Wrong", mediaId: null, isCorrect: false, legacyFeedback: null, legacyRef: "b" },
      ],
    });
    expect(questions[2].prompt).toEqual({ type: "doc", content: [paragraph("Fallback prompt")] });
    expect(questions[2].options.map((option: SeedQuestionRow["options"][number]) => [option.id, option.content, option.isCorrect])).toEqual([
      ["quiz-x:#3:#1", "L1", true],
      ["quiz-x:#3:#2", "", true],
    ]);
    expect(questions[3].prompt).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
    expect(questions[3].options).toEqual([]);
  });
});

describe("mapActivitySeed", () => {
  it("maps a taller like section 5 and 5.1 of the migration, with the caseStudy scenario shared by its questions", () => {
    const bundle: SeedEvaluationBundle = mapActivitySeed(TALLER_JSON, "TALLER", { moduleExists: false, levelExists: true, createdById: "teacher-1" });

    expect(bundle.evaluation).toEqual({
      id: "taller-x",
      type: "WORKSHOP",
      title: "Taller X",
      description: "Taller description",
      moduleId: null,
      levelId: "level03-avanzado",
      lessonId: null,
      durationMinutes: null,
      maxAttempts: 1,
      shuffleQuestions: false,
      showResultsImmediately: false,
      status: "READY",
      order: 0,
      createdById: "teacher-1",
      legacySource: "activity",
      legacyType: "TALLER",
      legacyPassingScore: 80,
      legacyMaxScore: 100,
      legacyDueDate: null,
      legacyModuleRef: "level03-talleres",
      legacyInstructions: JSON.stringify(
        { moduleId: "level03-talleres", level: "level03-avanzado", passingScore: 80, caseStudy: TALLER_JSON.caseStudy, questions: TALLER_JSON.questions },
        null,
        2,
      ),
    });
    expect(bundle.scenario).toEqual({
      id: "taller-x:scenario",
      evaluationId: "taller-x",
      order: 1,
      content: { type: "doc", content: [paragraph("Patient line"), paragraph("Objective line")] },
      mediaIds: [],
    });
    expect(bundle.questions.map((question: SeedQuestionRow) => [question.id, question.scenarioId, question.type])).toEqual([["taller-x:t1q1", "taller-x:scenario", "SINGLE_CHOICE"]]);
    expect(bundle.questions[0].options[0].id).toBe("taller-x:t1q1:a");
  });

  it("maps an exam without caseStudy key to EXAM with no scenario", () => {
    const exam: EvalJson = { ...TALLER_JSON, id: "exam-x", type: "examen", caseStudy: undefined };

    const bundle: SeedEvaluationBundle = mapActivitySeed(exam, "EXAM", { moduleExists: true, levelExists: false, createdById: "teacher-1" });

    expect(bundle.evaluation.type).toBe("EXAM");
    expect(bundle.evaluation.legacyType).toBe("EXAM");
    expect(bundle.evaluation.moduleId).toBe("level03-talleres");
    expect(bundle.evaluation.levelId).toBeNull();
    expect(bundle.evaluation.legacyInstructions).toBe(activityInstructions(exam, "EXAM"));
    expect(bundle.evaluation.legacyInstructions).not.toContain("caseStudy");
    expect(bundle.scenario).toBeNull();
    expect(bundle.questions[0].scenarioId).toBeNull();
  });

  it("creates no scenario for a taller whose caseStudy is null", () => {
    const bundle: SeedEvaluationBundle = mapActivitySeed({ ...TALLER_JSON, caseStudy: undefined }, "TALLER", { moduleExists: true, levelExists: true, createdById: null });

    expect(bundle.scenario).toBeNull();
    expect(bundle.questions[0].scenarioId).toBeNull();
  });
});

describe("seed data files", () => {
  it("yield the OE2 counts (26 quizzes, 6 exams, 9 talleres) with unique evaluation, question and option ids", () => {
    const quizzes: SeedEvaluationBundle[] = collectJsonFiles(path.join(EVAL_DIR, "quizzes")).map((file: string) =>
      mapQuizSeed(readJson(file), { moduleRef: "m", moduleExists: true, order: 0 }),
    );
    const exams: SeedEvaluationBundle[] = collectJsonFiles(path.join(EVAL_DIR, "examenes")).map((file: string) =>
      mapActivitySeed(readJson(file), "EXAM", { moduleExists: true, levelExists: true, createdById: null }),
    );
    const talleres: SeedEvaluationBundle[] = collectJsonFiles(path.join(EVAL_DIR, "talleres")).map((file: string) =>
      mapActivitySeed(readJson(file), "TALLER", { moduleExists: true, levelExists: true, createdById: null }),
    );
    const all: SeedEvaluationBundle[] = [...quizzes, ...exams, ...talleres];
    const questionIds: string[] = all.flatMap((bundle: SeedEvaluationBundle) => bundle.questions.map((question: SeedQuestionRow) => question.id));
    const optionIds: string[] = all.flatMap((bundle: SeedEvaluationBundle) =>
      bundle.questions.flatMap((question: SeedQuestionRow) => question.options.map((option: SeedQuestionRow["options"][number]) => option.id)),
    );

    expect([quizzes.length, exams.length, talleres.length]).toEqual([26, 6, 9]);
    expect(new Set(all.map((bundle: SeedEvaluationBundle) => bundle.evaluation.id)).size).toBe(41);
    expect(new Set(questionIds).size).toBe(questionIds.length);
    expect(new Set(optionIds).size).toBe(optionIds.length);
    expect(talleres.every((bundle: SeedEvaluationBundle) => bundle.scenario !== null)).toBe(true);
    expect(all.every((bundle: SeedEvaluationBundle) => bundle.questions.length > 0)).toBe(true);
  });
});
