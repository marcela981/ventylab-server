/*
 * Funcionalidad: Mapeo del seed de evaluaciones
 * Descripción: Funciones puras que convierten los JSON de prisma/seed-data/evaluation (quizzes, exámenes y talleres) en filas de evaluations, evaluation_scenarios, evaluation_questions y evaluation_question_options con los mismos ids, la misma forma TipTap y los mismos campos legacy_* que produce la migración 20261007120000_evaluation_feature a partir de las tablas congeladas quizzes y activities
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

export type SeedEvaluationType = "EXAM" | "QUIZ" | "WORKSHOP";
export type SeedQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";
export type SeedActivityType = "EXAM" | "TALLER";

export interface RichTextNode {
  type: string;
  text?: string;
  content?: RichTextNode[];
}

export interface EvalJson {
  id: string;
  type: string;
  title: string;
  description: string;
  moduleId: string;
  level: string;
  passingScore: number;
  questions: unknown[];
  caseStudy?: unknown;
}

export interface SeedEvaluationRow {
  id: string;
  type: SeedEvaluationType;
  title: string;
  description: string | null;
  moduleId: string | null;
  levelId: string | null;
  lessonId: null;
  durationMinutes: null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  showResultsImmediately: boolean;
  status: "READY";
  order: number;
  createdById: string | null;
  legacySource: "quiz" | "activity";
  legacyType: SeedActivityType | null;
  legacyPassingScore: number | null;
  legacyMaxScore: number | null;
  legacyDueDate: null;
  legacyModuleRef: string | null;
  legacyInstructions: string | null;
}

export interface SeedScenarioRow {
  id: string;
  evaluationId: string;
  order: number;
  content: RichTextNode;
  mediaIds: string[];
}

export interface SeedOptionRow {
  id: string;
  questionId: string;
  order: number;
  content: string;
  mediaId: null;
  isCorrect: boolean;
  legacyFeedback: string | null;
  legacyRef: string | null;
}

export interface SeedQuestionRow {
  id: string;
  evaluationId: string;
  scenarioId: string | null;
  order: number;
  type: SeedQuestionType;
  prompt: RichTextNode;
  mediaIds: string[];
  points: number;
  explanation: string | null;
  clinicalCaseId: null;
  legacyType: string | null;
  legacyRef: string | null;
  options: SeedOptionRow[];
}

export interface SeedEvaluationBundle {
  evaluation: SeedEvaluationRow;
  scenario: SeedScenarioRow | null;
  questions: SeedQuestionRow[];
}

export interface QuizSeedContext {
  moduleRef: string;
  moduleExists: boolean;
  order: number;
}

export interface ActivitySeedContext {
  moduleExists: boolean;
  levelExists: boolean;
  createdById: string | null;
}

export const ACTIVITY_MAX_SCORE: number = 100;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Mirrors PostgreSQL `jsonb ->> key`: strings as-is, scalars as text, JSON null or a missing key as SQL NULL.
export function jsonText(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function field(source: unknown, key: string): unknown {
  return isObject(source) ? source[key] : undefined;
}

// Mirrors pg_temp.evaluation_json_array: an array, or a JSON string holding one, else [].
export function jsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

// Mirrors pg_temp.evaluation_json_true: JSON true or the string "true" in any casing.
export function jsonTrue(value: unknown): boolean {
  return value === true || (typeof value === "string" && value.toLowerCase() === "true");
}

// Mirrors pg_temp.evaluation_rich_text: one paragraph per non-empty text, one empty paragraph otherwise.
export function toRichText(texts: (string | null)[]): RichTextNode {
  const paragraphs: RichTextNode[] = texts
    .filter((text: string | null): text is string => text !== null && text !== "")
    .map((text: string): RichTextNode => ({ type: "paragraph", content: [{ type: "text", text }] }));

  return { type: "doc", content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph" }] };
}

// Mirrors the question/option id rule: '<parentId>:<jsonId>' when the JSON id is present and unique among its siblings, else '<parentId>:#<ordinality>'.
function childIds(parentId: string, items: unknown[]): { id: string; legacyRef: string | null }[] {
  const refs: (string | null)[] = items.map((item: unknown): string | null => {
    const ref: string | null = jsonText(field(item, "id"));

    return ref === "" ? null : ref;
  });

  return refs.map((ref: string | null, index: number) => {
    const unique: boolean = ref !== null && refs.filter((other: string | null) => other === ref).length === 1;

    return { id: `${parentId}:${unique && ref !== null ? ref : `#${index + 1}`}`, legacyRef: ref };
  });
}

function questionType(question: unknown, options: unknown[]): SeedQuestionType {
  if (jsonText(field(question, "type")) === "true_false") {
    return "TRUE_FALSE";
  }

  const correctCount: number = options.filter((option: unknown) => jsonTrue(field(option, "isCorrect"))).length;

  return correctCount > 1 ? "MULTIPLE_CHOICE" : "SINGLE_CHOICE";
}

export function mapQuestions(evaluationId: string, questions: unknown[], scenarioId: string | null): SeedQuestionRow[] {
  const questionIds: { id: string; legacyRef: string | null }[] = childIds(evaluationId, questions);

  return questions.map((question: unknown, index: number): SeedQuestionRow => {
    const { id, legacyRef } = questionIds[index];
    const options: unknown[] = jsonArray(field(question, "options"));
    const optionIds: { id: string; legacyRef: string | null }[] = childIds(id, options);

    return {
      id,
      evaluationId,
      scenarioId,
      order: index + 1,
      type: questionType(question, options),
      prompt: toRichText([jsonText(field(question, "text")) ?? jsonText(field(question, "question"))]),
      mediaIds: [],
      points: 1,
      explanation: jsonText(field(question, "explanation")),
      clinicalCaseId: null,
      legacyType: jsonText(field(question, "type")),
      legacyRef,
      options: options.map((option: unknown, optionIndex: number): SeedOptionRow => ({
        id: optionIds[optionIndex].id,
        questionId: id,
        order: optionIndex + 1,
        content: jsonText(field(option, "text")) ?? jsonText(field(option, "label")) ?? "",
        mediaId: null,
        isCorrect: jsonTrue(field(option, "isCorrect")),
        legacyFeedback: jsonText(field(option, "feedback")),
        legacyRef: optionIds[optionIndex].legacyRef,
      })),
    };
  });
}

export function mapQuizSeed(json: EvalJson, context: QuizSeedContext): SeedEvaluationBundle {
  return {
    evaluation: {
      id: json.id,
      type: "QUIZ",
      title: json.title,
      description: json.description,
      moduleId: context.moduleExists ? context.moduleRef : null,
      levelId: null,
      lessonId: null,
      durationMinutes: null,
      maxAttempts: 1,
      shuffleQuestions: false,
      showResultsImmediately: true,
      status: "READY",
      order: context.order,
      createdById: null,
      legacySource: "quiz",
      legacyType: null,
      legacyPassingScore: json.passingScore,
      legacyMaxScore: null,
      legacyDueDate: null,
      legacyModuleRef: context.moduleRef,
      legacyInstructions: null,
    },
    scenario: null,
    questions: mapQuestions(json.id, jsonArray(json.questions), null),
  };
}

// Same JSON text the legacy seed stored in activities.instructions; the migration keeps it verbatim.
export function activityInstructions(json: EvalJson, activityType: SeedActivityType): string {
  const document: JsonObject =
    activityType === "TALLER"
      ? { moduleId: json.moduleId, level: json.level, passingScore: json.passingScore, caseStudy: json.caseStudy ?? null, questions: json.questions }
      : { moduleId: json.moduleId, level: json.level, passingScore: json.passingScore, questions: json.questions };

  return JSON.stringify(document, null, 2);
}

export function mapActivitySeed(json: EvalJson, activityType: SeedActivityType, context: ActivitySeedContext): SeedEvaluationBundle {
  const instructions: string = activityInstructions(json, activityType);
  const document: JsonObject = JSON.parse(instructions) as JsonObject;
  const moduleRef: string | null = jsonText(document.moduleId);
  const caseStudy: unknown = document.caseStudy;
  const scenarioId: string | null = isObject(caseStudy) ? `${json.id}:scenario` : null;

  return {
    evaluation: {
      id: json.id,
      type: activityType === "EXAM" ? "EXAM" : "WORKSHOP",
      title: json.title,
      description: json.description,
      moduleId: context.moduleExists ? moduleRef : null,
      levelId: context.levelExists ? jsonText(document.level) : null,
      lessonId: null,
      durationMinutes: null,
      maxAttempts: 1,
      shuffleQuestions: false,
      showResultsImmediately: false,
      status: "READY",
      order: 0,
      createdById: context.createdById,
      legacySource: "activity",
      legacyType: activityType,
      legacyPassingScore: typeof document.passingScore === "number" ? document.passingScore : null,
      legacyMaxScore: ACTIVITY_MAX_SCORE,
      legacyDueDate: null,
      legacyModuleRef: moduleRef,
      legacyInstructions: instructions,
    },
    scenario:
      scenarioId === null
        ? null
        : {
          id: scenarioId,
          evaluationId: json.id,
          order: 1,
          content: toRichText([jsonText(field(caseStudy, "patient")), jsonText(field(caseStudy, "scenario")), jsonText(field(caseStudy, "objective"))]),
          mediaIds: [],
        },
    questions: mapQuestions(json.id, jsonArray(document.questions), scenarioId),
  };
}
