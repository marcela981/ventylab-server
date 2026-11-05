/*
 * Funcionalidad: Pruebas del mapeador de evaluaciones alineadas con el currículo
 * Descripción: Verifica la correspondencia de módulos y niveles de julio con el currículo vigente, la validación de las evaluaciones nuevas (opciones por tipo, explicación con fuente, pista solo en talleres, examen con SIMULATION, rúbrica válida) y los ids deterministas de preguntas y opciones; también valida todos los archivos versionados de prisma/seed-data/evaluation-curriculum
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
  type CurriculumEvaluationJson,
  type CurriculumQuestionJson,
  liveLevelForJulyPath,
  liveModuleFor,
  mapCurriculumEvaluation,
  validateCurriculumEvaluation,
  validateCurriculumQuestion,
} from "./evaluation-curriculum.mapper";

const SOURCE: string = "La PEEP mantiene abiertos los alvéolos. Fuente: Hess y Kacmarek (2019).";
const RUBRIC: unknown = { criteria: [{ parameter: "peep", expectedValue: 5, min: 5, max: 8, priority: "CRITICO" }] };

function choice(key: string): CurriculumQuestionJson {
  return { key, type: "SINGLE_CHOICE", prompt: "¿Qué hace la PEEP?", explanation: SOURCE, options: [{ text: "Mantiene abiertos los alvéolos", isCorrect: true }, { text: "Nada", isCorrect: false }] };
}

function evaluation(overrides: Partial<CurriculumEvaluationJson> = {}): CurriculumEvaluationJson {
  return {
    id: "c3-quiz-demo",
    type: "QUIZ",
    title: "Quiz",
    description: "Demo",
    levelId: "level-beginner",
    moduleId: "module-01-inversion-fisiologica",
    questions: [choice("q1")],
    sources: ["Hess, D. R., & Kacmarek, R. M. (2019). Essentials of mechanical ventilation (4.ª ed.). McGraw-Hill."],
    ...overrides,
  };
}

describe("July curriculum mapping", () => {
  it("should map July module ids to the live modules and archived ones to null", () => {
    expect(liveModuleFor("module-03-soporte-PSV-CPAP")).toBe("module-03-soporte-psv-cpap");
    expect(liveModuleFor("ventilador_compontentes")).toBe("ventylab-module-02-ventilador-componentes");
    expect(liveModuleFor("historia_fisiología_aplicada")).toBeNull();
    expect(liveModuleFor("level01-talleres")).toBeUndefined();
  });

  it("should take the live level from the track and level folders", () => {
    expect(liveLevelForJulyPath(["quizzes", "mecanica", "intermedio", "peep.json"])).toBe("level-intermedio");
    expect(liveLevelForJulyPath(["examenes", "ventylab", "avanzado", "final.json"])).toBe("ventylab-avanzado");
    expect(liveLevelForJulyPath(["otros", "final.json"])).toBeNull();
  });
});

describe("validateCurriculumEvaluation", () => {
  it("should accept a well formed quiz", () => {
    expect(validateCurriculumEvaluation(evaluation())).toEqual([]);
  });

  it("should require a source at the end of every explanation", () => {
    expect(validateCurriculumEvaluation(evaluation({ questions: [{ ...choice("q1"), explanation: "Sin fuente." }] }))).toEqual([
      'c3-quiz-demo/q1: explanation must end with "Fuente: <autor> (<año>)."',
    ]);
  });

  it("should require a SIMULATION question in every EXAM and a valid rubric", () => {
    expect(validateCurriculumEvaluation(evaluation({ id: "c3-exam-demo", type: "EXAM" }))).toContain("c3-exam-demo: an EXAM needs a SIMULATION question");

    const simulation: CurriculumQuestionJson = { key: "q2", type: "SIMULATION", prompt: "Programe el ventilador", explanation: SOURCE, clinicalCaseId: "engine-normal-lung", rubric: RUBRIC };

    expect(validateCurriculumEvaluation(evaluation({ id: "c3-exam-demo", type: "EXAM", questions: [choice("q1"), simulation] }))).toEqual([]);
    expect(validateCurriculumQuestion({ ...simulation, rubric: { criteria: [] } }, "EXAM").length).toBeGreaterThan(0);
  });

  it("should keep hints to workshops and reject a single choice without exactly one key", () => {
    expect(validateCurriculumQuestion({ ...choice("q1"), hint: "Piense en la espiración" }, "QUIZ")).toEqual(["hints are only shown in WORKSHOP evaluations"]);
    expect(validateCurriculumQuestion({ ...choice("q1"), options: [{ text: "a", isCorrect: true }, { text: "b", isCorrect: true }] }, "QUIZ")).toEqual([
      "SINGLE_CHOICE needs at least two options and exactly one correct",
    ]);
  });
});

describe("mapCurriculumEvaluation", () => {
  it("should build READY rows with deterministic ids and no immediate results", () => {
    const bundle: ReturnType<typeof mapCurriculumEvaluation> = mapCurriculumEvaluation(evaluation({ scenario: ["Paciente de 60 años"] }), 3);

    expect(bundle.evaluation).toMatchObject({ id: "c3-quiz-demo", status: "READY", showResultsImmediately: false, order: 3, levelId: "level-beginner" });
    expect(bundle.scenario?.id).toBe("c3-quiz-demo:scenario");
    expect(bundle.questions[0]).toMatchObject({ id: "c3-quiz-demo:q1", order: 1, scenarioId: "c3-quiz-demo:scenario", hint: null });
    expect(bundle.questions[0].options.map((option: { id: string }) => option.id)).toEqual(["c3-quiz-demo:q1:a", "c3-quiz-demo:q1:b"]);
  });
});

describe("versioned Block C evaluation files", () => {
  const dir: string = path.join(__dirname, "..", "seed-data", "evaluation-curriculum");
  const files: string[] = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((name: string) => name.endsWith(".json") && name.startsWith("c3-"))
    : [];

  (files.length > 0 ? it.each(files) : it.skip.each(["(no files)"]))("%s should be valid", (name: string) => {
    const json: CurriculumEvaluationJson = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")) as CurriculumEvaluationJson;

    expect(validateCurriculumEvaluation(json)).toEqual([]);
  });

  it("should validate the SIMULATION questions appended to the July exams", () => {
    const file: string = path.join(dir, "july-exam-simulation-questions.json");

    if (!fs.existsSync(file)) {
      return;
    }

    const entries: Record<string, unknown> = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;

    for (const [examId, raw] of Object.entries(entries)) {
      if (examId !== "sources") {
        expect({ examId, errors: validateCurriculumQuestion({ ...(raw as CurriculumQuestionJson), key: "c3-simulation" }, "EXAM") }).toEqual({ examId, errors: [] });
      }
    }
  });
});
