/*
 * Funcionalidad: Comando UpdateEvaluationQuestionCommand
 * Descripción: Intención de editar una pregunta (campos omitidos no cambian; null limpia); lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { type EvaluationQuestionTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-question-type";

export class UpdateEvaluationQuestionCommand {
  public readonly evaluationId: string;
  public readonly questionId: string;
  public readonly actor: EvaluationActor;
  public readonly type?: EvaluationQuestionTypeValue;
  public readonly prompt?: unknown;
  public readonly points?: number;
  public readonly explanation?: string | null;
  public readonly scenarioId?: string | null;
  public readonly mediaIds?: string[];
  public readonly clinicalCaseId?: string | null;
  public readonly rubric?: Record<string, unknown> | null;

  public constructor({ evaluationId, questionId, actor, type, prompt, points, explanation, scenarioId, mediaIds, clinicalCaseId, rubric }: { evaluationId: string; questionId: string; actor: EvaluationActor; type?: EvaluationQuestionTypeValue; prompt?: unknown; points?: number; explanation?: string | null; scenarioId?: string | null; mediaIds?: string[]; clinicalCaseId?: string | null; rubric?: Record<string, unknown> | null }) {
    this.evaluationId = evaluationId;
    this.questionId = questionId;
    this.actor = actor;
    this.type = type;
    this.prompt = prompt;
    this.points = points;
    this.explanation = explanation;
    this.scenarioId = scenarioId;
    this.mediaIds = mediaIds;
    this.clinicalCaseId = clinicalCaseId;
    this.rubric = rubric;
  }
}
