/*
 * Funcionalidad: Filas de retroalimentación de calificación
 * Descripción: Funciones puras sobre las filas GradeFeedback de un intento: clave del candado por intento, fila global PENDING reservada, filas READY (global con el id reservado y una por pregunta) a partir de la retroalimentación generada, separación global/por pregunta y detección de retroalimentación vigente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { generateId } from "@/common/domain/utils/generate-id";
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";
import {
  DETERMINISTIC_FEEDBACK_SOURCE,
  type GeneratedGradeFeedback,
  type QuestionFeedback,
} from "@/features/evaluation/domain/value-objects/grade-feedback";
import {
  isActiveGradeFeedbackStatus,
  PENDING_FEEDBACK_STATUS,
  READY_FEEDBACK_STATUS,
} from "@/features/evaluation/domain/value-objects/grade-feedback-status";

export interface SplitGradeFeedback {
  readonly overall?: GradeFeedbackRecord;
  readonly questions: GradeFeedbackRecord[];
}

export function gradeFeedbackLockKey(attemptId: string): string {
  return `evaluations:grade-feedback:${attemptId}`;
}

export function createPendingGradeFeedback(attemptId: string, now: Date): GradeFeedbackRecord {
  // The column is NOT NULL; a pending row carries a placeholder source that is never exposed until READY
  return {
    id: generateId(),
    attemptId,
    content: "",
    source: DETERMINISTIC_FEEDBACK_SOURCE,
    status: PENDING_FEEDBACK_STATUS,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildReadyGradeFeedback(attemptId: string, overallId: string, generated: GeneratedGradeFeedback, now: Date): GradeFeedbackRecord[] {
  const base: Omit<GradeFeedbackRecord, "id" | "questionId" | "content"> = {
    attemptId,
    source: generated.source,
    provider: generated.provider,
    model: generated.model,
    status: READY_FEEDBACK_STATUS,
    createdAt: now,
    updatedAt: now,
  };

  return [
    { ...base, id: overallId, content: generated.overall },
    ...generated.perQuestion.map((question: QuestionFeedback) => ({ ...base, id: generateId(), questionId: question.questionId, content: question.content })),
  ];
}

export function splitGradeFeedback(records: ReadonlyArray<GradeFeedbackRecord>): SplitGradeFeedback {
  return {
    overall: records.find((record: GradeFeedbackRecord) => record.questionId === undefined),
    questions: records.filter((record: GradeFeedbackRecord) => record.questionId !== undefined),
  };
}

export function hasActiveGradeFeedback(records: ReadonlyArray<GradeFeedbackRecord>): boolean {
  const overall: GradeFeedbackRecord | undefined = splitGradeFeedback(records).overall;

  return overall !== undefined && isActiveGradeFeedbackStatus(overall.status);
}
