/*
 * Funcionalidad: Mapeador de persistencia de evaluaciones
 * Descripción: Convierte las filas Prisma de evaluaciones, escenarios, preguntas y opciones al agregado Evaluation (null → undefined, JSON no documental envuelto como párrafo) y los registros del agregado a entradas de escritura Prisma (undefined → null, JSON nulo como Prisma.DbNull), conservando las columnas heredadas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type Evaluation as EvaluationModel,
  type EvaluationQuestion as EvaluationQuestionModel,
  type EvaluationQuestionOption as EvaluationQuestionOptionModel,
  type EvaluationScenario as EvaluationScenarioModel,
  Prisma,
} from "@prisma/client";

import {
  type EvaluationOptionItem,
  type EvaluationQuestionItem,
  type EvaluationScenarioItem,
} from "@/features/evaluation/domain/entities/evaluation-items";
import { Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationRichTextDocument } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";

export type EvaluationQuestionRow = EvaluationQuestionModel & { options: EvaluationQuestionOptionModel[] };

export type EvaluationRow = EvaluationModel & {
  scenarios: EvaluationScenarioModel[];
  questions: EvaluationQuestionRow[];
};

export const EVALUATION_GRAPH_INCLUDE: {
  scenarios: { orderBy: { order: "asc" } };
  questions: { orderBy: { order: "asc" }; include: { options: { orderBy: { order: "asc" } } } };
} = {
  scenarios: { orderBy: { order: "asc" } },
  questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" } } } },
};

function toDocument(value: Prisma.JsonValue): EvaluationRichTextDocument {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value;
  }

  const text: string = value === null ? "" : String(value);

  return { type: "doc", content: text.length > 0 ? [{ type: "paragraph", content: [{ type: "text", text }] }] : [] };
}

function toJsonInput(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return value === undefined || value === null ? Prisma.DbNull : value;
}

export class EvaluationsMapper {
  public static toDomain(row: EvaluationRow): Evaluation {
    return Evaluation.reconstitute({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description ?? undefined,
      moduleId: row.moduleId ?? undefined,
      levelId: row.levelId ?? undefined,
      lessonId: row.lessonId ?? undefined,
      durationMinutes: row.durationMinutes ?? undefined,
      maxAttempts: row.maxAttempts,
      shuffleQuestions: row.shuffleQuestions,
      showResultsImmediately: row.showResultsImmediately,
      status: row.status,
      order: row.order,
      createdById: row.createdById ?? undefined,
      legacy: {
        source: row.legacySource ?? undefined,
        type: row.legacyType ?? undefined,
        passingScore: row.legacyPassingScore ?? undefined,
        maxScore: row.legacyMaxScore ?? undefined,
        dueDate: row.legacyDueDate ?? undefined,
        moduleRef: row.legacyModuleRef ?? undefined,
        instructions: row.legacyInstructions ?? undefined,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      scenarios: row.scenarios.map((scenario: EvaluationScenarioModel) => EvaluationsMapper._toScenario(scenario)),
      questions: row.questions.map((question: EvaluationQuestionRow) => EvaluationsMapper._toQuestion(question)),
      auditLogs: [],
    });
  }

  public static toPersistence(evaluation: Evaluation): Prisma.EvaluationUncheckedCreateInput {
    return {
      id: evaluation.id,
      type: evaluation.type,
      title: evaluation.title,
      description: evaluation.description ?? null,
      moduleId: evaluation.moduleId ?? null,
      levelId: evaluation.levelId ?? null,
      lessonId: evaluation.lessonId ?? null,
      durationMinutes: evaluation.durationMinutes ?? null,
      maxAttempts: evaluation.maxAttempts,
      shuffleQuestions: evaluation.shuffleQuestions,
      showResultsImmediately: evaluation.showResultsImmediately,
      status: evaluation.status,
      order: evaluation.order,
      createdById: evaluation.createdById ?? null,
      legacySource: evaluation.legacy.source ?? null,
      legacyType: evaluation.legacy.type ?? null,
      legacyPassingScore: evaluation.legacy.passingScore ?? null,
      legacyMaxScore: evaluation.legacy.maxScore ?? null,
      legacyDueDate: evaluation.legacy.dueDate ?? null,
      legacyModuleRef: evaluation.legacy.moduleRef ?? null,
      legacyInstructions: evaluation.legacy.instructions ?? null,
      createdAt: evaluation.createdAt,
      updatedAt: evaluation.updatedAt,
    };
  }

  public static toScenarioPersistence(scenario: EvaluationScenarioItem): Prisma.EvaluationScenarioUncheckedCreateInput {
    return {
      id: scenario.id,
      evaluationId: scenario.evaluationId,
      order: scenario.order,
      content: scenario.content as Prisma.InputJsonValue,
      mediaIds: [...scenario.mediaIds],
    };
  }

  public static toQuestionPersistence(question: EvaluationQuestionItem): Prisma.EvaluationQuestionUncheckedCreateInput {
    return {
      id: question.id,
      evaluationId: question.evaluationId,
      scenarioId: question.scenarioId ?? null,
      order: question.order,
      type: question.type,
      prompt: question.prompt as Prisma.InputJsonValue,
      mediaIds: [...question.mediaIds],
      points: question.points,
      explanation: question.explanation ?? null,
      clinicalCaseId: question.clinicalCaseId ?? null,
      rubric: toJsonInput(question.rubric),
      legacyType: question.legacyType ?? null,
      legacyRef: question.legacyRef ?? null,
    };
  }

  public static toOptionPersistence(option: EvaluationOptionItem): Prisma.EvaluationQuestionOptionUncheckedCreateInput {
    return {
      id: option.id,
      questionId: option.questionId,
      order: option.order,
      content: option.content,
      mediaId: option.mediaId ?? null,
      isCorrect: option.isCorrect,
      legacyFeedback: option.legacyFeedback ?? null,
      legacyRef: option.legacyRef ?? null,
    };
  }

  private static _toScenario(row: EvaluationScenarioModel): EvaluationScenarioItem {
    return {
      id: row.id,
      evaluationId: row.evaluationId,
      order: row.order,
      content: toDocument(row.content),
      mediaIds: row.mediaIds,
    };
  }

  private static _toQuestion(row: EvaluationQuestionRow): EvaluationQuestionItem {
    return {
      id: row.id,
      evaluationId: row.evaluationId,
      scenarioId: row.scenarioId ?? undefined,
      order: row.order,
      type: row.type,
      prompt: toDocument(row.prompt),
      mediaIds: row.mediaIds,
      points: row.points,
      explanation: row.explanation ?? undefined,
      clinicalCaseId: row.clinicalCaseId ?? undefined,
      rubric: row.rubric ?? undefined,
      legacyType: row.legacyType ?? undefined,
      legacyRef: row.legacyRef ?? undefined,
      options: row.options.map((option: EvaluationQuestionOptionModel) => ({
        id: option.id,
        questionId: option.questionId,
        order: option.order,
        content: option.content,
        mediaId: option.mediaId ?? undefined,
        isCorrect: option.isCorrect,
        legacyFeedback: option.legacyFeedback ?? undefined,
        legacyRef: option.legacyRef ?? undefined,
      })),
    };
  }
}
