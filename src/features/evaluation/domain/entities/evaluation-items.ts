/*
 * Funcionalidad: Elementos internos del agregado Evaluation
 * Descripción: Registros inmutables de escenarios, preguntas y opciones que solo se alcanzan a través del agregado Evaluation, más los datos heredados que se conservan sin cambios y las entradas de reordenamiento pendientes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationQuestionTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-question-type";
import { type EvaluationRichTextDocument } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";

export interface EvaluationScenarioItem {
  readonly id: string;
  readonly evaluationId: string;
  readonly order: number;
  readonly content: EvaluationRichTextDocument;
  readonly mediaIds: ReadonlyArray<string>;
}

export interface EvaluationOptionItem {
  readonly id: string;
  readonly questionId: string;
  readonly order: number;
  readonly content: string;
  readonly mediaId?: string;
  readonly isCorrect: boolean;
  readonly legacyFeedback?: string;
  readonly legacyRef?: string;
}

export interface EvaluationQuestionItem {
  readonly id: string;
  readonly evaluationId: string;
  readonly scenarioId?: string;
  readonly order: number;
  readonly type: EvaluationQuestionTypeValue;
  readonly prompt: EvaluationRichTextDocument;
  readonly mediaIds: ReadonlyArray<string>;
  readonly points: number;
  readonly explanation?: string;
  readonly clinicalCaseId?: string;
  readonly rubric?: unknown;
  readonly legacyType?: string;
  readonly legacyRef?: string;
  readonly options: ReadonlyArray<EvaluationOptionItem>;
}

export interface EvaluationLegacyData {
  readonly source?: string;
  readonly type?: string;
  readonly passingScore?: number;
  readonly maxScore?: number;
  readonly dueDate?: Date;
  readonly moduleRef?: string;
  readonly instructions?: string;
}

export interface OrderEntry {
  readonly id: string;
  readonly order: number;
}

export interface QuestionOrderEntry extends OrderEntry {
  readonly scenarioId?: string;
  readonly setScenario: boolean;
}

export interface OptionOrderBatch {
  readonly questionId: string;
  readonly entries: ReadonlyArray<OrderEntry>;
}

export interface EvaluationPendingChanges {
  readonly scenarios: ReadonlyArray<EvaluationScenarioItem>;
  readonly questions: ReadonlyArray<EvaluationQuestionItem>;
  readonly options: ReadonlyArray<EvaluationOptionItem>;
  readonly removedScenarioIds: ReadonlyArray<string>;
  readonly removedQuestionIds: ReadonlyArray<string>;
  readonly removedOptionIds: ReadonlyArray<string>;
  readonly questionOrder?: ReadonlyArray<QuestionOrderEntry>;
  readonly scenarioOrder?: ReadonlyArray<OrderEntry>;
  readonly optionOrders: ReadonlyArray<OptionOrderBatch>;
}
