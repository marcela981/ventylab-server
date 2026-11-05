/*
 * Funcionalidad: Mapeador de evaluaciones alineadas con el currículo (ajustes C3)
 * Descripción: Reglas puras de la importación de evaluaciones: correspondencia de los moduleId de julio con los módulos vigentes del currículo del Bloque B (_coord/curriculo-ids.md), nivel vigente según la ruta y el nivel de la carpeta de julio, conversión de las evaluaciones nuevas del Bloque C (JSON con preguntas de selección, abiertas y de simulación, pista, explicación con fuente y fuentes APA) a filas con ids deterministas, y validación previa (opciones correctas por tipo, rúbrica de simulación válida, explicación con fuente). Todas las evaluaciones quedan en READY y sin asignar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { validateSimulationRubric } from "../../src/features/evaluation/domain/value-objects/simulation-rubric";
import { type RichTextNode, toRichText } from "./evaluation-seed.mapper";

export type CurriculumEvaluationType = "QUIZ" | "WORKSHOP" | "EXAM";
export type CurriculumQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "OPEN_TEXT" | "SIMULATION";

// July JSON moduleId -> live module id (_coord/curriculo-ids.md v1). Archived July VentyLab modules map to null: the
// evaluation keeps only its level.
export const JULY_MODULE_MAP: Readonly<Record<string, string | null>> = {
  "module-01-inversion-fisiologica": "module-01-inversion-fisiologica",
  "module-02-ecuacion-movimiento": "module-02-ecuacion-movimiento",
  "module-03-variables-fase": "module-03-variables-fase",
  "module-04-modos-ventilatorios": "module-04-modos-ventilatorios",
  "module-05-monitorizacion-grafica": "module-05-monitorizacion-grafica",
  "module-06-efectos-sistemicos": "module-06-efectos-sistemicos",
  "module-01-Ventilacion-vcv-vs-pcv": "module-01-vcv-vs-pcv",
  "module-02-peep-optimizar-oxigenacion": "module-02-peep-optimizar-oxigenacion",
  "module-03-soporte-PSV-CPAP": "module-03-soporte-psv-cpap",
  "module-04-duales-simv": "module-04-duales-simv",
  "module-05-graficas-fine-tuning": "module-05-graficas-fine-tuning",
  "module-06-avanzado-evaluacion-destete": "module-06-avanzado-evaluacion-destete",
  "module-01-daño-pulmonar-vili-ventilacion-protectora": "module-01-vili-ventilacion-protectora",
  "module-02-monitorizacion-alto-nivel": "module-02-monitorizacion-alto-nivel",
  "module-03-advertencias-asincronias-situaciones-complejas": "module-03-advertencias-asincronias",
  "module-04-destete-complejo-vmni": "module-04-destete-complejo-vmni",
  "module-05-obesidad-sedentarismo": "module-05-obesidad-sedentarismo",
  "module-06-epoc-asma-fumadores": "module-06-epoc-asma-fumadores",
  "module-07-sdra": "module-07-sdra",
  "module-08-recuperacion-proteccion": "module-08-recuperacion-proteccion",
  ventilador_compontentes: "ventylab-module-02-ventilador-componentes",
  programación_modo_clasicos: "ventylab-module-03-programacion-modos",
  historia_fisiología_aplicada: null,
  ventilaciónnoinvasiva_destete: null,
  raciocinioclínico_patologíascríticas: null,
  innovación_tecnología_gestión: null,
};

const LEVEL_BY_TRACK: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  mecanica: { principiante: "level-beginner", intermedio: "level-intermedio", avanzado: "level-avanzado" },
  ventylab: { principiante: "ventylab-principiante", intermedio: "ventylab-intermedio", avanzado: "ventylab-avanzado" },
};

/** Live module of a July moduleId: undefined when the id is not a July module ref (e.g. "level01-talleres"). */
export function liveModuleFor(julyModuleId: string): string | null | undefined {
  return Object.prototype.hasOwnProperty.call(JULY_MODULE_MAP, julyModuleId) ? JULY_MODULE_MAP[julyModuleId] : undefined;
}

/** Live level from the July folder path segments, e.g. ["quizzes", "mecanica", "intermedio", "peep.json"]. */
export function liveLevelForJulyPath(segments: readonly string[]): string | null {
  for (let index = 0; index < segments.length - 1; index++) {
    const track: Readonly<Record<string, string>> | undefined = LEVEL_BY_TRACK[segments[index]];
    const level: string | undefined = track?.[segments[index + 1]];

    if (level !== undefined) {
      return level;
    }
  }

  return null;
}

export interface CurriculumOptionJson {
  text: string;
  isCorrect: boolean;
}

export interface CurriculumQuestionJson {
  key: string;
  type: CurriculumQuestionType;
  prompt: string;
  points?: number;
  hint?: string;
  explanation: string;
  options?: CurriculumOptionJson[];
  clinicalCaseId?: string;
  rubric?: unknown;
}

export interface CurriculumEvaluationJson {
  id: string;
  type: CurriculumEvaluationType;
  title: string;
  description: string;
  levelId: string;
  moduleId: string | null;
  durationMinutes?: number | null;
  scenario?: string[] | null;
  questions: CurriculumQuestionJson[];
  sources: string[];
}

export interface CurriculumOptionRow {
  id: string;
  questionId: string;
  order: number;
  content: string;
  isCorrect: boolean;
}

export interface CurriculumQuestionRow {
  id: string;
  evaluationId: string;
  scenarioId: string | null;
  order: number;
  type: CurriculumQuestionType;
  prompt: RichTextNode;
  points: number;
  explanation: string;
  hint: string | null;
  clinicalCaseId: string | null;
  rubric: unknown;
  options: CurriculumOptionRow[];
}

export interface CurriculumEvaluationBundle {
  evaluation: {
    id: string;
    type: CurriculumEvaluationType;
    title: string;
    description: string;
    moduleId: string | null;
    levelId: string;
    durationMinutes: number | null;
    maxAttempts: number;
    shuffleQuestions: boolean;
    showResultsImmediately: boolean;
    status: "READY";
    order: number;
  };
  scenario: { id: string; evaluationId: string; order: number; content: RichTextNode } | null;
  questions: CurriculumQuestionRow[];
}

const CHOICE_TYPES: readonly CurriculumQuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"];
const SOURCE_SUFFIX: RegExp = /Fuente:\s*\S.*\(\d{4}[a-z]?\)\.?\s*$/u;

/** Every problem that would keep an evaluation from being READY or from meeting the content rules (empty = valid). */
export function validateCurriculumEvaluation(json: CurriculumEvaluationJson): string[] {
  const errors: string[] = [];
  const prefix: string = json.id;

  if (!json.id.startsWith("c3-")) {
    errors.push(`${prefix}: Block C ids start with "c3-"`);
  }

  if (json.questions.length === 0) {
    errors.push(`${prefix}: no questions`);
  }

  if (json.sources.length === 0) {
    errors.push(`${prefix}: no sources`);
  }

  if (json.type === "EXAM" && !json.questions.some((question: CurriculumQuestionJson) => question.type === "SIMULATION")) {
    errors.push(`${prefix}: an EXAM needs a SIMULATION question`);
  }

  for (const question of json.questions) {
    errors.push(...validateCurriculumQuestion(question, json.type).map((error: string) => `${prefix}/${question.key}: ${error}`));
  }

  const keys: string[] = json.questions.map((question: CurriculumQuestionJson) => question.key);

  if (new Set(keys).size !== keys.length) {
    errors.push(`${prefix}: duplicated question keys`);
  }

  return errors;
}

export function validateCurriculumQuestion(question: CurriculumQuestionJson, evaluationType: CurriculumEvaluationType): string[] {
  const errors: string[] = [];
  const options: CurriculumOptionJson[] = question.options ?? [];
  const correct: number = options.filter((option: CurriculumOptionJson) => option.isCorrect).length;

  if (!SOURCE_SUFFIX.test(question.explanation.trim())) {
    errors.push('explanation must end with "Fuente: <autor> (<año>)."');
  }

  if (question.hint !== undefined && evaluationType !== "WORKSHOP") {
    errors.push("hints are only shown in WORKSHOP evaluations");
  }

  if (question.type === "SINGLE_CHOICE" && (options.length < 2 || correct !== 1)) {
    errors.push("SINGLE_CHOICE needs at least two options and exactly one correct");
  }

  if (question.type === "TRUE_FALSE" && (options.length !== 2 || correct !== 1)) {
    errors.push("TRUE_FALSE needs two options and exactly one correct");
  }

  if (question.type === "MULTIPLE_CHOICE" && correct < 1) {
    errors.push("MULTIPLE_CHOICE needs a correct option");
  }

  if (!CHOICE_TYPES.includes(question.type) && options.length > 0) {
    errors.push(`${question.type} takes no options`);
  }

  if (question.type === "SIMULATION") {
    if (question.clinicalCaseId === undefined || question.clinicalCaseId === "") {
      errors.push("SIMULATION needs a clinicalCaseId");
    }

    errors.push(...validateSimulationRubric(question.rubric).errors);
  }

  if ((question.points ?? 1) <= 0) {
    errors.push("points must be positive");
  }

  return errors;
}

export function curriculumQuestionId(evaluationId: string, key: string): string {
  return `${evaluationId}:${key}`;
}

export function mapCurriculumQuestion(evaluationId: string, question: CurriculumQuestionJson, order: number, scenarioId: string | null): CurriculumQuestionRow {
  const id: string = curriculumQuestionId(evaluationId, question.key);

  return {
    id,
    evaluationId,
    scenarioId,
    order,
    type: question.type,
    prompt: toRichText([question.prompt]),
    points: question.points ?? 1,
    explanation: question.explanation.trim(),
    hint: question.hint?.trim() ? question.hint.trim() : null,
    clinicalCaseId: question.type === "SIMULATION" ? (question.clinicalCaseId ?? null) : null,
    rubric: question.type === "SIMULATION" ? (validateSimulationRubric(question.rubric).rubric ?? null) : null,
    options: (question.options ?? []).map((option: CurriculumOptionJson, index: number): CurriculumOptionRow => ({
      id: `${id}:${String.fromCharCode(97 + index)}`,
      questionId: id,
      order: index + 1,
      content: option.text,
      isCorrect: option.isCorrect,
    })),
  };
}

export function mapCurriculumEvaluation(json: CurriculumEvaluationJson, order: number): CurriculumEvaluationBundle {
  const scenarioId: string | null = json.scenario && json.scenario.length > 0 ? `${json.id}:scenario` : null;

  return {
    evaluation: {
      id: json.id,
      type: json.type,
      title: json.title,
      description: json.description,
      moduleId: json.moduleId,
      levelId: json.levelId,
      durationMinutes: json.durationMinutes ?? null,
      maxAttempts: 1,
      shuffleQuestions: false,
      // Kept for the column; no type publishes without the teacher release (ajustes C1).
      showResultsImmediately: false,
      status: "READY",
      order,
    },
    scenario: scenarioId === null ? null : { id: scenarioId, evaluationId: json.id, order: 1, content: toRichText(json.scenario ?? []) },
    questions: json.questions.map((question: CurriculumQuestionJson, index: number) => mapCurriculumQuestion(json.id, question, index + 1, question.type === "SIMULATION" ? null : scenarioId)),
  };
}
